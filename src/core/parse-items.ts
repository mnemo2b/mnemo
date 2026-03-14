export type LoadItem =
  | { type: "set"; name: string }
  | { type: "path"; path: string };

/** Parse space-separated input into structured load items */
export function parseLoadItems(input: string): LoadItem[] {
  return input
    .split(/\s+/)
    .filter((s) => s.length > 0)
    .map((s) => {
      if (s.startsWith(":")) {
        return { type: "set", name: s.slice(1) };
      }
      return { type: "path", path: s };
    });
}
