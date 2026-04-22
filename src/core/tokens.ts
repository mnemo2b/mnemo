/** estimate token count from raw text */

export function estimateTokens(text: string): number {
	// estimate 4 characters per token
  return Math.round(text.length / 4);
}
