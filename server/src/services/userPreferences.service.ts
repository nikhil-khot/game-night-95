import type { UserPreferencesUpdateRequest } from "@gamenite/shared";
import type { UserPreferencesRecord } from "../models.ts";
import { UserPreferencesRepo, UserRepo } from "../repository.ts";

/**
 * Default preferences assigned to users who have not explicitly set any.
 */
const defaultPreferences = {
  theme: "light",
  fontSize: "medium",
} as const satisfies Pick<UserPreferencesRecord, "theme" | "fontSize">;

/**
 * Creates and stores default preferences for a user.
 *
 * @param userId - Valid user id
 * @param updatedAt - Optional timestamp override for deterministic testing
 * @returns the created preferences record
 */
export async function createDefaultUserPreferences(
  userId: string,
  updatedAt: Date = new Date(),
): Promise<UserPreferencesRecord> {
  const record: UserPreferencesRecord = {
    userId,
    ...defaultPreferences,
    updatedAt: updatedAt.toISOString(),
  };
  await UserPreferencesRepo.set(userId, record);
  return record;
}

/**
 * Retrieves a user's preferences if they exist.
 *
 * @param userId - Valid user id
 * @returns preferences, or null if none have been set
 */
export async function getUserPreferences(userId: string): Promise<UserPreferencesRecord | null> {
  return UserPreferencesRepo.find(userId);
}

/**
 * Retrieves a user's preferences, creating defaults if needed.
 *
 * @param userId - Valid user id
 * @returns existing or newly created preferences
 * @throws if the user does not exist
 */
export async function getOrCreateUserPreferences(userId: string): Promise<UserPreferencesRecord> {
  const user = await UserRepo.find(userId);
  if (!user) {
    throw new Error(`No user ${userId}`);
  }

  const existing = await UserPreferencesRepo.find(userId);
  if (existing) return existing;

  return createDefaultUserPreferences(userId);
}

/**
 * Updates a user's preferences with a partial patch.
 *
 * @param userId - Valid user id
 * @param updates - Partial preference fields to merge
 * @param updatedAt - Optional timestamp override for deterministic testing
 * @returns updated preferences record
 * @throws if the user does not exist
 */
export async function updateUserPreferences(
  userId: string,
  updates: UserPreferencesUpdateRequest,
  updatedAt: Date = new Date(),
): Promise<UserPreferencesRecord> {
  const current = await getOrCreateUserPreferences(userId);
  console.log("Validation: updates =", updates);
  validateUserPreferences(updates);
  const next: UserPreferencesRecord = {
    ...current,
    ...updates,
    userId,
    updatedAt: updatedAt.toISOString(),
  };
  await UserPreferencesRepo.set(userId, next);
  return next;
}

/**
 * Validates that the provided updates object contains only valid preference fields.
 *
 * @param updates - Partial preference fields to merge
 * @returns true if all fields are valid, false otherwise
 */
export function validateUserPreferences(updates: UserPreferencesUpdateRequest): boolean {
  const validFields = ["theme", "fontSize"];
  const invalidFields = Object.keys(updates).filter((key) => !validFields.includes(key));
  if (invalidFields.length > 0) {
    throw new Error(`Invalid preference fields: ${invalidFields.join(", ")}`);
  }
  return true;
}

export type { UserPreferencesUpdateRequest };
