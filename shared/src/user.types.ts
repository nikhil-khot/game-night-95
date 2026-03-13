import { z } from "zod";

/**
 * Represents a "safe" user object that excludes sensitive information like
 * the password, suitable for exposing to clients,
 * - `username`: unique username of the user
 * - `display`: A display name
 * - `createdAt`: when this when the user registered.
 */
export interface SafeUserInfo {
  username: string;
  display: string;
  createdAt: Date;
}

/*** TYPES USED IN THE USER API ***/

/**
 * Represents allowed updates to a user.
 */
export type UserUpdateRequest = z.infer<typeof zUserUpdateRequest>;
export const zUserUpdateRequest = z.object({
  password: z.string().optional(),
  display: z.string().optional(),
});

/**
 * Banner display preferences.
 */
export interface BannerPreferences {
  imageUrl?: string;
  position?: "top" | "center" | "bottom";
  overlayOpacity?: number;
}

/**
 * User display preferences persisted to the user account.
 */
export interface UserPreferences {
  theme: "light" | "dark";
  fontSize: "small" | "medium" | "large";
  profilePictureChoice?: string;
  profilePictureUrl?: string;
  banner?: BannerPreferences;
  updatedAt: Date;
}

/**
 * Represents allowed updates to user display preferences.
 */
export type UserPreferencesUpdateRequest = z.infer<typeof zUserPreferencesUpdateRequest>;
export const zUserPreferencesUpdateRequest = z.object({
  theme: z.enum(["light", "dark"]).optional(),
  fontSize: z.enum(["small", "medium", "large"]).optional(),
  profilePictureChoice: z.string().optional(),
  profilePictureUrl: z.string().optional(),
  banner: z
    .object({
      imageUrl: z.string().optional(),
      position: z.enum(["top", "center", "bottom"]).optional(),
      overlayOpacity: z.number().min(0).max(1).optional(),
    })
    .optional(),
});
