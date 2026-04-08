import { getUserByUsername } from "./auth.service.ts";
import { getOrCreateChatById } from "./chat.service.ts";
import { areUsersFriends } from "./friendRequest.service.ts";

const FRIEND_CHAT_PREFIX = "friend:";

function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

/**
 * Builds a deterministic chat id for an accepted friendship.
 */
export function buildFriendChatId(userIdA: string, userIdB: string): string {
  const [first, second] = orderedPair(userIdA, userIdB);
  return `${FRIEND_CHAT_PREFIX}${first}:${second}`;
}

function parseFriendChatId(chatId: string): [string, string] | null {
  if (!chatId.startsWith(FRIEND_CHAT_PREFIX)) return null;
  const remainder = chatId.slice(FRIEND_CHAT_PREFIX.length);
  const parts = remainder.split(":");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return [parts[0], parts[1]];
}

/**
 * Validates that a user can access a private friend chat room.
 */
export async function enforceFriendChatAccess(chatId: string, userId: string): Promise<void> {
  const pair = parseFriendChatId(chatId);
  if (!pair) throw new Error("Invalid friend chat id");

  const [firstUserId, secondUserId] = pair;
  if (userId !== firstUserId && userId !== secondUserId) {
    throw new Error("User is not part of this friend chat");
  }

  const areFriends = await areUsersFriends(firstUserId, secondUserId);
  if (!areFriends) {
    throw new Error("Friend chat is only available between accepted friends");
  }
}

/**
 * Returns a private friend chat id, creating the backing chat if needed.
 */
export async function openFriendChat(
  requesterUsername: string,
  targetUsername: string,
): Promise<{ chatId: string } | { error: string }> {
  if (requesterUsername === targetUsername) {
    return { error: "You cannot start a private chat with yourself" };
  }

  const requester = await getUserByUsername(requesterUsername);
  const target = await getUserByUsername(targetUsername);

  if (!requester) return { error: `User ${requesterUsername} not found` };
  if (!target) return { error: `User ${targetUsername} not found` };

  const areFriends = await areUsersFriends(requester.userId, target.userId);
  if (!areFriends) {
    return { error: "You can only message users who are already your friend" };
  }

  const chatId = buildFriendChatId(requester.userId, target.userId);
  await getOrCreateChatById(chatId);

  return { chatId };
}
