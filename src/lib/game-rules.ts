export const ROUND_SECONDS = 30;
export const KILL_POINTS = 250;
export const HIT_PENALTY = 125;
export const sampleLeaders = [
  { name: "Germinator", score: 10500 },
  { name: "Captain Clean", score: 9250 },
  { name: "Shield Master", score: 8500 },
  { name: "Tap Titan", score: 7750 },
  { name: "The Defender", score: 6500 },
];
export function rankPlayers(name: string, score: number) {
  return [...sampleLeaders.map((p) => ({ ...p, current: false })), { name, score, current: true }]
    .sort((a, b) => b.score - a.score);
}