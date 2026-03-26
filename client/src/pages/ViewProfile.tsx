import type { SafeUserInfo } from "@gamenite/shared";
import { useEffect, useState } from "react";
import useTimeSince from "../hooks/useTimeSince";
import { getUserById } from "../services/userService";
import useThreadList from "../hooks/useThreadList";
import ThreadSummaryView from "../components/ThreadSummaryView";

interface ViewProfileProps {
  username: string;
}
export default function ViewProfile({ username }: ViewProfileProps) {
  const [componentState, setComponentState] = useState<
    { type: "waiting" } | { type: "error"; msg: string } | { type: "profile"; user: SafeUserInfo }
  >({ type: "waiting" });
  const timeSince = useTimeSince();
  const { threadOrMessage, setThreadInList } = useThreadList();
  const filteredThreads =
    "message" in threadOrMessage
      ? []
      : threadOrMessage.threads.filter((thread) => thread.createdBy.username === username);

  useEffect(() => {
    let cancel = false;

    getUserById(username)
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
  }, [username]);

  switch (componentState.type) {
    case "error":
      return <div style={{ color: "#f00" }}>{componentState.msg}</div>;
    case "waiting":
      return <div>Loading...</div>;
    case "profile":
      return (
        <div className="content spacedSection">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>Profile for {componentState.user.display}</h2>
          </div>
          <div>
            <h3>General information</h3>
            <ul>
              <li>Username: {componentState.user.username}</li>
              <li>Account created {timeSince(componentState.user.createdAt)}</li>
            </ul>
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
      );
  }
}
