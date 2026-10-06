import "server-only";

/**
 * TikTok oEmbed (https://developers.tiktok.com/doc/embed-videos). No API key required.
 * Results are cached for a day. On failure (offline, private video) we return a
 * fallback so the UI can render a styled link card instead.
 */
export type TikTokOEmbed = {
  ok: boolean;
  url: string;
  videoId: string | null;
  title: string | null;
  authorName: string | null;
  authorUrl: string | null;
  thumbnailUrl: string | null;
  thumbnailWidth: number | null;
  thumbnailHeight: number | null;
};

const TIKTOK_URL = /^https:\/\/(www\.|m\.|vm\.|vt\.)?tiktok\.com\//i;

export function isTikTokUrl(url: string) {
  return TIKTOK_URL.test(url);
}

export function tiktokVideoId(url: string): string | null {
  return url.match(/\/video\/(\d{8,25})/)?.[1] ?? null;
}

export async function fetchTikTokOEmbed(url: string): Promise<TikTokOEmbed> {
  const fallback: TikTokOEmbed = {
    ok: false,
    url,
    videoId: tiktokVideoId(url),
    title: null,
    authorName: null,
    authorUrl: null,
    thumbnailUrl: null,
    thumbnailWidth: null,
    thumbnailHeight: null,
  };
  if (!isTikTokUrl(url)) return fallback;
  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, {
      next: { revalidate: 86_400 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return fallback;
    const d = (await res.json()) as Record<string, unknown>;
    return {
      ok: true,
      url,
      videoId: (d.embed_product_id as string) ?? tiktokVideoId(url),
      title: (d.title as string) ?? null,
      authorName: (d.author_name as string) ?? null,
      authorUrl: (d.author_url as string) ?? null,
      thumbnailUrl: (d.thumbnail_url as string) ?? null,
      thumbnailWidth: (d.thumbnail_width as number) ?? null,
      thumbnailHeight: (d.thumbnail_height as number) ?? null,
    };
  } catch {
    return fallback;
  }
}
