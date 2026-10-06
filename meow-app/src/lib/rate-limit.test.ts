import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/env", () => ({ env: {}, features: { upstash: false } }));

const { __test } = await import("./rate-limit");

describe("memory rate limiter", () => {
  it("allows up to the limit then blocks", () => {
    __test.memory.clear();
    const results = Array.from({ length: 4 }, () => __test.memoryLimit("k", 3, 60_000).ok);
    expect(results).toEqual([true, true, true, false]);
  });

  it("resets after the window", () => {
    __test.memory.clear();
    vi.useFakeTimers();
    for (let i = 0; i < 3; i++) __test.memoryLimit("w", 3, 1000);
    expect(__test.memoryLimit("w", 3, 1000).ok).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(__test.memoryLimit("w", 3, 1000).ok).toBe(true);
    vi.useRealTimers();
  });
});
