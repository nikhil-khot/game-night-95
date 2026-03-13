import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { enforceAuth } from "../../src/services/auth.service.ts";
import {
  addMessageToChat,
  addMoveLogToChat,
  createChat,
  forceChatById,
  getMoveLog,
} from "../../src/services/chat.service.ts";
import { createMessage } from "../../src/services/message.service.ts";

describe("chat.service", () => {
  it("creates a chat and can fetch it", async () => {
    const user1 = await enforceAuth({ username: "user1", password: "pwd1111" });
    const now = new Date();

    const chat = await createChat(now);
    expect(chat).toMatchObject({ chatId: expect.any(String), messages: [], moveLog: [] });

    const fetched = await forceChatById(chat.chatId, user1);
    expect(fetched).toMatchObject({ chatId: chat.chatId, messages: [], moveLog: [] });
  });

  it("throws when chat id is invalid for forceChatById", async () => {
    const user1 = await enforceAuth({ username: "user1", password: "pwd1111" });
    await expect(forceChatById(randomUUID().toString(), user1)).rejects.toThrow("invalid chat id");
  });

  it("adds a message to chat and returns expanded message info", async () => {
    const user1 = await enforceAuth({ username: "user1", password: "pwd1111" });
    const now = new Date();

    const chat = await createChat(now);
    const msg = await createMessage(user1, "hello world", now);

    const updatedChat = await addMessageToChat(chat.chatId, user1, msg.messageId);
    expect(updatedChat.messages).toHaveLength(1);
    expect(updatedChat.messages[0]).toMatchObject({
      messageId: msg.messageId,
      text: "hello world",
      createdBy: { username: "user1" },
    });
  });

  it("throws when adding a message to an invalid chat", async () => {
    const user1 = await enforceAuth({ username: "user1", password: "pwd1111" });
    await expect(addMessageToChat(randomUUID().toString(), user1, randomUUID().toString())).rejects.toThrow(
      "invalid chat id",
    );
  });

  it("adds and retrieves move logs; returns [] for invalid chat", async () => {
    const user1 = await enforceAuth({ username: "user1", password: "pwd1111" });
    const now = new Date();

    const chat = await createChat(now);
    const payload = await addMoveLogToChat(chat.chatId, " moved", user1, now);
    expect(payload).toMatchObject({
      chatId: chat.chatId,
      moveDescription: " moved",
      user: { username: "user1" },
    });

    const moveLog = await getMoveLog(chat.chatId);
    expect(moveLog).toHaveLength(1);
    expect(moveLog[0]).toMatchObject({ moveDescription: " moved", userId: user1.userId });

    await expect(getMoveLog(randomUUID().toString())).resolves.toStrictEqual([]);
  });

  it("throws when adding move log to invalid chat", async () => {
    const user1 = await enforceAuth({ username: "user1", password: "pwd1111" });
    await expect(addMoveLogToChat(randomUUID().toString(), "x", user1, new Date())).rejects.toThrow(
      "invalid chat id",
    );
  });
});
