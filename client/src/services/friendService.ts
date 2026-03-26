import type { APIResponse } from "../util/types.ts";
import { api, exceptionToErrorMsg } from "./api.ts";
import type { ErrorMsg, SafeUserInfo, UserAuth, FriendRecord } from "@gamenite/shared";

const FRIEND_API_URL = `/api/friend`;

/**
 * Sends a friend request to another user
 *
 * @param auth - The authenticated user
 * @param toUsername - The username of the user to send the request to
 * @returns The FriendRecord or an error message
 */
export const sendFriendRequest = async (
  auth: UserAuth,
  toUsername: string,
): APIResponse<FriendRecord> => {
  try {
    const res = await api.post<FriendRecord | ErrorMsg>(`${FRIEND_API_URL}/send`, {
      auth,
      payload: { toUsername },
    });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/**
 * Responds to a pending friend request
 *
 * @param auth - The authenticated user
 * @param fromUsername - The username of the user who sent the request
 * @param response - "accepted" or "declined"
 * @returns The updated FriendRecord or an error message
 */
export const respondToFriendRequest = async (
  auth: UserAuth,
  fromUsername: string,
  response: "accepted" | "declined",
): APIResponse<FriendRecord> => {
  try {
    const res = await api.post<FriendRecord | ErrorMsg>(`${FRIEND_API_URL}/respond`, {
      auth,
      payload: { fromUsername, response },
    });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/**
 * Removes a friend from the friend list
 *
 * @param auth - The authenticated user
 * @param targetUsername - The username of the user to remove as a friend
 * @returns Success response or an error message
 */
export const removeFriend = async (
  auth: UserAuth,
  targetUsername: string,
): APIResponse<{ success: boolean }> => {
  try {
    const res = await api.post<{ success: boolean } | ErrorMsg>(`${FRIEND_API_URL}/remove`, {
      auth,
      payload: { targetUsername },
    });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/**
 * Gets the list of friends for a user
 *
 * @param username - The username of the user
 * @returns An array of SafeUserInfo for each friend or an error message
 */
export const getFriendsList = async (username: string): APIResponse<SafeUserInfo[]> => {
  try {
    const res = await api.get<SafeUserInfo[] | ErrorMsg>(
      `${FRIEND_API_URL}/list?username=${username}`,
    );
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/**
 * Gets the list of pending friend requests for a user
 *
 * @param username - The username of the user
 * @returns An array of SafeUserInfo for each user with a pending request or an error message
 */
export const getPendingRequests = async (username: string): APIResponse<SafeUserInfo[]> => {
  try {
    const res = await api.get<SafeUserInfo[] | ErrorMsg>(
      `${FRIEND_API_URL}/pending?username=${username}`,
    );
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};
