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

  switch (componentState.type) {
    case "error":
      return <div style={{ color: "#f00" }}>{componentState.msg}</div>;
    case "waiting":
      return <div>Loading...</div>;
    case "profile":
      return (
        <div className="content spacedSection">
          <h2>Profile for {componentState.user.display}</h2>
          <div className="view-profile-page">
            <div
              className="view-profile-banner"
              style={{ position: "relative", width: "100%", height: "450px" }}
            >
              <BannerAvatar
                imageUrl={bannerImageUrl || "/resources/images.png"}
                width="1500px"
                height="300px"
              />
              <div
                style={{
                  position: "absolute", // Position it absolutely within the banner
                  bottom: "100px", // Move it closer to the bottom
                  left: "7%", // Center horizontally
                  transform: "translateX(-50%)", // Adjust for centering
                }}
              >
                <ProfileAvatar imageUrl={profilePictureUrl} width="200px" height="200px" />
              </div>
            </div>
            <div className="content spacedSection">
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <h2>Profile for {componentState.user.display}</h2>
              </div>
              <div>
                <h3>General information</h3>
                <ul>
                  <p>Username: {componentState.user.username}</p>
                  <p>Account created {timeSince(componentState.user.createdAt)}</p>
                </ul>
              </div>
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
          </div>
        </div>
      );
  }
}
