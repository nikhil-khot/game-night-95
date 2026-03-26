import { z } from "zod";

/**
 * Represents the possible states of a friendship between two users.
 *
 * - `"pending"`  — A friend request has been sent but not yet responded to.
 * - `"accepted"` — The request was accepted; the two users are now friends.
 * - `"declined"` — The request was declined, or a prior friendship was removed.
 */
export type FriendStatus = "pending" | "accepted" | "declined";

/**
 * Represents a friendship or friend request between two users.
 *
 * - `fromUserId`: the user ID of the person who sent the friend request
 * - `toUserId`: the user ID of the person who received the friend request
 * - `status`: the current status of this relationship (pending, accepted, or declined)
 * - `createdAt`: when the friend request was sent
 * - `updatedAt`: when the friend request was last updated (e.g., accepted or declined)
 */
export interface FriendRecord {
  fromUserId: string; // who sent the request
  toUserId: string; // who received it
  status: FriendStatus; // current state of the relationship
  createdAt: string; // ISO timestamp of when request was sent
  updatedAt: string; // ISO timestamp of last status change
}

/*** TYPES USED IN THE FRIEND API ***/

/**
 * Payload for sending a friend request
 */
export type SendFriendRequestPayload = z.infer<typeof zSendFriendRequestPayload>;
export const zSendFriendRequestPayload = z.object({
  toUsername: z.string(),
});

/**
 * Payload for responding to a friend request
 */
export type RespondToFriendRequestPayload = z.infer<typeof zRespondToFriendRequestPayload>;
export const zRespondToFriendRequestPayload = z.object({
  fromUsername: z.string(),
  response: z.enum(["accepted", "declined"]),
});

/**
 * Payload for removing a friend
 */
export type RemoveFriendPayload = z.infer<typeof zRemoveFriendPayload>;
export const zRemoveFriendPayload = z.object({
  targetUsername: z.string(),
});

/**
 * Response from friend list endpoint - returns SafeUserInfo for each friend
 */
export type FriendListResponse = z.infer<typeof zFriendListResponse>;
export const zFriendListResponse = z.array(
  z.object({
    userId: z.string(),
    username: z.string(),
    createdAt: z.string(),
  }),
);

/**
 * Response from pending requests endpoint - returns SafeUserInfo for each pending requester
 */
export type PendingRequestsResponse = z.infer<typeof zPendingRequestsResponse>;
export const zPendingRequestsResponse = z.array(
  z.object({
    userId: z.string(),
    username: z.string(),
    createdAt: z.string(),
  }),
);
