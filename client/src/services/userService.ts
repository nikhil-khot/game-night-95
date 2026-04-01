import type { APIResponse } from "../util/types.ts";
import { api, exceptionToErrorMsg } from "./api.ts";
import type {
  ErrorMsg,
  SafeUserInfo,
  UserAuth,
  UserPreferences,
  UserPreferencesUpdateRequest,
  UserUpdateRequest,
} from "@gamenite/shared";

const USER_API_URL = `/api/user`;

/**
 * Sends a POST request to authenticate a user.
 */
export const loginUser = async (auth: UserAuth): APIResponse<SafeUserInfo> => {
  try {
    const res = await api.post<SafeUserInfo | ErrorMsg>(`${USER_API_URL}/login`, auth);
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/**
 * Sends a POST request to update parts of a user's profile
 */
export const updateUser = async (
  auth: UserAuth,
  updates: UserUpdateRequest,
): APIResponse<SafeUserInfo> => {
  try {
    const res = await api.post<SafeUserInfo | ErrorMsg>(`${USER_API_URL}/${auth.username}`, {
      auth,
      payload: updates,
    });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/**
 * Sends a POST request to create a user
 *
 * @param user - The user credentials (username and password) for login.
 * @returns The authenticated user object, or an error message.
 */
export const signupUser = async (user: UserAuth): APIResponse<SafeUserInfo> => {
  try {
    const res = await api.post<SafeUserInfo | ErrorMsg>(`${USER_API_URL}/signup`, user);
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/**
 * Sends a GET request for a user's data
 *
 * @param username - The username
 * @returns The user's information, or an error message.
 */
export const getUserById = async (username: string): APIResponse<SafeUserInfo> => {
  try {
    const res = await api.get<SafeUserInfo | ErrorMsg>(`${USER_API_URL}/${username}`);
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/**
 * Sends a GET request for a user's display preferences.
 */
export const getUserPreferences = async (username: string): APIResponse<UserPreferences> => {
  try {
    const res = await api.get<UserPreferences | ErrorMsg>(
      `${USER_API_URL}/${username}/preferences`,
    );
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/**
 * Sends a POST request to update a user's display preferences.
 */
export const updateUserPreferences = async (
  auth: UserAuth,
  updates: UserPreferencesUpdateRequest,
): APIResponse<UserPreferences> => {
  try {
    const res = await api.post<UserPreferences | ErrorMsg>(
      `${USER_API_URL}/${auth.username}/preferences`,
      {
        auth,
        payload: updates,
      },
    );
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

export async function loginWithGoogle(code: string): Promise<SafeUserInfo | ErrorMsg> {
  const res = await fetch("/api/auth/google/callback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
  });

  const data = (await res.json()) as SafeUserInfo | ErrorMsg;
  return data;
}
