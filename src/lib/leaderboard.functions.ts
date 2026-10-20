import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const BASE = "https://sharedproject.ve-live.com/api/Shared";

export type LeaderRow = { ID: number; Name: string; Email: string; Score: number; datetime: string };

export const saveScore = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ Name: z.string().trim().min(1).max(32), Email: z.string().email().max(254), Score: z.number().int() }).parse(input),
  )
  .handler(async ({ data }) => {
    const res = await fetch(`${BASE}/OpellaScore`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = (await res.json().catch(() => null)) as { Status?: boolean; Data?: number } | null;
    if (!res.ok || !json?.Status) throw new Error("Could not save score");
    return { id: typeof json.Data === "number" ? json.Data : null };
  });

export const getLeaderboard = createServerFn({ method: "POST" }).handler(async () => {
  const res = await fetch(`${BASE}/GetOpellaLeaderboard`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  const json = (await res.json().catch(() => null)) as { Status?: boolean; Data?: LeaderRow[] } | null;
  if (!res.ok || !json?.Status || !Array.isArray(json.Data)) throw new Error("Could not load leaderboard");
  return [...json.Data].sort((a, b) => b.Score - a.Score);
});
