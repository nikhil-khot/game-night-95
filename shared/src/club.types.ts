import { z } from "zod";

/**
 * Represents the role a user holds within a club.
 *
 * - `"owner"` — Created the club. Can promote/demote admins and remove any member.
 * - `"admin"` — Elevated member. Can remove regular members but not other admins or the owner.
 * - `"member"` — Standard club member with no moderation privileges.
 */
export type ClubRole = "owner" | "admin" | "member";

/**
 * Represents a single member's entry within a club.
 * - `userId`: the user ID of this member
 * - `username`: the username of this member
 * - `role`: the member's role within the club (owner, admin, or member)
 * - `points`: leaderboard points this member has earned within the club
 * - `joinedAt`: when this user joined the club
 */
export interface ClubMemberInfo {
  userId: string;
  username: string;
  role: ClubRole;
  points: number;
  joinedAt: string;
}

/**
 * Represents a club as exposed to the client.
 * - `name`: the club's display name; must be unique across all clubs
 * - `description`: a short bio or description for the club
 * - `members`: the list of current club members, each with their role and leaderboard points
 * - `createdAt`: when the club was created
 */
export interface ClubInfo {
  name: string;
  description: string;
  members: ClubMemberInfo[];
  createdAt: string;
}

/*** TYPES USED IN THE CLUB API ***/

/**
 * Payload for creating a new club
 */
export type CreateClubPayload = z.infer<typeof zCreateClubPayload>;
export const zCreateClubPayload = z.object({
  name: z.string(),
  description: z.string(),
});

/**
 * Payload for joining a club
 */
export type JoinClubPayload = z.infer<typeof zJoinClubPayload>;
export const zJoinClubPayload = z.object({
  clubName: z.string(),
});

/**
 * Payload for leaving a club
 */
export type LeaveClubPayload = z.infer<typeof zLeaveClubPayload>;
export const zLeaveClubPayload = z.object({
  clubName: z.string(),
});

/**
 * Payload for deleting a club (owner only)
 */
export type DeleteClubPayload = z.infer<typeof zDeleteClubPayload>;
export const zDeleteClubPayload = z.object({
  clubName: z.string(),
});

/**
 * Payload for removing a member from a club
 */
export type RemoveClubMemberPayload = z.infer<typeof zRemoveClubMemberPayload>;
export const zRemoveClubMemberPayload = z.object({
  clubName: z.string(),
  targetUsername: z.string(),
});

/**
 * Payload for setting a member's role in a club
 */
export type SetClubMemberRolePayload = z.infer<typeof zSetClubMemberRolePayload>;
export const zSetClubMemberRolePayload = z.object({
  clubName: z.string(),
  targetUsername: z.string(),
  newRole: z.enum(["admin", "member"]),
});

/**
 * Response from club list endpoint - returns ClubInfo for each club
 */
export type ClubListResponse = z.infer<typeof zClubListResponse>;
export const zClubListResponse = z.array(
  z.object({
    name: z.string(),
    description: z.string(),
    members: z.array(
      z.object({
        userId: z.string(),
        username: z.string(),
        role: z.enum(["owner", "admin", "member"]),
        points: z.number(),
        joinedAt: z.string(),
      }),
    ),
    createdAt: z.string(),
  }),
);
