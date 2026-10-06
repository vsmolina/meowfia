import { describe, expect, it } from "vitest";
import { rankFor } from "./ranks";

describe("rankFor", () => {
  it.each([
    [0, "Private"],
    [1, "Corporal"],
    [2, "Corporal"],
    [3, "Sergeant"],
    [6, "Lieutenant"],
    [10, "Captain"],
    [20, "General"],
    [500, "General"],
  ])("%i approved builds → %s", (n, rank) => {
    expect(rankFor(n).name).toBe(rank);
  });

  it("reports progress to next rank", () => {
    expect(rankFor(4).next).toEqual({ name: "Lieutenant", needed: 2 });
    expect(rankFor(25).next).toBeUndefined();
  });
});
