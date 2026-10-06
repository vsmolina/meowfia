import { describe, expect, it } from "vitest";
import { createDownloadToken, verifyDownloadToken } from "./downloads";

const SECRET = "test-secret";

describe("download tokens", () => {
  it("round-trips a valid token", () => {
    const t = createDownloadToken("ent_123", "a4", 60, Date.now(), SECRET);
    expect(verifyDownloadToken(t, Date.now(), SECRET)).toEqual({ entitlementId: "ent_123", format: "a4" });
  });

  it("rejects expired tokens", () => {
    const now = Date.now();
    const t = createDownloadToken("ent_123", "letter", 60, now, SECRET);
    expect(verifyDownloadToken(t, now + 61_000, SECRET)).toBeNull();
  });

  it("rejects tampered payloads", () => {
    const t = createDownloadToken("ent_123", "letter", 60, Date.now(), SECRET);
    const [, sig] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ e: "ent_OTHER", f: "letter", x: 9999999999 })).toString("base64url");
    expect(verifyDownloadToken(`${forged}.${sig}`, Date.now(), SECRET)).toBeNull();
  });

  it("rejects tokens signed with another secret", () => {
    const t = createDownloadToken("ent_123", "letter", 60, Date.now(), "other");
    expect(verifyDownloadToken(t, Date.now(), SECRET)).toBeNull();
  });

  it("rejects garbage", () => {
    expect(verifyDownloadToken("nope", Date.now(), SECRET)).toBeNull();
    expect(verifyDownloadToken("a.b.c", Date.now(), SECRET)).toBeNull();
  });
});
