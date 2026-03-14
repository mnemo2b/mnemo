import { describe, expect, test } from "bun:test";
import { spyOn } from "bun:test";
import { shortenPath, mergeSets } from "../../src/core/config";
import { homedir } from "os";

describe("shortenPath", () => {
  const home = homedir();

  test("replaces home directory with ~", () => {
    expect(shortenPath(`${home}/projects/mnemo`)).toBe("~/projects/mnemo");
  });

  test("leaves non-home paths unchanged", () => {
    expect(shortenPath("/usr/local/bin")).toBe("/usr/local/bin");
  });

  test("handles exact home directory", () => {
    expect(shortenPath(home)).toBe("~");
  });
});

describe("mergeSets", () => {
  test("combines non-colliding sets", () => {
    const global = { react: ["base/react"] };
    const project = { python: ["base/python"] };

    const result = mergeSets(global, project);

    expect(result).toEqual({
      react: ["base/react"],
      python: ["base/python"],
    });
  });

  test("project overrides global on collision", () => {
    const global = { shared: ["base/global-version"] };
    const project = { shared: ["base/project-version"] };

    const result = mergeSets(global, project);

    expect(result.shared).toEqual(["base/project-version"]);
  });

  test("warns on collision via stderr", () => {
    const spy = spyOn(console, "error").mockImplementation(() => {});

    const global = { shared: ["base/global"] };
    const project = { shared: ["base/project"] };

    mergeSets(global, project);

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('set "shared" defined in both'),
    );

    spy.mockRestore();
  });

  test("handles empty global sets", () => {
    const result = mergeSets({}, { react: ["base/react"] });
    expect(result).toEqual({ react: ["base/react"] });
  });

  test("handles empty project sets", () => {
    const result = mergeSets({ react: ["base/react"] }, {});
    expect(result).toEqual({ react: ["base/react"] });
  });

  test("handles both empty", () => {
    expect(mergeSets({}, {})).toEqual({});
  });
});
