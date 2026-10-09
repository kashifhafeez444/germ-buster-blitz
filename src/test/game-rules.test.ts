import { describe, expect, it } from "vitest";
import { HIT_PENALTY, KILL_POINTS, ROUND_SECONDS, rankPlayers } from "@/lib/game-rules";

describe("Allergy Rush rules", () => {
  it("uses the requested time and scoring", () => {
    expect(ROUND_SECONDS).toBe(30);
    expect(KILL_POINTS).toBe(250);
    expect(HIT_PENALTY).toBe(125);
    expect(3 * KILL_POINTS - 2 * HIT_PENALTY).toBe(500);
  });
  it("ranks the current player and keeps negative scores", () => {
    const leaders = rankPlayers("Hero", 11000);
    expect(leaders[0]).toEqual({ name: "Hero", score: 11000, current: true });
    expect(rankPlayers("Hero", -125).at(-1)?.score).toBe(-125);
    expect(leaders.filter((p) => p.current)).toHaveLength(1);
  });
});