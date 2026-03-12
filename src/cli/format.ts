// ansi codes — only used when stdout is a terminal
const isTTY = process.stdout.isTTY ?? false;
export const DIM = isTTY ? "\x1b[2m" : "";
export const RESET = isTTY ? "\x1b[0m" : "";
