import { describe, expect, it } from "vitest";
import { diffSnapshots } from "../lib/diff";

describe("scan diff", () => {
  it("detects new events, competitors, radar athletes, team and division changes", () => {
    const changes = diffSnapshots(
      [{ eventName: "Old Open", registrationLink: "/old" }],
      [{ eventName: "New Open", registrationLink: "/new" }],
      [
        {
          sourceType: "EXACT_DIVISION",
          athleteName: "Alex",
          eventName: "New Open",
          registeredDivision: "BLACK / Master 2 / Male / Light Feather",
          team: "Old Team"
        },
        {
          sourceType: "RADAR",
          athleteName: "Rafael",
          eventName: "New Open",
          registeredDivision: "BLACK / Master 3 / Male / Rooster",
          team: null
        }
      ],
      [
        {
          sourceType: "EXACT_DIVISION",
          athleteName: "Alex",
          eventName: "New Open",
          registeredDivision: "BLACK / Master 2 / Male / Feather",
          team: "New Team"
        },
        {
          sourceType: "RADAR",
          athleteName: "Mateo",
          eventName: "New Open",
          registeredDivision: "BLACK / Master 3 / Male / Rooster",
          team: null
        }
      ]
    );

    expect(changes.map((change) => change.changeType)).toEqual(
      expect.arrayContaining(["NEW_EVENT", "REMOVED_EVENT", "TEAM_CHANGED", "DIVISION_CHANGED", "NEW_RADAR_ATHLETE", "REMOVED_RADAR_ATHLETE"])
    );
  });
});
