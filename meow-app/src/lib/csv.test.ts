import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  it("quotes commas, quotes and newlines", () => {
    expect(toCsv([{ a: 'x,"y"', b: "line\nbreak" }])).toBe('a,b\r\n"x,""y""","line\nbreak"');
  });
  it("neutralizes spreadsheet formulas", () => {
    expect(toCsv([{ a: "=HYPERLINK(1)" }])).toBe("a\r\n'=HYPERLINK(1)");
  });
});
