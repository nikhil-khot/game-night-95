import type { SafeUserInfo, ThreadInfo } from "@gamenite/shared";
import { useState } from "react";
import useAuth from "./useAuth";
import { downvoteThread, upvoteThread } from "../services/threadService";

export default function useThreadScore(
  threadId: string,
  initialPoints: number,
  upvoters: SafeUserInfo[],
  downvoters: SafeUserInfo[],
  setThread?: (thread: ThreadInfo) => void,
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
      if (setThread) setThread(newThread);
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
      if (setThread) setThread(newThread);
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
