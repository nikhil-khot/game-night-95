import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GameServer, GameServerSocket } from "../src/types.ts";
import { logSocketError } from "../src/controllers/socket.controller.ts";
import {
  socketJoin,
  socketLeave,
  socketSendMessage,
} from "../src/controllers/clubChat.controller.ts";
import { createClub, getClubChatId } from "../src/services/club.service.ts";
import { ClubRepo } from "../src/repository.ts";

vi.mock(import("../src/controllers/socket.controller.ts"), () => {
  return { logSocketError: vi.fn() };
});

const MockGameServer = vi.fn(
  class {
    to = vi.fn(() => this);
    emit = vi.fn();
  },
);

const MockGameServerSocket = vi.fn(
  class {
    id = "mockGameServerSocket";
    rooms = new Set<string>();
    join = vi.fn((room: string): Promise<void> => {
      this.rooms.add(room);
      return Promise.resolve();
    });
    leave = vi.fn((room: string): Promise<void> => {
      this.rooms.delete(room);
      return Promise.resolve();
    });
    emit = vi.fn();
    to = vi.fn(() => this);
  },
);

const mockServer = new MockGameServer() as unknown as GameServer;
const mockSocket = new MockGameServerSocket() as unknown as GameServerSocket;
const auth1 = { username: "user1", password: "pwd1111" };
const auth2 = { username: "user2", password: "pwd2222" };
const badAuth = { username: "user1", password: "wrong" };

beforeEach(async () => {
  await ClubRepo.clear();
});

afterEach(() => {
  vi.resetAllMocks();
  (mockSocket as unknown as { rooms: Set<string> }).rooms.clear();
});

describe("club chat socket handlers", () => {
  it("joins club chat for members and broadcasts join", async () => {
    const created = await createClub("user1", "Alpha", "First club");
    expect("error" in created).toBe(false);

    await socketJoin(mockSocket, mockServer)({ auth: auth1, payload: "Alpha" });

    const chatId = getClubChatId("Alpha");
    expect(logSocketError).not.toHaveBeenCalled();
    expect(mockSocket.join).toHaveBeenCalledWith(chatId);
    expect(mockSocket.emit).toHaveBeenCalledWith("clubChatJoined", expect.any(Object));
    expect(mockSocket.to).toHaveBeenCalledWith(chatId);
    expect(mockSocket.emit).toHaveBeenCalledWith("clubChatUserJoined", {
      chatId,
      user: expect.objectContaining({ username: "user1" }),
    });
  });

  it("rejects join attempts by non-members", async () => {
    const created = await createClub("user1", "Alpha", "First club");
    expect("error" in created).toBe(false);

    await socketJoin(mockSocket, mockServer)({ auth: auth2, payload: "Alpha" });

    expect(logSocketError).toHaveBeenCalledTimes(1);
    const err = vi.mocked(logSocketError).mock.calls[0][1] as Error;
    expect(err.message).toContain("attempted to join chat for non-member club Alpha");
  });

  it("leaves club chat when in room and broadcasts leave", async () => {
    const created = await createClub("user1", "Alpha", "First club");
    expect("error" in created).toBe(false);
    const chatId = getClubChatId("Alpha");

    await socketJoin(mockSocket, mockServer)({ auth: auth1, payload: "Alpha" });
    expect((mockSocket as unknown as { rooms: Set<string> }).rooms.has(chatId)).toBe(true);

    await socketLeave(mockSocket, mockServer)({ auth: auth1, payload: "Alpha" });

    expect(logSocketError).not.toHaveBeenCalled();
    expect(mockSocket.leave).toHaveBeenCalledWith(chatId);
    expect(mockSocket.emit).toHaveBeenCalledWith("clubChatUserLeft", {
      chatId,
      user: expect.objectContaining({ username: "user1" }),
    });
  });

  it("sends club chat message for members", async () => {
    const created = await createClub("user1", "Alpha", "First club");
    expect("error" in created).toBe(false);

    await socketSendMessage(
      mockSocket,
      mockServer,
    )({
      auth: auth1,
      payload: { clubName: "Alpha", text: "hello club" },
    });

    const chatId = getClubChatId("Alpha");
    expect(logSocketError).not.toHaveBeenCalled();
    expect(mockServer.to).toHaveBeenCalledWith(chatId);
    expect(mockServer.emit).toHaveBeenCalledWith("clubChatNewMessage", {
      chatId,
      message: expect.objectContaining({ text: "hello club" }),
    });
  });

  it("rejects invalid auth and non-member club messages", async () => {
    const created = await createClub("user1", "Alpha", "First club");
    expect("error" in created).toBe(false);

    await socketSendMessage(
      mockSocket,
      mockServer,
    )({
      auth: badAuth,
      payload: { clubName: "Alpha", text: "hello" },
    });
    expect(logSocketError).toHaveBeenCalledTimes(1);

    await socketSendMessage(
      mockSocket,
      mockServer,
    )({
      auth: auth2,
      payload: { clubName: "Alpha", text: "hello" },
    });
    expect(logSocketError).toHaveBeenCalledTimes(2);
    const err = vi.mocked(logSocketError).mock.calls[1][1] as Error;
    expect(err.message).toContain("attempted to message non-member club Alpha");
  });
});
