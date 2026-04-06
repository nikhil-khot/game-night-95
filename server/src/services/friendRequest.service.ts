import { FriendRepo } from "../repository.ts";
import { getUserByUsername } from "./auth.service.ts";
import type { FriendRecord, FriendStatus } from "../models.ts";

/**
 * Retrieves all FriendRecords involving a given userId (in either direction)
 */
async function getAllFriendRecordsForUser(
  userId: string,
): Promise<{ key: string; record: FriendRecord }[]> {
  const allKeys = await FriendRepo.getAllKeys();
  const allRecords = await FriendRepo.getMany(allKeys);
  return allKeys
    .map((key, i) => ({ key, record: allRecords[i] }))
    .filter(({ record }) => record.fromUserId === userId || record.toUserId === userId);
}

/**
 * Finds an existing FriendRecord between two users (regardless of direction)
 */
async function findFriendRecord(
  userIdA: string,
  userIdB: string,
): Promise<{ key: string; record: FriendRecord } | null> {
  const allKeys = await FriendRepo.getAllKeys();
  const allRecords = await FriendRepo.getMany(allKeys);
  for (let i = 0; i < allKeys.length; i++) {
    const r = allRecords[i];
    if (
      (r.fromUserId === userIdA && r.toUserId === userIdB) ||
      (r.fromUserId === userIdB && r.toUserId === userIdA)
    ) {
      return { key: allKeys[i], record: r };
    }
  }
  return null;
}

/**
 * Returns true if two users currently have an accepted friendship.
 */
export async function areUsersFriends(userIdA: string, userIdB: string): Promise<boolean> {
  const existing = await findFriendRecord(userIdA, userIdB);
  return existing?.record.status === "accepted";
}

/**
 * Sends a friend request from one user to another.
 *
 * @param fromUsername - Username of the user sending the request
 * @param toUsername - Username of the user receiving the request
 * @returns The created FriendRecord, or an error message
 */
export async function sendFriendRequest(
  fromUsername: string,
  toUsername: string,
): Promise<FriendRecord | { error: string }> {
  if (fromUsername === toUsername) {
    return { error: "You cannot send a friend request to yourself" };
  }

  const fromUser = await getUserByUsername(fromUsername);
  const toUser = await getUserByUsername(toUsername);
  if (!fromUser) return { error: `User ${fromUsername} not found` };
  if (!toUser) return { error: `User ${toUsername} not found` };

  const existing = await findFriendRecord(fromUser.userId, toUser.userId);
  if (existing) {
    if (existing.record.status === "accepted") return { error: "You are already friends" };
    if (existing.record.status === "pending")
      return { error: "A friend request already exists between these users" };
  }

  const now = new Date().toISOString();
  const record: FriendRecord = {
    fromUserId: fromUser.userId,
    toUserId: toUser.userId,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  await FriendRepo.add(record);
  return record;
}

/**
 * Accepts or declines a pending friend request.
 *
 * @param toUsername - The user responding to the request (must be the recipient)
 * @param fromUsername - The user who originally sent the request
 * @param newStatus - Either "accepted" or "declined"
 * @returns The updated FriendRecord, or an error message
 */
export async function respondToFriendRequest(
  toUsername: string,
  fromUsername: string,
  newStatus: Extract<FriendStatus, "accepted" | "declined">,
): Promise<FriendRecord | { error: string }> {
  const fromUser = await getUserByUsername(fromUsername);
  const toUser = await getUserByUsername(toUsername);
  if (!fromUser) return { error: `User ${fromUsername} not found` };
  if (!toUser) return { error: `User ${toUsername} not found` };

  const existing = await findFriendRecord(fromUser.userId, toUser.userId);
  if (!existing) return { error: "No friend request found between these users" };
  if (existing.record.status !== "pending")
    return { error: "This request has already been resolved" };
  if (existing.record.toUserId !== toUser.userId)
    return { error: "Only the recipient can respond to this request" };

  const updated: FriendRecord = {
    ...existing.record,
    status: newStatus,
    updatedAt: new Date().toISOString(),
  };
  await FriendRepo.set(existing.key, updated);
  return updated;
}

/**
 * Retrieves all accepted friends for a given user.
 *
 * @param username - A valid username
 * @returns A list of userIds that are friends with this user
 */
export async function getFriends(username: string): Promise<string[] | { error: string }> {
  const user = await getUserByUsername(username);
  if (!user) return { error: `User ${username} not found` };

  const records = await getAllFriendRecordsForUser(user.userId);
  return records
    .filter(({ record }) => record.status === "accepted")
    .map(({ record }) => (record.fromUserId === user.userId ? record.toUserId : record.fromUserId));
}

/**
 * Retrieves all pending incoming friend requests for a given user.
 *
 * @param username - A valid username
 * @returns A list of userIds who have sent this user a pending request
 */
export async function getPendingRequests(username: string): Promise<string[] | { error: string }> {
  const user = await getUserByUsername(username);
  if (!user) return { error: `User ${username} not found` };

  const records = await getAllFriendRecordsForUser(user.userId);
  return records
    .filter(({ record }) => record.status === "pending" && record.toUserId === user.userId)
    .map(({ record }) => record.fromUserId);
}

/**
 * Removes an accepted friendship between two users.
 *
 * @param usernameA - One of the two friends
 * @param usernameB - The other friend
 * @returns void, or an error message
 */
export async function removeFriend(
  usernameA: string,
  usernameB: string,
): Promise<void | { error: string }> {
  const userA = await getUserByUsername(usernameA);
  const userB = await getUserByUsername(usernameB);
  if (!userA) return { error: `User ${usernameA} not found` };
  if (!userB) return { error: `User ${usernameB} not found` };

  const existing = await findFriendRecord(userA.userId, userB.userId);
  if (!existing || existing.record.status !== "accepted") {
    return { error: "These users are not friends" };
  }

  // Mark as declined to "soft delete" — or you could use a "removed" status
  const updated: FriendRecord = {
    ...existing.record,
    status: "declined",
    updatedAt: new Date().toISOString(),
  };
  await FriendRepo.set(existing.key, updated);
}
