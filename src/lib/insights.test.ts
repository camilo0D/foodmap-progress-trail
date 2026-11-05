import { describe, expect, it } from "vitest";
import { computeInsights, nextRecommended, type ProgressRow } from "./insights";
import { currentSprint } from "./backlog";

const row = (id: string, status: ProgressRow["status"], updated = "2026-11-03T00:00:00Z"): [string, ProgressRow] => [
  id, { story_id: id, status, notes: null, completed_at: null, updated_at: updated },
];

describe("backlog rules", () => {
  it("sprints last 2 weeks starting Nov 2 2026", () => {
    expect(currentSprint(new Date("2026-11-10T12:00:00"))).toBe(1);
    expect(currentSprint(new Date("2026-11-17T12:00:00"))).toBe(2);
  });
  it("recommends the earliest critical story first", () => {
    expect(nextRecommended(new Map())?.id).toBe("MOB-001");
    expect(nextRecommended(new Map([row("MOB-001", "done")]))?.id).toBe("MOB-002");
  });
  it("flags unfinished stories from past sprints as late", () => {
    const out = computeInsights(new Map(), new Date("2026-11-20T12:00:00"));
    expect(out.some((i) => i.title.startsWith("6 historia(s) atrasadas"))).toBe(true);
  });
  it("flags in-progress stories untouched for over 7 days", () => {
    const out = computeInsights(new Map([row("MOB-001", "in_progress", "2026-11-02T00:00:00Z")]), new Date("2026-11-12T12:00:00"));
    expect(out.some((i) => i.title.includes("estancadas"))).toBe(true);
  });
});
