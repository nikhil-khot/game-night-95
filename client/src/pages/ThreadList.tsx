import { useNavigate } from "react-router-dom";
import ThreadSummaryView from "../components/ThreadSummaryView.tsx";
import useThreadList from "../hooks/useThreadList.ts";
import { useState } from "react";

export default function ThreadList() {
  const { threadOrMessage, setThreadInList } = useThreadList();
  const navigate = useNavigate();
  const [sortByScore, setSortByScore] = useState(false);

  return (
    <div className="content">
      <div className="spacedSection">
        <h2>All forum posts</h2>
        <div>
          <button className="primary narrow" onClick={() => navigate("/forum/post/new")}>
            Create New Post
          </button>
          <button
            style={{ marginLeft: "0.5rem" }}
            className="secondary narrow"
            onClick={() => setSortByScore(!sortByScore)}
          >
            Sort Posts by {sortByScore ? "Time" : "Score"}
          </button>
        </div>
        <>
          {"message" in threadOrMessage ? (
            threadOrMessage.message
          ) : (
            <div className="dottedList" role="list">
              {threadOrMessage.threads
                .slice()
                .sort((a, b) =>
                  sortByScore
                    ? b.points - a.points
                    : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                )
                .map((thread) => (
                  <ThreadSummaryView
                    summary={thread}
                    setThreadInList={setThreadInList}
                    key={thread.threadId.toString()}
                  />
                ))}
            </div>
          )}
        </>
      </div>
    </div>
  );
}
