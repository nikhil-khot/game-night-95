import { describe, expect, it } from "vitest";
import { getUserByUsername } from "../../src/services/auth.service.ts";
import {
  buildFriendChatId,
  enforceFriendChatAccess,
  openFriendChat,
} from "../../src/services/friendChat.service.ts";
import {
  respondToFriendRequest,
  sendFriendRequest,
} from "../../src/services/friendRequest.service.ts";

describe("friendChat service", () => {
  it("builds the same chat id regardless of user order", () => {
    expect(buildFriendChatId("b", "a")).toBe("friend:a:b");
    expect(buildFriendChatId("a", "b")).toBe("friend:a:b");
  });

  it("opens a chat once friendship is accepted", async () => {
    await sendFriendRequest("user1", "user2");
    await respondToFriendRequest("user2", "user1", "accepted");

    const result = await openFriendChat("user1", "user2");

    expect(result).toStrictEqual({
      chatId: expect.stringMatching(/^friend:/),
    });
  });

  it("rejects invalid chat ids and non-participants", async () => {
    const user1 = await getUserByUsername("user1");
    const user3 = await getUserByUsername("user3");

    await expect(enforceFriendChatAccess("bad-chat-id", user1!.userId)).rejects.toThrow(
      "Invalid friend chat id",
    );
    await expect(enforceFriendChatAccess("friend:user1:user2", user3!.userId)).rejects.toThrow(
      "User is not part of this friend chat",
    );
  });

  it("rejects chat access if friendship is not accepted", async () => {
    const user1 = await getUserByUsername("user1");
    const user2 = await getUserByUsername("user2");
    const chatId = buildFriendChatId(user1!.userId, user2!.userId);

    await expect(enforceFriendChatAccess(chatId, user1!.userId)).rejects.toThrow(
      "Friend chat is only available between accepted friends",
    );
  });
});
