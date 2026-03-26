import "./ThreadPage.css";
import { useParams } from "react-router-dom";
import useThreadInfo from "../hooks/useThreadInfo.ts";
import NewForumComment from "../components/NewForumComment.tsx";
import useTimeSince from "../hooks/useTimeSince.ts";
import UserLink from "../components/UserLink.tsx";
import useThreadScore from "../hooks/useThreadScore.ts";
import useLoginContext from "../hooks/useLoginContext.ts";

export default function ThreadPage() {
  const formatTimeSince = useTimeSince();
  const { threadId } = useParams();

  // non-nullish assertion is okay here given that Thread is only called in a
  // route with `:threadId` on the path
  const { threadInfo, setThread } = useThreadInfo(threadId!);
  const { handleUpvote, handleDownvote } = useThreadScore(
    threadId!,
    "message" in threadInfo ? 0 : threadInfo.points,
    "message" in threadInfo ? [] : threadInfo.upvoters,
    "message" in threadInfo ? [] : threadInfo.downvoters,
    { setThread },
  );
  const { user } = useLoginContext();

  return (
    <div className="content">
      {"message" in threadInfo ? (
        threadInfo.message
      ) : (
        <div className="spacedSection">
          <div>
            <h2>{threadInfo.title}</h2>
            <div className="smallAndGray">
              Posted by <UserLink user={threadInfo.createdBy} />{" "}
              {formatTimeSince(threadInfo.createdAt)}
            </div>
          </div>
          <div className="notTooWide">{threadInfo.text}</div>
          <div className="medium">
            <button
              className={
                threadInfo.upvoters.some((u) => u.username === user.username)
                  ? "arrow up voted"
                  : "arrow up"
              }
              onClick={handleUpvote}
            >
              ➤
            </button>
            {threadInfo.points} {threadInfo.points === 1 ? "point" : "points"}
            <button
              className={
                threadInfo.downvoters.some((u) => u.username === user.username)
                  ? "arrow down voted"
                  : "arrow down"
              }
              onClick={handleDownvote}
            >
              ➤
            </button>
          </div>
          <h3>Replies</h3>
          <div className="dottedList" role="list">
            {threadInfo.comments.map(({ commentId, text, createdBy, createdAt, editedAt }) => (
              <div className="dottedListItem" role="listitem" key={commentId}>
                <div>
                  <div>{text}</div>
                  <div className="smallAndGray">
                    Reply by <UserLink user={createdBy} />
                    {createdBy.username === threadInfo.createdBy.username && (
                      <span className="opBlue"> OP</span>
                    )}{" "}
                    {formatTimeSince(createdAt)}
                    {editedAt && ` (last edited ${formatTimeSince(editedAt)})`}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <NewForumComment
            firstPost={threadInfo.comments.length === 0}
            threadId={threadInfo.threadId.toString()}
            setThread={setThread}
          />
        </div>
      )}
    </div>
  );
}
