import { useEffect, useState } from "react";
import { getUserPreferences } from "../services/userService";

export default function useFetchUserPreferences(username: string) {
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>("");
  const [bannerImageUrl, setBannerImageUrl] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!username) {
        setProfilePictureUrl(""); // Clear the profile picture if no username is provided
        setBannerImageUrl("");
        return;
      }

      const response = await getUserPreferences(username); // Use the passed `username`
      if (!cancelled) {
        if ("error" in response) {
          setProfilePictureUrl("");
          setBannerImageUrl("");
        } else {
          setProfilePictureUrl(response.profilePictureUrl ?? "");
          setBannerImageUrl(response.bannerImageUrl ?? "");

        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [username]); // Depend on the `username` argument

  return { profilePictureUrl, bannerImageUrl };
}
