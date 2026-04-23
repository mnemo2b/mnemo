import { describe, expect, test } from "bun:test";
import { formatTokens } from "@/cli/format";

// ----------------------------------------------------------------------------

describe("formatTokens", () => {

  test("under 1k: rounds to nearest 100", () => {
    expect(formatTokens(456)).toBe("500");
    expect(formatTokens(150)).toBe("200");
    expect(formatTokens(349)).toBe("300");
  });

  test("under 1k: minimum is 100", () => {
    expect(formatTokens(0)).toBe("100");
    expect(formatTokens(49)).toBe("100");
  });

  test("under 1k: 950+ rounds up to 1k", () => {
    expect(formatTokens(950)).toBe("1k");
    expect(formatTokens(999)).toBe("1k");
  });

  test("1k-10k: shows one decimal", () => {
    expect(formatTokens(2400)).toBe("2.4k");
    expect(formatTokens(6432)).toBe("6.4k");
  });

  test("1k-10k: drops decimal when even", () => {
    expect(formatTokens(1000)).toBe("1k");
    expect(formatTokens(3000)).toBe("3k");
  });

  test("10k+: rounds to nearest 1k", () => {
    expect(formatTokens(12345)).toBe("12k");
    expect(formatTokens(36000)).toBe("36k");
    expect(formatTokens(10500)).toBe("11k");
  });

});
