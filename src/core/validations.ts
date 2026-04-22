const BASE_NAME_PATTERN = /^[a-z0-9_-]+$/;
const SET_NAME_PATTERN = /^[a-z0-9_-]+(?:\/[a-z0-9_-]+)*$/;

// -----------------------------------------------------------------------------

/** check if a name is valid for bases */

export function isValidBaseName(name: string): boolean {
  return BASE_NAME_PATTERN.test(name);
}

/** check if a name is valid for sets */

export function isValidSetName(name: string): boolean {
  return SET_NAME_PATTERN.test(name);
}
