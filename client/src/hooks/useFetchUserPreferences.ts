import { useEffect, useState } from "react";
import { getUserPreferences } from "../services/userService";
import useLoginContext from "./useLoginContext";

export default function useFetchUserPreferences(username: string) {
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>("");
  const { user } = useLoginContext();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const response = await getUserPreferences(user.username);
      if (!cancelled && !("error" in response)) {
        setProfilePictureUrl(response.profilePictureUrl ?? "");
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [user.username]);
  return profilePictureUrl;
}
