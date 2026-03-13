// ansi codes — only used when stdout is a terminal
const isTTY = process.stdout.isTTY ?? false;
export const DIM = isTTY ? "\x1b[2m" : "";
export const RESET = isTTY ? "\x1b[0m" : "";

/** Format a token count for display with tiered rounding */
export function formatTokens(tokens: number): string {
  // 10k+ → nearest 1k: "12k", "36k"
  if (tokens >= 10000) {
    return `${Math.round(tokens / 1000)}k`;
  }
  // 1k–10k → one decimal: "2.4k", "6.4k"
  if (tokens >= 1000) {
    const k = tokens / 1000;
    const formatted = k % 1 === 0 ? k.toFixed(0) : k.toFixed(1);
    return `${formatted}k`;
  }
  // under 1k → nearest 100: "100", "600"
  const rounded = Math.max(100, Math.round(tokens / 100) * 100);
  // edge case: 950–999 rounds to 1000
  if (rounded >= 1000) return "1k";
  return `${rounded}`;
}
