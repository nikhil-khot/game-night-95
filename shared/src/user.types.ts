import { z } from "zod";

/**
 * Represents a "safe" user object that excludes sensitive information like
 * the password, suitable for exposing to clients,
 * - `username`: unique username of the user
 * - `display`: A display name
 * - `createdAt`: when this when the user registered.
 */
export interface SafeUserInfo {
  userId: string; // Unique identifier for the user
  username: string;
  display: string;
  createdAt: Date;
  bio: string;
  // Removed isOnline and isActive as they are managed in real-time
}

/*** TYPES USED IN THE USER API ***/

/**
 * Represents allowed updates to a user.
 */
export type UserUpdateRequest = z.infer<typeof zUserUpdateRequest>;
export const zUserUpdateRequest = z.object({
  password: z.string().optional(),
  display: z.string().optional(),
  bio: z.string().max(500).optional(),
});

/**
 * User display preferences persisted to the user account.
 */
export interface UserPreferences {
  theme: "light" | "dark" | "win95";
  fontSize: "small" | "medium" | "large";
  profilePictureUrl?: string;
  bannerImageUrl?: string;
  updatedAt: Date;
}

/**
 * DB-shaped user preferences record.
 *
 * Use this when handling data that comes from persistence layers where
 * timestamps are serialized and the owning `userId` is included.
 */
export interface UserPreferencesRecord {
  userId: string;
  theme: "light" | "dark" | "win95";
  fontSize: "small" | "medium" | "large";
  profilePictureUrl?: string;
  bannerImageUrl?: string;
  updatedAt: string;
}

/**
 * Represents allowed updates to user display preferences.
 */
export type UserPreferencesUpdateRequest = z.infer<typeof zUserPreferencesUpdateRequest>;
export const zUserPreferencesUpdateRequest = z.object({
  theme: z.enum(["win95", "light", "dark"]).optional(),
  fontSize: z.enum(["small", "medium", "large"]).optional(),
  profilePictureUrl: z.string().optional(),
  bannerImageUrl: z.string().optional(),
});
