import { withAuth, zNewClubMessagePayload } from "@gamenite/shared";
import { z } from "zod";
import { type SocketAPI } from "../types.ts";
import { logSocketError } from "./socket.controller.ts";
import { enforceAuth } from "../services/auth.service.ts";
import { createMessage } from "../services/message.service.ts";
import { addMessageToChat, getOrCreateChatById } from "../services/chat.service.ts";
import { getClubChatId, isClubMember } from "../services/club.service.ts";
import { populateSafeUserInfo } from "../services/user.service.ts";

/**
 * Join club chat room after verifying membership.
 */
export const socketJoin: SocketAPI = (socket) => async (body) => {
  try {
    const { auth, payload: clubName } = withAuth(z.string()).parse(body);
    const user = await enforceAuth(auth);

    const member = await isClubMember(user.username, clubName);
    if (!member) {
      throw new Error(
        `user ${user.username} attempted to join chat for non-member club ${clubName}`,
      );
    }

    const chatId = getClubChatId(clubName);
    const chat = await getOrCreateChatById(chatId);

    await socket.join(chatId);
    socket.emit("clubChatJoined", chat);
    socket
      .to(chatId)
      .emit("clubChatUserJoined", { chatId, user: await populateSafeUserInfo(user.userId) });
  } catch (err) {
    logSocketError(socket, err);
  }
};

/**
 * Leave club chat room after verifying membership.
 */
export const socketLeave: SocketAPI = (socket) => async (body) => {
  try {
    const { auth, payload: clubName } = withAuth(z.string()).parse(body);
    const user = await enforceAuth(auth);

    const member = await isClubMember(user.username, clubName);
    if (!member) {
      throw new Error(
        `user ${user.username} attempted to leave chat for non-member club ${clubName}`,
      );
    }

    const chatId = getClubChatId(clubName);
    if (!socket.rooms.has(chatId)) {
      throw new Error(`user ${user.username} left club chat they were not in`);
    }

    await socket.leave(chatId);
    socket
      .to(chatId)
      .emit("clubChatUserLeft", { chatId, user: await populateSafeUserInfo(user.userId) });
  } catch (err) {
    logSocketError(socket, err);
  }
};

/**
 * Send a message to a club chat room after verifying membership.
 */
export const socketSendMessage: SocketAPI = (socket, io) => async (body) => {
  try {
    const {
      auth,
      payload: { clubName, text },
    } = withAuth(zNewClubMessagePayload).parse(body);
    const user = await enforceAuth(auth);

    const member = await isClubMember(user.username, clubName);
    if (!member) {
      throw new Error(`user ${user.username} attempted to message non-member club ${clubName}`);
    }

    const chatId = getClubChatId(clubName);
    await getOrCreateChatById(chatId);
    const now = new Date();
    const message = await createMessage(user, text, now);
    await addMessageToChat(chatId, user, message.messageId);

    io.to(chatId).emit("clubChatNewMessage", { chatId, message });
  } catch (err) {
    logSocketError(socket, err);
  }
};
