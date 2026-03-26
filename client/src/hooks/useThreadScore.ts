import type { SafeUserInfo, ThreadInfo, ThreadSummary } from "@gamenite/shared";
import { useState } from "react";
import useAuth from "./useAuth";
import { downvoteThread, upvoteThread } from "../services/threadService";

/**
 * Custom hook to upvote/downvote threads and update their scores
 * @param threadId - The Id of the thread to update
 * @param initialPoints - The points of the thread at the time this hook is called
 * @param upvoters - The upvoters of this thread at the time this hook is called
 * @param downvoters - The downvoters of the thread at the time this hook is called
 * @param updateThread - The function to update the ThreadInfo or ThreadSummary that is being used to expose the thread
 * @returns an object containing:
 *  - `err`: An error message to display if voting failed for any reason
 *  - `currPoints`: The current score of the thread
 *  - `userContribution`: One of "upvote", "downvote", or "none" detailing how the user has interacted with the thread
 *  - `handleUpvote`: The function to call for upvoting the thread
 * -  `handleDownvote`: The function to call for downvoting the thread
 */
export default function useThreadScore(
  threadId: string,
  initialPoints: number,
  upvoters: SafeUserInfo[],
  downvoters: SafeUserInfo[],
  updateThread?: {
    setThread?: (thread: ThreadInfo) => void;
    setThreadInList?: (thread: ThreadSummary) => void;
  },
) {
  const [currPoints, setPoints] = useState(initialPoints);
  const [err, setError] = useState<string | null>(null);
  const auth = useAuth();
  const [userContribution, setUserContribution] = useState<"upvote" | "downvote" | "none">(
    upvoters.some((u) => u.username === auth.username)
      ? "upvote"
      : downvoters.some((u) => u.username === auth.username)
        ? "downvote"
        : "none",
  );
  async function handleUpvote() {
    const newThread = await upvoteThread(auth, threadId);
    if (!("error" in newThread)) {
      if (updateThread?.setThread) updateThread.setThread(newThread);
      if (updateThread?.setThreadInList)
        updateThread.setThreadInList({
          threadId: newThread.threadId,
          title: newThread.title,
          points: newThread.points,
          upvoters: newThread.upvoters,
          downvoters: newThread.downvoters,
          createdBy: newThread.createdBy,
          createdAt: newThread.createdAt,
          comments: newThread.comments.length,
        });
      setPoints(newThread.points);
      setUserContribution(
        newThread.upvoters.some((u) => u.username === auth.username) ? "upvote" : "none",
      );
    } else {
      setError(newThread.error);
    }
  }
  async function handleDownvote() {
    const newThread = await downvoteThread(auth, threadId);
    if (!("error" in newThread)) {
      if (updateThread?.setThread) updateThread.setThread(newThread);
      if (updateThread?.setThreadInList)
        updateThread.setThreadInList({
          threadId: newThread.threadId,
          title: newThread.title,
          points: newThread.points,
          upvoters: newThread.upvoters,
          downvoters: newThread.downvoters,
          createdBy: newThread.createdBy,
          createdAt: newThread.createdAt,
          comments: newThread.comments.length,
        });
      setPoints(newThread.points);
      setUserContribution(
        newThread.downvoters.some((u) => u.username === auth.username) ? "downvote" : "none",
      );
    } else {
      setError(newThread.error);
    }
  }
  return { err, currPoints, userContribution, handleUpvote, handleDownvote };
}
