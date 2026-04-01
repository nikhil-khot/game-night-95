import "./ThreadSummaryView.css";
import { NavLink, useNavigate } from "react-router-dom";
import type { ThreadSummary } from "@gamenite/shared";
import useTimeSince from "../hooks/useTimeSince.ts";
import UserLink from "./UserLink.tsx";
import useThreadScore from "../hooks/useThreadScore.ts";

/**
 * Summarizes information for a single thread as part of a list of threads
 */
export default function ThreadSummaryView({
  summary: { threadId, createdBy, createdAt, title, points, upvoters, downvoters, comments },
  setThreadInList,
}: {
  summary: ThreadSummary;
  setThreadInList: (newThread: ThreadSummary) => void;
}) {
  const navigate = useNavigate();
  const timeSince = useTimeSince();
  const { currPoints, userContribution, handleUpvote, handleDownvote } = useThreadScore(
    threadId,
    points,
    upvoters,
    downvoters,
    { setThreadInList },
  );

  return (
    <div className="threadSummary" role="listitem">
      <button
        className={userContribution === "upvote" ? "arrow up voted" : "arrow up"}
        onClick={handleUpvote}
      >
        ➤
      </button>
      <div className="points">{currPoints}</div>
      <button
        className={userContribution === "downvote" ? "arrow down voted" : "arrow down"}
        onClick={handleDownvote}
      >
        ➤
      </button>
      <div className="postStats" onClick={() => navigate(`/forum/post/${threadId}`)}>
        {comments} {comments === 1 ? "reply" : "replies"}
      </div>
      <NavLink to={`/forum/post/${threadId}`} className="mid">
        {title}
      </NavLink>
      <div className="lastActivity">
        <UserLink user={createdBy} capitalize /> posted {timeSince(createdAt)}
      </div>
    </div>
  );
}
