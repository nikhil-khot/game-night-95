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
import { Button, Frame, Input } from "@react95/core";

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
    <div className="content">
      <Frame bgColor="$material" boxShadow="$out" padding="$4" className="outerFrame">
        <Frame h="100%" boxShadow="$in" className="innerFrame">
          <div className="content">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2>User Information</h2>
            </div>
            <hr style={{ margin: 0, marginBottom: 0 }} />
            <div>
              <h3>General information</h3>
              <ul>
                <li>Username: {user.username}</li>
                <li>Account created {timeSince(user.createdAt)}</li>
              </ul>
            </div>
            <hr style={{ marginBottom: 0 }} />
            <div>
              <h3>Game Statistics (Win/Loss/Tie)</h3>
              {"message" in gameList ? (
                gameList.message
              ) : filteredStats.length === 0 ? (
                <div>No game stats found...</div>
              ) : (
                <div>
                  <div className="leaderboardSubheader" role="">
                    <div className="stats">Overall</div>
                    <div className="stats">Nim</div>
                    <div className="stats">Number Guesser</div>
                    <div className="stats">Battleship</div>
                  </div>
                  <div className="dottedList">
                    {filteredStats.map(([user, record], index) => (
                      <UserLeaderboardView
                        key={index}
                        rank={undefined}
                        user={undefined}
                        record={record}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <hr style={{ marginBottom: 0 }} />

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
            <br />
            <div>
              <Button
                className="secondary"
                onClick={(e) => {
                  e.preventDefault(); // Prevent form submission
                  navigate(`/profile/view/${user.username}`); // Navigate using React Router
                }}
              >
                See Public Profile
              </Button>
            </div>
          </div>
        </Frame>
      </Frame>
      <Frame bgColor="$material" boxShadow="$out" padding="$4" className="outerFrame">
        <Frame h="100%" boxShadow="$in" className="innerFrame">
          <div className="content">
            <form className="spacedSection" onSubmit={handleSubmit}>
              <h2>Profile Updates</h2>
              <hr style={{ margin: 0 }} />
              <div className="spacedSection">
                <h3>Display name</h3>
                <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem" }}>
                  <Input
                    className="widefill notTooWide"
                    value={display}
                    onChange={(e) => setDisplay(e.target.value)}
                  />
                  <Button
                    className="secondary"
                    onClick={(e) => {
                      e.preventDefault(); // Don't submit form
                      setDisplay(user.display);
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </div>
              <div className="spacedSection">
                <h3>Reset password</h3>
                <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem" }}>
                  <Input
                    type={showPass ? "input" : "password"}
                    className="widefill notTooWide"
                    placeholder="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button
                    className="secondary"
                    onClick={(e) => {
                      e.preventDefault(); // Don't submit form
                      setPassword("");
                      setConfirm("");
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    className="secondary"
                    aria-label="Toggle show password"
                    onClick={(e) => {
                      e.preventDefault(); // Don't submit form
                      setShowPass((v) => !v);
                    }}
                  >
                    {showPass ? "Hide" : "Reveal"}
                  </Button>
                </div>
                <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem" }}>
                  <Input
                    type={showPass ? "input" : "password"}
                    className="widefill notTooWide"
                    placeholder="Confirm new password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
              </div>
              <hr style={{ marginBottom: 0 }} />
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
                  {bannerImageName && (
                    <div className="smallAndGray">Selected: {bannerImageName}</div>
                  )}
                </div>
              </div>
              <hr style={{ marginBottom: 0 }} />
              {err && <p className="error-message">{err}</p>}
              <div>
                <Button className="primary">Submit</Button>
              </div>
              <div className="smallAndGray">
                After updating your profile, you will be logged out
              </div>
            </form>
          </div>
        </Frame>
      </Frame>
    </div>
  );
}
