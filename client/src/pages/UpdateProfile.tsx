import { useState } from "react";
import useLoginContext from "../hooks/useLoginContext";
import useTimeSince from "../hooks/useTimeSince";
import useEditProfileForm from "../hooks/useEditProfileForm";
import ImageUpload from "../components/ImageUpload";
import ProfileAvatar from "../components/ProfileAvatar";
import { useNavigate } from "react-router-dom";
import useThreadList from "../hooks/useThreadList";
import ThreadSummaryView from "../components/ThreadSummaryView";
import useGameList from "../hooks/useGameList";
import { generateStatsFromGames, sortLeaderboardEntries } from "../util/leaderboardProcessing";
import UserLeaderboardView from "../components/UserLeaderboardView";

export default function UpdateProfile() {
  const { user } = useLoginContext();
  const navigate = useNavigate();
  const timeSince = useTimeSince();
  const [showPass, setShowPass] = useState(false);
  const [uploadedImageName, setUploadedImageName] = useState<string>("");
  const [bannerImageName, setBannerImageName] = useState<string>("");
  const {
    display,
    setDisplay,
    password,
    setPassword,
    confirm,
    setConfirm,
    profilePictureUrl,
    setProfilePictureUrl,
    setBannerImageUrl,
    err,
    handleSubmit,
  } = useEditProfileForm();
  const { threadOrMessage, setThreadInList } = useThreadList();
  const filteredThreads =
    "message" in threadOrMessage
      ? []
      : threadOrMessage.threads.filter((thread) => thread.createdBy.username === user.username);
  const gameList = useGameList();

  const filteredStats =
    "message" in gameList
      ? []
      : sortLeaderboardEntries(
          generateStatsFromGames(
            gameList.filter((game) =>
              game.players.some((player) => player.username === user.username),
            ),
          ),
        ).filter(([userInfo, record]) => userInfo.username === user.username);

  const handleProfileImageChange = (file: File) => {
    setUploadedImageName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProfilePictureUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBannerImageChange = (file: File) => {
    setBannerImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setBannerImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Profile</h2>
      </div>
      <div>
        <h3>General information</h3>
        <ul>
          <li>Username: {user.username}</li>
          <li>Account created {timeSince(user.createdAt)}</li>
        </ul>
      </div>
      <hr />
      <form className="content spacedSection" onSubmit={handleSubmit}>
        <div className="spacedSection">
          <h3>Display name</h3>
          <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem" }}>
            <input
              className="widefill notTooWide"
              value={display}
              onChange={(e) => setDisplay(e.target.value)}
            />
            <button
              className="secondary narrow"
              onClick={(e) => {
                e.preventDefault(); // Don't submit form
                setDisplay(user.display);
              }}
            >
              Reset
            </button>
          </div>
        </div>
        <br />
        <div className="spacedSection">
          <h3>Reset password</h3>
          <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem" }}>
            <input
              type={showPass ? "input" : "password"}
              className="widefill notTooWide"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              className="secondary narrow"
              onClick={(e) => {
                e.preventDefault(); // Don't submit form
                setPassword("");
                setConfirm("");
              }}
            >
              Reset
            </button>
            <button
              className="secondary narrow"
              aria-label="Toggle show password"
              onClick={(e) => {
                e.preventDefault(); // Don't submit form
                setShowPass((v) => !v);
              }}
            >
              {showPass ? "Hide" : "Reveal"}
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem" }}>
            <input
              type={showPass ? "input" : "password"}
              className="widefill notTooWide"
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
        </div>
        <br />
        <div className="spacedSection">
          <h3>Upload profile image</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <ProfileAvatar imageUrl={profilePictureUrl} />
            <div>
              <ImageUpload onChange={handleProfileImageChange} />
              {uploadedImageName && (
                <div className="smallAndGray">Selected: {uploadedImageName}</div>
              )}
            </div>
          </div>
        </div>
        <h3>Upload Banner Image</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div>
            <ImageUpload onChange={handleBannerImageChange} />
            {bannerImageName && <div className="smallAndGray">Selected: {bannerImageName}</div>}
          </div>
        </div>
        {err && <p className="error-message">{err}</p>}
        <div>
          <button className="primary narrow">Submit</button>
        </div>
        <div>
          <button
            className="secondary narrow"
            onClick={(e) => {
              e.preventDefault(); // Prevent form submission
              navigate(`/profile/view/${user.username}`); // Navigate using React Router
            }}
          >
            View Profile
          </button>
        </div>
        <div className="smallAndGray">After updating your profile, you will be logged out</div>
      </form>
      <hr style={{ marginBottom: 0 }} />
      <h3>Game Statistics (W/L/T)</h3>
      {"message" in gameList ? (
        gameList.message
      ) : filteredStats.length === 0 ? (
        <div>No game stats found...</div>
      ) : (
        <>
          <hr style={{ marginBottom: 0, marginTop: 0 }} />
          <div className="dottedList">
            {filteredStats.map(([user, record], index) => (
              <UserLeaderboardView key={index} rank={undefined} user={undefined} record={record} />
            ))}
          </div>
        </>
      )}
      <hr style={{ marginBottom: 0, marginTop: 30 }} />
      <h3>Forum Posts</h3>
      <>
        {"message" in threadOrMessage ? (
          threadOrMessage.message
        ) : filteredThreads.length > 0 ? (
          <div className="dottedList" role="list">
            {filteredThreads.map((thread) => (
              <ThreadSummaryView
                summary={thread}
                setThreadInList={setThreadInList}
                key={thread.threadId.toString()}
              />
            ))}
          </div>
        ) : (
          <div>No posts found...</div>
        )}
      </>
    </>
  );
}
