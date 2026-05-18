import { describe, expect, it } from "vitest";
import { normalizeDivision, parseDivisionString } from "../lib/jiujitsu";

describe("division helpers", () => {
  it("normalizes division spacing", () => {
    expect(normalizeDivision(" BLACK /  Master 2  / Male / Light Feather ")).toBe("BLACK / Master 2 / Male / Light Feather");
  });

  it("parses canonical divisions", () => {
    expect(parseDivisionString("BLACK / Master 2 / Male / Light Feather")).toEqual({
      belt: "BLACK",
      age: "Master 2",
      gender: "Male",
      weight: "Light Feather"
    });
  });
});
