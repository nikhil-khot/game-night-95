import { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth.ts";
import { getUserPreferences, updateUserPreferences } from "../services/userService.ts";
import {
  applyDisplayPreferences,
  type DisplayFontSize,
  type DisplayTheme,
} from "../util/displayPreferences.ts";
import { Frame, Button, Dropdown } from "@react95/core";

/** Preferences page for display settings. */
export default function Preferences() {
  const auth = useAuth();
  const [theme, setTheme] = useState<DisplayTheme>("win95");
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
      <Frame bgColor="$material" boxShadow="$out" padding="$4" className="outerFrame">
        <Frame h="100%" boxShadow="$in" className="innerFrame">
          <div className="content">
            <h2>Preferences</h2>
            <div className="spacedSection">
              <div>
                <label htmlFor="themeSelect">Theme</label>
                <Dropdown
                  id="themeSelect"
                  value={theme === "light" ? "Light" : theme === "dark" ? "Dark" : "GameNite95"}
                  onChange={(e) => {
                    setTheme(
                      e.target.value === "Light"
                        ? "light"
                        : e.target.value === "Dark"
                          ? "dark"
                          : "win95",
                    );
                  }}
                  options={["GameNite95", "Light", "Dark"]}
                />
              </div>
              <div>
                <label htmlFor="fontSizeSelect">Font Size</label>
                <Dropdown
                  id="fontSizeSelect"
                  value={
                    fontSize === "small" ? "Small" : fontSize === "medium" ? "Medium" : "Large"
                  }
                  onChange={(e) => {
                    setFontSize(
                      e.target.value === "Small"
                        ? "small"
                        : e.target.value === "Medium"
                          ? "medium"
                          : "large",
                    );
                  }}
                  options={["Small", "Medium", "Large"]}
                />
              </div>
            </div>
            <div className="spacedSection">
              <Button className="primary" onClick={() => void savePreferences()}>
                Save Preferences
              </Button>
              {status && <div className="smallAndGray">{status}</div>}
            </div>
          </div>
        </Frame>
      </Frame>
    </div>
  );
}
