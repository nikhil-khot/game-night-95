import { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth.ts";
import { getUserPreferences, updateUserPreferences } from "../services/userService.ts";
import {
  applyDisplayPreferences,
  type DisplayFontSize,
  type DisplayTheme,
} from "../util/displayPreferences.ts";

/** Preferences page for display settings. */
export default function Preferences() {
  const auth = useAuth();
  const [theme, setTheme] = useState<DisplayTheme>("light");
  const [fontSize, setFontSize] = useState<DisplayFontSize>("medium");
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const response = await getUserPreferences(auth.username);
      if (!cancelled && !("error" in response)) {
        setTheme(response.theme);
        setFontSize(response.fontSize);
        applyDisplayPreferences(response.theme, response.fontSize);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [auth.username]);

  const savePreferences = async () => {
    setStatus("");
    const response = await updateUserPreferences(auth, { theme, fontSize });
    if ("error" in response) {
      setStatus("Could not save preferences.");
      return;
    }
    applyDisplayPreferences(response.theme, response.fontSize);
    setStatus("Preferences saved.");
  };

  return (
    <div className="content notTooWide">
      <h2>Preferences</h2>

      <div className="spacedSection">
        <label htmlFor="themeSelect">Theme</label>
        <select
          id="themeSelect"
          value={theme}
          onChange={(event) => setTheme(event.target.value as DisplayTheme)}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      <div className="spacedSection">
        <label htmlFor="fontSizeSelect">Font Size</label>
        <select
          id="fontSizeSelect"
          value={fontSize}
          onChange={(event) => setFontSize(event.target.value as DisplayFontSize)}
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>

      <div className="spacedSection">
        <button className="narrow primary" onClick={() => void savePreferences()}>
          Save Preferences
        </button>
        {status && <div className="smallAndGray">{status}</div>}
      </div>
    </div>
  );
}
