/** Estimate token count from raw text (rough 4-chars-per-token heuristic) */
export function estimateTokens(text: string): number {
  return Math.round(text.length / 4);
}
