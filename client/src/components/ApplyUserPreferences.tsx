import { useEffect } from "react";
import useAuth from "../hooks/useAuth.ts";
import { getUserPreferences } from "../services/userService.ts";
import { applyDisplayPreferences } from "../util/displayPreferences.ts";

/**
 * Reads the logged-in user's saved display preferences and applies them.
 */
export default function ApplyUserPreferences() {
  const auth = useAuth();

  useEffect(() => {
    if (!auth) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      const response = await getUserPreferences(auth.username);
      if (!cancelled && !("error" in response)) {
        applyDisplayPreferences(response.theme, response.fontSize);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [auth]);

  return null;
}
