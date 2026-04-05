import { type GameServer } from "../types.ts";
import { enforceAuth } from "./auth.service.ts";
import { type WithAuth } from "@gamenite/shared";

// Tracks which userIds are online (at least one active socket)
const onlineUsers = new Set<string>();
// Map socket.id -> userId so we can clean up on disconnect
const socketToUser = new Map<string, string>();

export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId);
}

export function handleUserPresenceOnline(
  io: GameServer,
  socketId: string,
): (payload: WithAuth<null>) => Promise<void> {
  return async (payload) => {
    const user = await enforceAuth(payload.auth);
    onlineUsers.add(user.userId);
    socketToUser.set(socketId, user.userId);
    io.emit("userStatusUpdated", { userId: user.userId, isOnline: true });
  };
}

// Handle a presence query for an arbitrary userId, responding only to the requesting socket
export function handleUserPresenceQuery(
  io: GameServer,
  socketId: string,
): (payload: WithAuth<string>) => Promise<void> {
  return async (payload) => {
    // Ensure the requester is authenticated, but we don't care which user they are
    await enforceAuth(payload.auth);
    const targetUserId = payload.payload;
    io.to(socketId).emit("userStatusUpdated", {
      userId: targetUserId,
      isOnline: isUserOnline(targetUserId),
    });
  };
}

export function handleSocketDisconnect(io: GameServer, socketId: string) {
  const userId = socketToUser.get(socketId);
  if (!userId) return;
  socketToUser.delete(socketId);

  // If this was the last socket for that user, mark them offline
  let stillHasSocket = false;
  for (const [, mappedUserId] of socketToUser) {
    if (mappedUserId === userId) {
      stillHasSocket = true;
      break;
    }
  }
  if (!stillHasSocket) {
    onlineUsers.delete(userId);
    io.emit("userStatusUpdated", { userId, isOnline: false });
  }
}

// Handle an explicit "user logged out" event
export function handleUserPresenceOffline(
  io: GameServer,
  socketId: string,
): (payload: WithAuth<null>) => Promise<void> {
  return async (payload) => {
    const user = await enforceAuth(payload.auth);

    // Remove any socket mappings for this user
    for (const [sid, uid] of [...socketToUser.entries()]) {
      if (uid === user.userId) {
        socketToUser.delete(sid);
      }
    }

    if (onlineUsers.has(user.userId)) {
      onlineUsers.delete(user.userId);
      io.emit("userStatusUpdated", { userId: user.userId, isOnline: false });
    }
  };
}

// Note: We no longer send a global snapshot on connect; clients query
// specific users via userPresenceQuery when needed.
