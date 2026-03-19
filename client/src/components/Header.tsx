import { useEffect, useState } from "react";
import useLoginContext from "../hooks/useLoginContext.ts";
import "./Header.css";
import { useNavigate } from "react-router-dom";
import { resetDisplayPreferences } from "../util/displayPreferences.ts";
import { getUserPreferences } from "../services/userService.ts";
import ProfileAvatar from "./ProfileAvatar.tsx";

/**
 * Header component that renders the main title.
 */
export default function Header() {
  const { user, reset } = useLoginContext();
  const navigate = useNavigate();
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>("");

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

  return (
    <div id="header" className="header">
      <div className="title">GameNite!</div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>signed in as {user.display}</span>
        <ProfileAvatar imageUrl={profilePictureUrl} />
      </div>
      <button
        className="narrowcenter secondary"
        onClick={() => {
          resetDisplayPreferences();
          reset();
          navigate("/login");
        }}
      >
        Log Out
      </button>
      <button
        className="narrowcenter secondary"
        onClick={() => navigate(`/profile/${user.username}`)}
      >
        View Profile
      </button>
    </div>
  );
}
