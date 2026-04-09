import {
  type SafeUserInfo,
  type FriendChatInfo,
  withAuth,
  zOpenFriendChatPayload,
  zRespondToFriendRequestPayload,
  zRemoveFriendPayload,
  zSendFriendRequestPayload,
} from "@gamenite/shared";
import {
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
  getFriends,
  getPendingRequests,
} from "../services/friendRequest.service.ts";
import { openFriendChat } from "../services/friendChat.service.ts";
import { type RestAPI } from "../types.ts";
import { checkAuth } from "../services/auth.service.ts";
import { populateSafeUserInfo } from "../services/user.service.ts";

/**
 * Sends a friend request from the authenticated user to another user.
 *
 * @param req The request containing auth and toUsername in the body.
 * @param res The response, either returning the FriendRecord or an error.
 */
export const postSendRequest: RestAPI = async (req, res) => {
  const body = withAuth(zSendFriendRequestPayload).safeParse(req.body);
  if (!body.success) {
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }

  const user = await checkAuth(body.data.auth);
  if (!user) {
    res.status(403).send({ error: "Invalid credentials" });
    return;
  }

  const result = await sendFriendRequest(user.username, body.data.payload.toUsername);
  if ("error" in result) {
    res.send(result);
    return;
  }

  res.send(result);
};

/**
 * Responds to a pending friend request (accept or decline).
 *
 * @param req The request containing auth, fromUsername, and response in the body.
 * @param res The response, either returning the updated FriendRecord or an error.
 */
export const postRespondRequest: RestAPI = async (req, res) => {
  const body = withAuth(zRespondToFriendRequestPayload).safeParse(req.body);
  if (!body.success) {
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }

  const user = await checkAuth(body.data.auth);
  if (!user) {
    res.status(403).send({ error: "Invalid credentials" });
    return;
  }

  const result = await respondToFriendRequest(
    user.username,
    body.data.payload.fromUsername,
    body.data.payload.response,
  );
  if ("error" in result) {
    res.send(result);
    return;
  }

  res.send(result);
};

/**
 * Removes a friend from the authenticated user's friend list.
 *
 * @param req The request containing auth and targetUsername in the body.
 * @param res The response, either returning success or an error.
 */
export const postRemoveFriend: RestAPI = async (req, res) => {
  const body = withAuth(zRemoveFriendPayload).safeParse(req.body);
  if (!body.success) {
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }

  const user = await checkAuth(body.data.auth);
  if (!user) {
    res.status(403).send({ error: "Invalid credentials" });
    return;
  }

  const result = await removeFriend(user.username, body.data.payload.targetUsername);
  if (result && "error" in result) {
    res.send(result);
    return;
  }

  res.send({ success: true });
};

/**
 * Gets the friend list for the authenticated user.
 * Returns SafeUserInfo for each friend.
 *
 * @param req The request containing the username query parameter.
 * @param res The response, either returning an array of SafeUserInfo or an error.
 */
export const getList: RestAPI<SafeUserInfo[]> = async (req, res) => {
  const username = req.query.username;
  if (typeof username !== "string") {
    res.status(400).send({ error: "Missing or invalid username parameter" });
    return;
  }

  const result = await getFriends(username);
  if ("error" in result) {
    res.send(result);
    return;
  }

  // Convert userIds to SafeUserInfo
  const friendsInfo: SafeUserInfo[] = [];
  for (const userId of result) {
    try {
      const userInfo = await populateSafeUserInfo(userId);
      friendsInfo.push(userInfo);
    } catch {
      // Skip if user not found
    }
  }

  res.send(friendsInfo);
};

/**
 * Gets pending friend requests for the authenticated user.
 * Returns SafeUserInfo for each user who sent a pending request.
 *
 * @param req The request containing the username query parameter.
 * @param res The response, either returning an array of SafeUserInfo or an error.
 */
export const getPending: RestAPI<SafeUserInfo[]> = async (req, res) => {
  const username = req.query.username;
  if (typeof username !== "string") {
    res.status(400).send({ error: "Missing or invalid username parameter" });
    return;
  }

  const result = await getPendingRequests(username);
  if ("error" in result) {
    res.send(result);
    return;
  }

  // Convert userIds to SafeUserInfo
  const pendingInfo: SafeUserInfo[] = [];
  for (const userId of result) {
    try {
      const userInfo = await populateSafeUserInfo(userId);
      pendingInfo.push(userInfo);
    } catch {
      // Skip if user not found
    }
  }

  res.send(pendingInfo);
};

/**
 * Opens a private friend chat, creating it if it does not exist yet.
 */
export const postOpenChat: RestAPI<FriendChatInfo> = async (req, res) => {
  const body = withAuth(zOpenFriendChatPayload).safeParse(req.body);
  if (!body.success) {
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }

  const user = await checkAuth(body.data.auth);
  if (!user) {
    res.status(403).send({ error: "Invalid credentials" });
    return;
  }

  const result = await openFriendChat(user.username, body.data.payload.targetUsername);
  if ("error" in result) {
    res.send(result);
    return;
  }

  res.send(result);
};
