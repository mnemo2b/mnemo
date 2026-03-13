const BASE_NAME_PATTERN = /^[a-z0-9-]+$/;
const SET_NAME_PATTERN = /^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/;

/** Check if a name is valid for bases (lowercase alphanumeric + hyphens) */
export function isValidName(name: string): boolean {
  return BASE_NAME_PATTERN.test(name);
}

/** Check if a name is valid for sets (lowercase alphanumeric + hyphens + slashes) */
export function isValidSetName(name: string): boolean {
  return SET_NAME_PATTERN.test(name);
}
