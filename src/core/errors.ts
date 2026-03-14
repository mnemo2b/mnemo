/** error thrown for user-facing failures (bad input, missing config, etc) */
export class CLIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CLIError";
  }
}
