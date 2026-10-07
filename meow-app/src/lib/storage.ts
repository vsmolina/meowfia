import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { env, features } from "@/lib/env";

/**
 * File storage abstraction.
 *  - Keys starting with "private/" are never publicly served (template PDFs, commission photos).
 *  - Everything else is public (images) and is served at `publicUrl(key)`.
 *
 * Drivers: `local` (./storage on disk, served via /media/[...key]) and
 * `s3` (AWS S3 or Cloudflare R2, any S3-compatible endpoint).
 */
export interface StorageDriver {
  /** URL the browser can PUT a file to directly (bypasses serverless body limits) */
  presignPut(key: string, contentType: string): Promise<{ url: string; headers: Record<string, string> }>;
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<{ body: Buffer; contentType: string } | null>;
  /** Stream for large files (PDF downloads) */
  stream(key: string): Promise<{ stream: ReadableStream; contentType: string; size?: number } | null>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".zip": "application/zip",
};

export function contentTypeFor(key: string) {
  return CONTENT_TYPES[path.extname(key).toLowerCase()] ?? "application/octet-stream";
}

export function assertSafeKey(key: string) {
  if (!key || key.includes("..") || key.startsWith("/") || key.includes("\\") || key.includes("\0")) {
    throw new Error(`Unsafe storage key: ${key}`);
  }
}

// Local disk is for development only (production uses S3/R2), so exclude it from output tracing.
export const LOCAL_STORAGE_ROOT = path.resolve(/*turbopackIgnore: true*/ process.cwd(), env.LOCAL_STORAGE_DIR ?? "storage");

class LocalDriver implements StorageDriver {
  async presignPut(key: string, contentType: string) {
    assertSafeKey(key);
    const { localUploadUrl } = await import("@/lib/upload-sign");
    return { url: localUploadUrl(key, contentType), headers: { "Content-Type": contentType } };
  }
  private resolve(key: string) {
    assertSafeKey(key);
    const full = path.resolve(/*turbopackIgnore: true*/ LOCAL_STORAGE_ROOT, key);
    if (!full.startsWith(LOCAL_STORAGE_ROOT + path.sep)) throw new Error("Path traversal blocked");
    return full;
  }
  async put(key: string, body: Buffer) {
    const full = this.resolve(key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, body);
  }
  async get(key: string) {
    try {
      const body = await fs.readFile(this.resolve(key));
      return { body, contentType: contentTypeFor(key) };
    } catch {
      return null;
    }
  }
  async stream(key: string) {
    try {
      const full = this.resolve(key);
      const stat = await fs.stat(full);
      const { createReadStream } = await import("node:fs");
      const stream = Readable.toWeb(createReadStream(full)) as ReadableStream;
      return { stream, contentType: contentTypeFor(key), size: stat.size };
    } catch {
      return null;
    }
  }
  async delete(key: string) {
    await fs.rm(this.resolve(key), { force: true });
  }
  async exists(key: string) {
    try {
      await fs.access(this.resolve(key));
      return true;
    } catch {
      return false;
    }
  }
}

class S3Driver implements StorageDriver {
  private clientPromise = (async () => {
    const { S3Client } = await import("@aws-sdk/client-s3");
    return new S3Client({
      region: env.S3_REGION ?? "auto",
      endpoint: env.S3_ENDPOINT,
      credentials: { accessKeyId: env.S3_ACCESS_KEY_ID!, secretAccessKey: env.S3_SECRET_ACCESS_KEY! },
    });
  })();
  private bucket = env.S3_BUCKET!;

  async presignPut(key: string, contentType: string) {
    assertSafeKey(key);
    const [{ PutObjectCommand }, { getSignedUrl }] = await Promise.all([import("@aws-sdk/client-s3"), import("@aws-sdk/s3-request-presigner")]);
    const client = await this.clientPromise;
    const url = await getSignedUrl(client, new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType }), { expiresIn: 600 });
    return { url, headers: { "Content-Type": contentType } };
  }

  async put(key: string, body: Buffer, contentType: string) {
    assertSafeKey(key);
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.clientPromise;
    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: key.startsWith("private/") ? "private, no-store" : "public, max-age=31536000, immutable",
      }),
    );
  }
  async get(key: string) {
    const s = await this.stream(key);
    if (!s) return null;
    const body = Buffer.from(await new Response(s.stream).arrayBuffer());
    return { body, contentType: s.contentType };
  }
  async stream(key: string) {
    assertSafeKey(key);
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.clientPromise;
    try {
      const res = await client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      if (!res.Body) return null;
      return {
        stream: res.Body.transformToWebStream(),
        contentType: res.ContentType ?? contentTypeFor(key),
        size: res.ContentLength,
      };
    } catch {
      return null;
    }
  }
  async delete(key: string) {
    assertSafeKey(key);
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.clientPromise;
    await client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
  async exists(key: string) {
    assertSafeKey(key);
    const { HeadObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.clientPromise;
    try {
      await client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    } catch {
      return false;
    }
  }
}

let driver: StorageDriver | undefined;
export function storage(): StorageDriver {
  if (!driver) {
    if (env.STORAGE_DRIVER === "s3" && !features.s3) {
      console.warn("[storage] STORAGE_DRIVER=s3 but S3 credentials are incomplete. Falling back to local disk.");
    }
    driver = features.s3 ? new S3Driver() : new LocalDriver();
  }
  return driver;
}

export { publicUrl } from "@/lib/media";
