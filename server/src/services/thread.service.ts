import { type CreateThreadMessage, type ThreadInfo, type ThreadSummary } from "@gamenite/shared";
import { populateSafeUserInfo } from "./user.service.ts";
import { createComment, populateCommentInfo } from "./comment.service.ts";
import { type UserWithId } from "../types.ts";
import { ThreadRepo } from "../repository.ts";

/**
 * Expand a stored thread
 *
 * @param threadId - Valid thread id
 * @returns the expanded thread info object
 */
async function populateThreadInfo(threadId: string): Promise<ThreadInfo> {
  const thread = await ThreadRepo.get(threadId);
  return {
    threadId,
    title: thread.title,
    text: thread.text,
    points: thread.points,
    upvoters: await Promise.all(thread.upvoters.map(populateSafeUserInfo)),
    downvoters: await Promise.all(thread.downvoters.map(populateSafeUserInfo)),
    createdBy: await populateSafeUserInfo(thread.createdBy),
    createdAt: new Date(thread.createdAt),
    comments: await Promise.all(thread.comments.map(populateCommentInfo)),
  };
}

/**
 * Expand just the summary information for a stored thread
 *
 * @param threadId - Valid thread id
 * @returns the expanded thread info object
 */
async function populateThreadSummary(threadId: string): Promise<ThreadSummary> {
  const thread = await ThreadRepo.get(threadId);
  return {
    threadId,
    title: thread.title,
    points: thread.points,
    upvoters: await Promise.all(thread.upvoters.map(populateSafeUserInfo)),
    downvoters: await Promise.all(thread.downvoters.map(populateSafeUserInfo)),
    createdBy: await populateSafeUserInfo(thread.createdBy),
    createdAt: new Date(thread.createdAt),
    comments: thread.comments.length,
  };
}

/**
 * Create and store a new thread
 *
 * @param user - The thread poster
 * @param contents - Title and text of the thread
 * @param createdAt - Creation time for this thread
 * @returns the new thread's info object
 */
export async function createThread(
  user: UserWithId,
  { title, text }: CreateThreadMessage,
  createdAt: Date,
): Promise<ThreadInfo> {
  const id = await ThreadRepo.add({
    title,
    text,
    points: 0,
    upvoters: [],
    downvoters: [],
    createdAt: createdAt.toISOString(),
    createdBy: user.userId,
    comments: [],
  });
  return populateThreadInfo(id);
}

/**
 * Retrieves a single thread from the database
 *
 * @param possibleThreadId - Ostensible thread ID
 * @returns the thread, or null if no thread with that ID exists
 */
export async function getThreadById(possibleThreadId: string): Promise<ThreadInfo | null> {
  const thread = await ThreadRepo.find(possibleThreadId);
  if (!thread) return null;
  return populateThreadInfo(possibleThreadId);
}

/**
 * Get a list of all threads
 *
 * @returns a list of thread summaries, ordered reverse chronologically by creation date
 */
export async function getThreadSummaries(): Promise<ThreadSummary[]> {
  const keys = await ThreadRepo.getAllKeys();
  const unsorted = await Promise.all(keys.map(populateThreadSummary));

  return unsorted.toSorted(
    (thread1, thread2) => thread2.createdAt.getTime() - thread1.createdAt.getTime(),
  );
}

/**
 * Add a comment id to a thread
 * @param possibleThreadId - Ostensible thread ID
 * @param user - Commenting user
 * @param text - Contents of the thread
 * @param createdAt - Creation time for thread
 * @returns the updated thread with comment attached, or null if the thread does not exist
 */
export async function addCommentToThread(
  possibleThreadId: string,
  user: UserWithId,
  text: string,
  createdAt: Date,
): Promise<ThreadInfo | null> {
  const oldThread = await ThreadRepo.find(possibleThreadId);
  if (!oldThread) return null;
  const threadId = possibleThreadId; // We know the thread ID is valid at this point
  const comment = await createComment(user, text, createdAt);
  const newThread = { ...oldThread, comments: [...oldThread.comments, comment.commentId] };
  await ThreadRepo.set(possibleThreadId, newThread);
  return populateThreadInfo(threadId);
}

/**
 * Upvote a thread
 * @param possibleThreadId - Ostensible thread ID
 * @param userId - Upvoting user
 * @returns the updated thread, or null if the thread does not exist
 */
export async function upvoteThread(
  possibleThreadId: string,
  userId: UserWithId,
): Promise<ThreadInfo | null> {
  const oldThread = await ThreadRepo.find(possibleThreadId);
  if (!oldThread) return null;
  const threadId = possibleThreadId; // We know the thread ID is valid at this point
  const upvoters = oldThread.upvoters;
  if (upvoters.indexOf(userId.userId) !== -1) {
    // User has already upvoted, so remove them
    upvoters.splice(upvoters.indexOf(userId.userId), 1);
    await ThreadRepo.set(possibleThreadId, {
      ...oldThread,
      upvoters,
      points: oldThread.points - 1,
    });
    return populateThreadInfo(threadId);
  }
  const downvoters = oldThread.downvoters;
  if (downvoters.indexOf(userId.userId) !== -1) {
    // User had downvoted before, so remove the downvote and add an upvote
    downvoters.splice(downvoters.indexOf(userId.userId), 1);
    upvoters.push(userId.userId);
    await ThreadRepo.set(possibleThreadId, {
      ...oldThread,
      upvoters,
      downvoters,
      points: oldThread.points + 2,
    });
  } else {
    // User had not voted before, so just add the upvote
    upvoters.push(userId.userId);
    await ThreadRepo.set(possibleThreadId, {
      ...oldThread,
      upvoters,
      points: oldThread.points + 1,
    });
  }
  return populateThreadInfo(threadId);
}

/**
 * Downvote a thread
 * @param possibleThreadId - Ostensible thread ID
 * @param userId - Downvoting user
 * @returns the updated thread, or null if the thread does not exist
 */
export async function downvoteThread(
  possibleThreadId: string,
  userId: UserWithId,
): Promise<ThreadInfo | null> {
  const oldThread = await ThreadRepo.find(possibleThreadId);
  if (!oldThread) return null;
  const threadId = possibleThreadId; // We know the thread ID is valid at this point
  const downvoters = oldThread.downvoters;
  if (downvoters.indexOf(userId.userId) !== -1) {
    // User has already downvoted, so remove them
    downvoters.splice(downvoters.indexOf(userId.userId), 1);
    await ThreadRepo.set(possibleThreadId, {
      ...oldThread,
      downvoters,
      points: oldThread.points + 1,
    });
    return populateThreadInfo(threadId);
  }
  const upvoters = oldThread.upvoters;
  if (upvoters.indexOf(userId.userId) !== -1) {
    // User had upvoted before, so remove the upvote and add a downvote
    upvoters.splice(upvoters.indexOf(userId.userId), 1);
    downvoters.push(userId.userId);
    await ThreadRepo.set(possibleThreadId, {
      ...oldThread,
      upvoters,
      downvoters,
      points: oldThread.points - 2,
    });
  } else {
    // User had not voted before, so just add the downvote
    downvoters.push(userId.userId);
    await ThreadRepo.set(possibleThreadId, {
      ...oldThread,
      downvoters,
      points: oldThread.points - 1,
    });
  }
  return populateThreadInfo(threadId);
}
