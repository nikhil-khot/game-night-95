import useLoginContext from "../hooks/useLoginContext";
import ProfileAvatar from "../components/ProfileAvatar";

export default function ProfilePage() {
  const { user } = useLoginContext();

  return (
    <div className="content notTooWide spacedSection">
      <h2>Profile</h2>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div>{user.display}</div>
          <div className="smallAndGray">@{user.username}</div>
        </div>
        <ProfileAvatar imageUrl="" />
      </div>
    </div>
  );
}
