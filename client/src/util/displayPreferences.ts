export type DisplayTheme = "win95" | "light" | "dark";
export type DisplayFontSize = "small" | "medium" | "large";

/** Apply current display preferences to the root document. */
export function applyDisplayPreferences(theme: DisplayTheme, fontSize: DisplayFontSize) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.setAttribute("data-font-size", fontSize);
}

/** Reset display preferences to app defaults for logged-out views. */
export function resetDisplayPreferences() {
  applyDisplayPreferences("light", "medium");
}
