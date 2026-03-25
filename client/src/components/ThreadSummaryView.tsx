import "./ThreadSummaryView.css";
import { NavLink, useNavigate } from "react-router-dom";
import type { ThreadSummary } from "@gamenite/shared";
import useTimeSince from "../hooks/useTimeSince.ts";
import UserLink from "./UserLink.tsx";
import useThreadInfo from "../hooks/useThreadInfo.ts";
import useThreadScore from "../hooks/useThreadScore.ts";

/**
 * Summarizes information for a single thread as part of a list of threads
 */
export default function ThreadSummaryView({
  threadId,
  createdBy,
  createdAt,
  title,
  points,
  comments,
}: ThreadSummary) {
  const navigate = useNavigate();
  const timeSince = useTimeSince();
  const { setThread } = useThreadInfo(threadId);
  const { currPoints, handleUpvote, handleDownvote } = useThreadScore(threadId, points, setThread);

  return (
    <div className="threadSummary" role="listitem">
      <button className="arrow up" onClick={handleUpvote}>
        ➤
      </button>
      <div className="points">{currPoints}</div>
      <button className="arrow down" onClick={handleDownvote}>
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
