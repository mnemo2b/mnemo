const NAME_PATTERN = /^[a-z0-9-]+$/;

/** Check if a name is valid for bases and sets (lowercase alphanumeric + hyphens) */
export function isValidName(name: string): boolean {
  return NAME_PATTERN.test(name);
}
