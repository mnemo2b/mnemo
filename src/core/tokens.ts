/** estimate token count from raw text */

export function estimateTokens(text: string): number {
  // rough heuristic: claude's tokenizer averages ~4 chars/token
  return Math.round(text.length / 4);
}
