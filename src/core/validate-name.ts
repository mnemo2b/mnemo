const BASE_NAME_PATTERN = /^[a-z0-9_-]+$/;
const SET_NAME_PATTERN = /^[a-z0-9_-]+(?:\/[a-z0-9_-]+)*$/;

/** Check if a name is valid for bases (lowercase alphanumeric + hyphens + underscores) */
export function isValidName(name: string): boolean {
  return BASE_NAME_PATTERN.test(name);
}

/** Check if a name is valid for sets (lowercase alphanumeric + hyphens + underscores + slashes) */
export function isValidSetName(name: string): boolean {
  return SET_NAME_PATTERN.test(name);
}
