import { beforeEach, describe, expect, it } from "vitest";
import {
  getFriends,
  getPendingRequests,
  removeFriend,
  respondToFriendRequest,
  sendFriendRequest,
} from "../../src/services/friendRequest.service.ts";
import { AuthRepo, FriendRepo } from "../../src/repository.ts";

beforeEach(async () => {
  await FriendRepo.clear();
});

describe("sendFriendRequest/respondToFriendRequest", () => {
  it("rejects invalid self-request", async () => {
    await expect(sendFriendRequest("user1", "user1")).resolves.toStrictEqual({
      error: "You cannot send a friend request to yourself",
    });
  });

  it("creates a pending request and blocks duplicate pending requests", async () => {
    const created = await sendFriendRequest("user1", "user2");
    expect(created).toMatchObject({ status: "pending" });

    await expect(sendFriendRequest("user1", "user2")).resolves.toStrictEqual({
      error: "A friend request already exists between these users",
    });
  });

  it("allows only the recipient to respond", async () => {
    await sendFriendRequest("user1", "user2");

    await expect(respondToFriendRequest("user1", "user2", "accepted")).resolves.toStrictEqual({
      error: "Only the recipient can respond to this request",
    });

    const accepted = await respondToFriendRequest("user2", "user1", "accepted");
    expect(accepted).toMatchObject({ status: "accepted" });
  });

  it("returns already friends when duplicate request after accepted", async () => {
    await sendFriendRequest("user1", "user2");
    await respondToFriendRequest("user2", "user1", "accepted");

    await expect(sendFriendRequest("user1", "user2")).resolves.toStrictEqual({
      error: "You are already friends",
    });
  });

  it("returns no friend request found when responding with none pending", async () => {
    await expect(respondToFriendRequest("user2", "user1", "accepted")).resolves.toStrictEqual({
      error: "No friend request found between these users",
    });
  });

  it("returns already resolved when responding to already accepted request", async () => {
    await sendFriendRequest("user1", "user2");
    await respondToFriendRequest("user2", "user1", "accepted");

    await expect(respondToFriendRequest("user2", "user1", "declined")).resolves.toStrictEqual({
      error: "This request has already been resolved",
    });
  });

  it("returns not-found errors for unknown users", async () => {
    await expect(sendFriendRequest("nope", "user2")).resolves.toStrictEqual({
      error: "User nope not found",
    });

    await expect(sendFriendRequest("user2", "nonexistent")).resolves.toStrictEqual({
      error: "User nonexistent not found",
    });

    await expect(respondToFriendRequest("user2", "ghost", "accepted")).resolves.toStrictEqual({
      error: "User ghost not found",
    });
  });
});

describe("getFriends/getPendingRequests/removeFriend", () => {
  it("returns only accepted friends", async () => {
    await sendFriendRequest("user1", "user2");
    await respondToFriendRequest("user2", "user1", "accepted");

    await sendFriendRequest("user3", "user1"); // remains pending

    const friends = await getFriends("user1");
    expect(friends).toHaveLength(1);

    const user2 = await AuthRepo.find("user2");
    expect(user2).not.toBeNull();
    expect(friends).toStrictEqual([user2!.userId]);
  });

  it("returns pending incoming request senders", async () => {
    await sendFriendRequest("user3", "user1");

    const pending = await getPendingRequests("user1");
    const user3 = await AuthRepo.find("user3");
    expect(user3).not.toBeNull();
    expect(pending).toStrictEqual([user3!.userId]);
  });

  it("removes accepted friendships and rejects non-friends", async () => {
    await sendFriendRequest("user1", "user2");
    await respondToFriendRequest("user2", "user1", "accepted");

    await expect(removeFriend("user1", "user2")).resolves.toBeUndefined();
    await expect(removeFriend("user1", "user2")).resolves.toStrictEqual({
      error: "These users are not friends",
    });
  });

  it("returns not-found errors for invalid users", async () => {
    await expect(removeFriend("user1", "nope")).resolves.toStrictEqual({
      error: "User nope not found",
    });
    await expect(removeFriend("ghost", "user2")).resolves.toStrictEqual({
      error: "User ghost not found",
    });
  });

  it("getFriends returns not-found for invalid username", async () => {
    await expect(getFriends("ghost")).resolves.toStrictEqual({ error: "User ghost not found" });
  });

  it("getPendingRequests returns not-found for invalid username", async () => {
    await expect(getPendingRequests("ghost")).resolves.toStrictEqual({
      error: "User ghost not found",
    });
  });
});
