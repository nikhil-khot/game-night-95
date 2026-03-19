import {
  type SafeUserInfo,
  type UserPreferences,
  withAuth,
  zUserAuth,
  zUserPreferencesUpdateRequest,
  zUserUpdateRequest,
} from "@gamenite/shared";
import {
  createUser,
  getUsersByUsername,
  populateSafeUserInfo,
  updateUser,
} from "../services/user.service.ts";
import { type RestAPI } from "../types.ts";
import { z } from "zod";
import { checkAuth, getUserByUsername } from "../services/auth.service.ts";
import type { UserPreferencesRecord } from "../models.ts";
import {
  getOrCreateUserPreferences,
  updateUserPreferences,
} from "../services/userPreferences.service.ts";

function populateUserPreferences(record: UserPreferencesRecord): UserPreferences {
  const base: UserPreferences = {
    theme: record.theme,
    fontSize: record.fontSize,
    banner: record.banner,
    updatedAt: new Date(record.updatedAt),
  };

  // Only include profilePictureUrl when it's a non-empty string so tests
  // that expect the property to be absent continue to pass.
  if (record.profilePictureUrl && record.profilePictureUrl !== "") {
    return { ...base, profilePictureUrl: record.profilePictureUrl };
  }

  return base;
}

/**
 * Handles user login by validating credentials.
 * @param req The request containing username and password in the body.
 * @param res The response, either returning the user or an error.
 */
export const postLogin: RestAPI<SafeUserInfo> = async (req, res) => {
  const userAuth = zUserAuth.safeParse(req.body);
  if (!userAuth.success) {
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }

  const user = await checkAuth(userAuth.data);
  if (!user) {
    res.send({ error: "Invalid username or password" });
    return;
  }

  res.send(await populateSafeUserInfo(user.userId));
};

/**
 * Update a user's information
 * @param req A request containing a new password
 * @param res The response, either returning the updated user or an error
 */
export const postByUsername: RestAPI<SafeUserInfo, { username: string }> = async (req, res) => {
  const body = withAuth(zUserUpdateRequest).safeParse(req.body);
  if (!body.success) {
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }

  const user = await checkAuth(body.data.auth);
  if (!user || user.username !== req.params.username) {
    res.status(403).send({ error: "Invalid credentials" });
    return;
  }

  res.send(await updateUser(req.params.username, body.data.payload));
};

/**
 * Handles the creation of a new user account.
 * @param req The request containing username and password in the body.
 * @param res The response, either returning the created user or an error.
 * @returns A promise resolving to void.
 */
export const postSignup: RestAPI<SafeUserInfo> = async (req, res) => {
  const userAuth = zUserAuth.safeParse(req.body);
  if (!userAuth.success) {
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }

  res.send(await createUser(userAuth.data.username, userAuth.data.password, new Date()));
};

/**
 * Retrieves a user by their username.
 * @param req The request containing the username as a route parameter.
 * @param res The response, either returning the user (200) or an error.
 */
export const getByUsername: RestAPI<SafeUserInfo, { username: string }> = async (req, res) => {
  const user = await getUserByUsername(req.params.username);
  if (!user) {
    res.status(404).send({ error: "User not found" });
    return;
  }
  res.send(await populateSafeUserInfo(user.userId));
};

/**
 * Retrieves preferences for a user by username.
 */
export const getByUsernamePreferences: RestAPI<UserPreferences, { username: string }> = async (
  req,
  res,
) => {
  const user = await getUserByUsername(req.params.username);
  if (!user) {
    res.status(404).send({ error: "User not found" });
    return;
  }

  const preferences = await getOrCreateUserPreferences(user.userId);
  res.send(populateUserPreferences(preferences));
};

/**
 * Updates preferences for a user by username.
 */
export const postByUsernamePreferences: RestAPI<UserPreferences, { username: string }> = async (
  req,
  res,
) => {
  const body = withAuth(zUserPreferencesUpdateRequest).safeParse(req.body);
  if (!body.success) {
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }

  const user = await checkAuth(body.data.auth);
  if (!user || user.username !== req.params.username) {
    res.status(403).send({ error: "Invalid credentials" });
    return;
  }

  const preferences = await updateUserPreferences(user.userId, body.data.payload, new Date());
  res.send(populateUserPreferences(preferences));
};

/**
 * Returns the user information for a list of users
 */
export const postList: RestAPI<SafeUserInfo[]> = async (req, res) => {
  const usernames = z.array(z.string()).safeParse(req.body);
  if (!usernames.success) {
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }

  let users: SafeUserInfo[];
  try {
    users = await getUsersByUsername(usernames.data);
  } catch {
    res.send({ error: "Usernames do not all exist" });
    return;
  }

  res.send(users);
};
