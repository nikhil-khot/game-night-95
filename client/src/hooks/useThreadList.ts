import type { ErrorMsg, ThreadSummary } from "@gamenite/shared";
import { useEffect, useState } from "react";
import { threadList } from "../services/threadService.ts";

/**
 * Custom hook to get the list of all thread summaries
 * @param maxSummaries - the maximum number of summaries desired (default is all of them)
 * @returns A message to display to the user (Loading... or an error message), or a list
 */
export default function useThreadList(maxSummaries?: number):
  | { threadOrMessage: { message: string }; setThreadInList: (newThread: ThreadSummary) => void }
  | {
      threadOrMessage: { threads: ThreadSummary[] };
      setThreadInList: (newThread: ThreadSummary) => void;
    } {
  const [threads, setThreads] = useState<ThreadSummary[] | ErrorMsg | null>(null);

  useEffect(() => {
    threadList().then(setThreads);
  }, [setThreads]);

  const setThreadInList = (newThread: ThreadSummary) => {
    if (!threads || "error" in threads) return;
    const threadIndex = threads.findIndex((t) => t.threadId === newThread.threadId);
    if (threadIndex === -1) return;
    const updatedThreads = [...threads];
    updatedThreads[threadIndex] = newThread;
    setThreads(updatedThreads);
  };

  if (!threads) return { threadOrMessage: { message: "Loading..." }, setThreadInList };
  if ("error" in threads)
    return { threadOrMessage: { message: `Error: ${threads.error}` }, setThreadInList };
  if (threads.length === 0)
    return { threadOrMessage: { message: "No threads found..." }, setThreadInList };
  if (maxSummaries)
    return { threadOrMessage: { threads: threads.slice(0, maxSummaries) }, setThreadInList };
  return { threadOrMessage: { threads }, setThreadInList };
}
