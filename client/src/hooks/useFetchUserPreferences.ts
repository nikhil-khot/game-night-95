import { useEffect, useState } from "react";
import { getUserPreferences } from "../services/userService";

export default function useFetchUserPreferences(username: string) {
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!username) {
        setProfilePictureUrl(""); // Clear the profile picture if no username is provided
        return;
      }

      const response = await getUserPreferences(username); // Use the passed `username`
      if (!cancelled && !("error" in response)) {
        setProfilePictureUrl(response.profilePictureUrl ?? "");
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [username]); // Depend on the `username` argument

  return profilePictureUrl;
}