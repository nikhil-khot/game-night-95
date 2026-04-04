import type { SafeUserInfo } from "@gamenite/shared";
import { useEffect, useState } from "react";
import useTimeSince from "../hooks/useTimeSince";
import { getUserById } from "../services/userService";
import useThreadList from "../hooks/useThreadList";
import ThreadSummaryView from "../components/ThreadSummaryView";
import useFetchUserPreferences from "../hooks/useFetchUserPreferences";
import ProfileAvatar from "../components/ProfileAvatar";
import { useParams } from "react-router-dom";
import BannerAvatar from "../components/BannerAvatar";
import useGameList from "../hooks/useGameList";
import UserLeaderboardView from "../components/UserLeaderboardView";
import { generateStatsFromGames, sortLeaderboardEntries } from "../util/leaderboardProcessing";
import StatusIndicator from "../components/StatusIndicator";
import useLoginContext from "../hooks/useLoginContext";

interface ViewProfileProps {
  username?: string;
}
export default function ViewProfile({ username: profileUsername }: ViewProfileProps) {
  const [componentState, setComponentState] = useState<
    { type: "waiting" } | { type: "error"; msg: string } | { type: "profile"; user: SafeUserInfo }
  >({ type: "waiting" });
  const timeSince = useTimeSince();
  const { username } = useParams<{ username: string }>();
  const validUsername = profileUsername || username;
  const { profilePictureUrl, bannerImageUrl } = useFetchUserPreferences(validUsername || "");
  const { threadOrMessage, setThreadInList } = useThreadList();
  const filteredThreads =
    "message" in threadOrMessage
      ? []
      : threadOrMessage.threads.filter((thread) => thread.createdBy.username === username);
  const gameList = useGameList();

  const filteredStats =
    "message" in gameList || componentState.type !== "profile"
      ? []
      : sortLeaderboardEntries(
          generateStatsFromGames(
            gameList.filter((game) => game.players.some((player) => player.username === username)),
          ),
        ).filter(([user, record]) => user.username === componentState.user.username);

  const { user: loggedInUser, socket, pass } = useLoginContext();
  const [isOnline, setIsOnline] = useState<boolean>(false);

  useEffect(() => {
    let cancel = false;

    if (!validUsername) {
      return;
    }

    getUserById(validUsername)
      .then((response) => {
        if (cancel) return;
        if ("error" in response) {
          setComponentState({ type: "error", msg: response.error });
        } else {
          setComponentState({ type: "profile", user: response });
        }
      })
      .catch((err) => {
        if (cancel) return;
        setComponentState({ type: "error", msg: `${err}` });
      });

    return () => {
      cancel = true;
    };
  }, [validUsername]);

  // Subscribe to real-time presence updates for the viewed user
  useEffect(() => {
    if (componentState.type !== "profile") return;

    const viewedUserId = componentState.user.userId;

    const handleStatus = ({ userId, isOnline }: { userId: string; isOnline: boolean }) => {
      if (userId === viewedUserId) {
        setIsOnline(isOnline);
      }
    };

    socket.on("userStatusUpdated", handleStatus);

    // Ask the server for the current status of this user in case they were already online
    socket.emit("userPresenceQuery", {
      auth: { username: loggedInUser.username, password: pass },
      payload: viewedUserId,
    });
    return () => {
      socket.off("userStatusUpdated", handleStatus);
    };
  }, [componentState, socket, loggedInUser.username, pass]);

  switch (componentState.type) {
    case "error":
      return <div style={{ color: "#f00" }}>{componentState.msg}</div>;
    case "waiting":
      return <div>Loading...</div>;
    case "profile": {
      return (
        <div className="content spacedSection">
          <h2>Profile for {componentState.user.display}</h2>
          <div className="view-profile-page">
            <div
              className="view-profile-banner"
              style={{ position: "relative", width: "100%", height: "350px" }}
            >
              <BannerAvatar
                imageUrl={bannerImageUrl || "/resources/images.png"}
                width="1500px"
                height="300px"
              />
              <div
                style={{
                  position: "absolute", // Position it absolutely within the banner
                  bottom: "-10px", // Move it closer to the bottom
                  left: "7%", // Center horizontally
                  transform: "translateX(-50%)", // Adjust for centering
                }}
              >
                <ProfileAvatar imageUrl={profilePictureUrl} width="200px" height="200px" />
                <div
                  style={{
                    position: "absolute",
                    bottom: "10px",
                    right: "25px",
                  }}
                >
                  <StatusIndicator status={isOnline ? "online" : "offline"} />
                </div>
              </div>
            </div>
            <div className="content spacedSection">
              <div>
                <h3>General information</h3>
                <ul>
                  <p>Username: {componentState.user.username}</p>
                  <p>Account created {timeSince(componentState.user.createdAt)}</p>
                </ul>
              </div>
            </div>
            <hr style={{ marginBottom: 0 }} />
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
                    <UserLeaderboardView key={index} rank={undefined} user={user} record={record} />
                  ))}
                </div>
              </div>
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
          </div>
        </div>
      );
    }
  }
}
