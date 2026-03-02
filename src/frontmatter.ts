import { parse as parseYaml } from "yaml";
import { basename } from "path";

interface Frontmatter {
  title: string | null;
  description: string | null;
  content: string;
}

/** extract title and description from yaml frontmatter in a markdown file */
export function parseFrontmatter(raw: string, filePath?: string): Frontmatter {
  // frontmatter must start at the very beginning of the file
  if (!raw.startsWith("---\n") && !raw.startsWith("---\r\n")) {
    return {
      title: titleFromFilename(filePath),
      description: null,
      content: raw,
    };
  }

  // find the closing --- delimiter (skip past the opening one)
  const closingIndex = raw.indexOf("\n---", 4);
  if (closingIndex === -1) {
    return {
      title: titleFromFilename(filePath),
      description: null,
      content: raw,
    };
  }

  // slice out the yaml block between the two delimiters
  const yamlBlock = raw.slice(4, closingIndex);

  // everything after the closing delimiter is the markdown content
  // strip one leading newline so content doesn't start with a blank line
  const content = raw.slice(closingIndex + 4).replace(/^\r?\n/, "");

  try {
    const parsed = parseYaml(yamlBlock);
    return {
      title: parsed?.title ?? titleFromFilename(filePath),
      description: parsed?.description ?? null,
      content,
    };
  } catch {
    // invalid yaml — treat the whole file as content
    return {
      title: titleFromFilename(filePath),
      description: null,
      content: raw,
    };
  }
}

/** convert a filename like "my-cool-note.md" to "My Cool Note" */
function titleFromFilename(filePath?: string): string | null {
  if (!filePath) return null;

  const name = basename(filePath, ".md");
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
