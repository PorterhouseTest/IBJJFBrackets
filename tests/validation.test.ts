import { describe, expect, it } from "vitest";
import { competitorsSchema, registrationLinksSchema, topPageSchema } from "../lib/jiujitsu";
import links from "../mock/registration-links.json";
import competitors from "../mock/competitors.json";
import top from "../mock/top-page-1.json";

describe("external API validation", () => {
  it("accepts registration link responses", () => {
    expect(registrationLinksSchema.parse(links).links).toHaveLength(1);
  });

  it("accepts competitor responses with nullable optional data", () => {
    expect(competitorsSchema.parse(competitors).competitors[0].name).toBe("Mateo Silva");
  });

  it("accepts top/radar responses", () => {
    expect(topPageSchema.parse(top).rows[0].registrations[0].division).toBe("BLACK / Master 3 / Male / Rooster");
  });
});
