import type { ThreadInfo } from "@gamenite/shared";
import { useState } from "react";
import useAuth from "./useAuth";
import { downvoteThread, upvoteThread } from "../services/threadService";

export default function useThreadScore(
  threadId: string,
  initialPoints: number,
  setThread: (thread: ThreadInfo) => void,
) {
  const [currPoints, setPoints] = useState(initialPoints);
  const [err, setError] = useState<string | null>(null);
  const auth = useAuth();
  async function handleUpvote() {
    const newThread = await upvoteThread(auth, threadId);
    if (!("error" in newThread)) {
      setThread(newThread);
      setPoints(newThread.points);
    } else {
      setError(newThread.error);
    }
  }
  async function handleDownvote() {
    const newThread = await downvoteThread(auth, threadId);
    if (!("error" in newThread)) {
      setThread(newThread);
      setPoints(newThread.points);
    } else {
      setError(newThread.error);
    }
  }
  return { err, currPoints, handleUpvote, handleDownvote };
}
