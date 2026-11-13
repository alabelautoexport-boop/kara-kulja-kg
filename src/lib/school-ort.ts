// A technical typo guard, not an official ORT maximum or passing threshold.
export const ORT_INPUT_FLOOR = 1;
export const ORT_INPUT_CEILING = 300;
export const ORT_RANGES = ["0-109", "110-129", "130-149", "150-169", "170-189", "190-199", "200+"];
export type OrtSummary = {
  participants: number;
  average: number | null;
  median: number | null;
  minimum: number | null;
  maximum: number | null;
  over200: number;
  distribution: number[];
};

export function calculateOrt(scores: readonly number[]): OrtSummary {
  if (scores.some((n) => !isValidOrtScore(n))) throw new RangeError("Invalid ORT scores");
  const sorted = [...scores].sort((a, b) => a - b);
  const count = sorted.length;
  const distribution = Array<number>(7).fill(0);
  for (const n of sorted)
    distribution[
      n < 110 ? 0 : n < 130 ? 1 : n < 150 ? 2 : n < 170 ? 3 : n < 190 ? 4 : n < 200 ? 5 : 6
    ]++;
  return {
    participants: count,
    average: count ? Math.round((sorted.reduce((sum, n) => sum + n, 0) / count) * 100) / 100 : null,
    median: count
      ? count % 2
        ? sorted[Math.floor(count / 2)]
        : (sorted[count / 2 - 1] + sorted[count / 2]) / 2
      : null,
    minimum: count ? sorted[0] : null,
    maximum: count ? sorted[count - 1] : null,
    over200: distribution[6],
    distribution,
  };
}

function isValidOrtScore(n: number) {
  return Number.isInteger(n) && n >= ORT_INPUT_FLOOR && n <= ORT_INPUT_CEILING;
}

export function parseOrtScores(text: string) {
  // Spaces separate scores; explicit empty comma/semicolon/line items are errors.
  const tokens = text
    .replace(/\r\n?/g, "\n")
    .split(/[,;\n]/)
    .flatMap((part) => {
      const trimmed = part.trim();
      return trimmed ? trimmed.split(/\s+/) : [""];
    });
  const valid: number[] = [];
  const invalid: string[] = [];
  for (const token of tokens) {
    const n = Number(token);
    if (!/^\d+$/.test(token) || !isValidOrtScore(n)) invalid.push(token);
    else valid.push(n);
  }
  if (valid.length > 10000) invalid.push("10000+");
  return {
    scores: invalid.length ? [] : valid,
    invalid,
    summary: invalid.length ? null : calculateOrt(valid),
  };
}
