import type { GameMode, GameType } from "@gamenite/shared";

/**
 * Record identifiers used to look up keys in a database. This type
 * abbreviation is intended to suggest that the key should be a randomly
 * generated unique ID.
 */
export type RecordId = string;

/**
 * Actual JavaScript Date objects can't necessarily be stored in a database;
 * this type indicates that the string should be the result of taking a Date
 * object and turning it to a string with the Date.toISOString() method.
 */
export type DateISO = string;

/**
 * Represents a user's authorization record in the database.
 * - `user`: the user ID of the corresponding User model
 * - `password`: the password for this user
 */
export interface AuthRecord {
  userId: RecordId; // References User models
  password: string;
}

/**
 * Represents a chat document in the database.
 * - `messages`: the ordered list of messages in the chat
 * - `moveLog`: the ordered list of move log entries for this chat
 * - `createdAt`: when the chat was created
 */
export interface ChatRecord {
  messages: RecordId[]; // References Message models
  moveLog: MoveLogEntry[];
  createdAt: DateISO;
}

/**
 * Represents a game move log entry stored in a chat.
 * - `moveDescription`: human-readable description of the move
 * - `userId`: the user who made the move
 * - `createdAt`: when the move was made
 */
export interface MoveLogEntry {
  moveDescription: string;
  userId: RecordId;
  createdAt: DateISO;
}

/**
 * Represents a comment in the database.
 * - `text`: comment contents
 * - `createdBy`: username of the commenter
 * - `createdAt`: when the comment was made
 * - `editedAt`: when the comment was last modified
 */
export interface CommentRecord {
  text: string;
  createdBy: RecordId; // References User records
  createdAt: DateISO;
  editedAt?: DateISO;
}

/**
 * Represents a game document in the database.
 * - `type`: picks which game this is
 * - `mode`: picks whether the game is between players, clubs, or ais
 * - `state`: absent if the game hasn't started, or the id for the game's state
 * - `done`: if the game has completed or not
 * - `winner`: list of winners of the game; empty if the game has not finished
 * - `chat`: id for the game's chat
 * - `players`: active players for the game
 * - `createdAt`: when the game was created
 * - `createdBy`: username of the person who created the game
 */
export interface GameRecord {
  type: GameType;
  mode: GameMode;
  state?: unknown;
  done: boolean;
  winners: RecordId[];
  chat: RecordId; // References Chat records
  players: RecordId[]; // References User records
  createdAt: DateISO;
  createdBy: RecordId; // References User records
  /**
   * List of user IDs who have been invited to this game but are not yet in players[]
   */
  invited?: RecordId[];
  /** Club names [creatorClub, opponentClub] for "club vs club" games */
  clubs?: [string, string];
  /** Per-club player rosters for "club vs club" games: [club0userIds, club1userIds] */
  clubRosters?: [string[], string[]];
  /** AI difficulty string ("easy" | "medium" | "hard") for "player vs ai" games */
  aiType?: string;
}

/**
 * Represents a message in the database.
 * - `text`: message contents
 * - `createdBy`: username of message sender
 * - `createdAt`: when the message was sent
 */
export interface MessageRecord {
  text: string;
  createdBy: RecordId; // References User records
  createdAt: DateISO;
}

/**
 * Represents a forum post as it's stored in the database.
 * - `title`: post title
 * - `text`: post contents
 * - `points`: score of the thread
 * - `upvoters`: users who upvoted this thread
 * - `downvoters`: users who downvoted this thread
 * - `createdAt`: when the thread was posted
 * - `createdBy`: username of OP
 * - `comments`: replies to the post
 */
export interface ThreadRecord {
  title: string;
  text: string;
  points: number;
  upvoters: RecordId[]; // References User records who upvoted this thread
  downvoters: RecordId[]; // References User records who downvoted this thread
  createdAt: DateISO;
  createdBy: RecordId; // References User records
  comments: RecordId[]; // References Comment records
}

/**
 * Represents a user document in the database.
 * - `password`: user's password
 * - `display`: A display name
 * - `createdAt`: when this user registered.
 */
export interface UserRecord {
  username: string; // References Auth records
  display: string;
  createdAt: DateISO;
}

/**
 * Theme options for user display preferences.
 */
export type UserTheme = "light" | "dark" | "win95";

/**
 * Font size options for user display preferences.
 */
export type UserFontSize = "small" | "medium" | "large";

/**
 * Represents a user's persisted UI/display preferences.
 *
 * `userId`: the user ID of the corresponding User model; also serves as the repo key for this record
 * `theme`: the user's chosen theme (e.g., light or dark mode)
 * `fontSize`: the user's preferred font size for UI text
 * `profilePictureUrl`: optional URL for the user's profile picture, if applicable
 * `banner`: optional field containing the user's banner preferences for their profile
 * `updatedAt`: when the user last updated their preferences
 */
export interface UserPreferencesRecord {
  userId: RecordId; // References User records; should also be used as repo key
  theme: UserTheme;
  fontSize: UserFontSize;
  profilePictureUrl?: string;
  bannerImageUrl?: string;
  updatedAt: DateISO;
}

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
 * `fromUserId`: the user ID of the person who sent the friend request
 * `toUserId`: the user ID of the person who received the friend request
 * `status`: the current status of this relationship (pending, accepted, or declined)
 * `createdAt`: when the friend request was sent
 * `updatedAt`: when the friend request was last updated (e.g., accepted or declined)
 */

export interface FriendRecord {
  fromUserId: string; // who sent the request
  toUserId: string; // who received it
  status: FriendStatus; // current state of the relationship
  createdAt: string; // ISO timestamp of when request was sent
  updatedAt: string; // ISO timestamp of last status change
}

/**
 * The role a user can hold within a club.
 *
 * - `"owner"` — Created the club. Can promote/demote admins and remove any member.
 *               There is exactly one owner per club at all times.
 * - `"admin"` — Elevated member. Can remove regular members but not other admins or the owner.
 * - `"member"` — Standard club member with no moderation privileges.
 */
export type ClubRole = "owner" | "admin" | "member";

/**
 * Represents a single member's entry within a club,
 * including their role and contribution to the club leaderboard.
 * - `userId`: the user ID of this member
 * - `role`: the member's role within the club (owner, admin, or member)
 * - `points`: leaderboard points this member has earned within the club
 * - `joinedAt`: when this user joined the club
 */
export interface ClubMember {
  userId: string;
  role: ClubRole;
  points: number;
  joinedAt: string;
}

/**
 * Represents a club — a persistent group that users can join, compete in, and communicate within.
 * - `name`: the club's display name; must be unique across all clubs
 * - `description`: a short bio or description for the club
 * - `members`: the list of current club members, each with their role and leaderboard points; the owner is always present in this list with role `"owner"`
 * - `createdAt`: when the club was created
 *
 *
 * @todo Decide what happens when the owner leaves — options are:
 *   1. Club is deleted
 *   2. Ownership transfers to the longest-standing admin (or member)
 *
 */
export interface ClubRecord {
  name: string;
  description: string;
  members: ClubMember[];
  createdAt: string;
}
