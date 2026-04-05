import useLoginContext from "../hooks/useLoginContext.ts";
import "./Header.css";
import { useNavigate } from "react-router-dom";
import { resetDisplayPreferences } from "../util/displayPreferences.ts";
import ProfileAvatar from "./ProfileAvatar.tsx";
import useFetchUserPreferences from "../hooks/useFetchUserPreferences.ts";

/**
 * Header component that renders the main title.
 */
export default function Header() {
  const { user, reset, socket, pass } = useLoginContext();
  const navigate = useNavigate();
  const { profilePictureUrl } = useFetchUserPreferences(user.username); // Destructure profilePictureUrl

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
          // Let the server know this user is going offline
          socket.emit("userPresenceOffline", {
            auth: { username: user.username, password: pass },
            payload: null,
          });
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
