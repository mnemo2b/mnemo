/** estimate token count from raw text */

export function estimateTokens(text: string): number {
  // heuristic: claude's tokenizer averages ~4 chars/token
  return Math.round(text.length / 4);
}
