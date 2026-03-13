import { describe, expect, it } from "vitest";

import {
  applyDisplayPreferences,
  resetDisplayPreferences,
} from "../../src/util/displayPreferences.ts";

describe("displayPreferences utilities", () => {
  it("applies theme and font size attributes to document root", () => {
    applyDisplayPreferences("dark", "large");

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.getAttribute("data-font-size")).toBe("large");
  });

  it("resets display preferences to light/medium defaults", () => {
    applyDisplayPreferences("dark", "small");

    resetDisplayPreferences();

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(document.documentElement.getAttribute("data-font-size")).toBe("medium");
  });
});
