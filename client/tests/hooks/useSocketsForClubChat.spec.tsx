import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ChatInfo, ChatNewMessagePayload } from "@gamenite/shared";
import { LoginContext } from "../../src/contexts/LoginContext.ts";
import type { GameSocket } from "../../src/util/types.ts";
import useSocketsForClubChat from "../../src/hooks/useSocketsForClubChat.ts";

interface SocketHandlers {
  [event: string]: ((payload: unknown) => void) | undefined;
}

function createMockSocket() {
  const handlers: SocketHandlers = {};

  const socket = {
    on: vi.fn((event: string, handler: (payload: unknown) => void) => {
      handlers[event] = handler;
      return socket;
    }),
    off: vi.fn((event: string, handler?: (payload: unknown) => void) => {
      if (!handler || handlers[event] === handler) {
        handlers[event] = undefined;
      }
      return socket;
    }),
    emit: vi.fn(),
  };

  return { socket: socket as unknown as GameSocket, handlers };
}

function createWrapper(mockSocket: GameSocket) {
  return function hookWrapper({ children }: { children: React.ReactNode }) {
    return (
      <LoginContext
        value={{
          user: { username: "user1", display: "User One", createdAt: new Date() },
          pass: "pwd1111",
          socket: mockSocket,
          reset: vi.fn(),
        }}
      >
        {children}
      </LoginContext>
    );
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useSocketsForClubChat", () => {
  it("emits join on mount and leave on unmount", () => {
    const { socket } = createMockSocket();

    const { unmount } = renderHook(() => useSocketsForClubChat("Alpha"), {
      wrapper: createWrapper(socket),
    });

    expect((socket.emit as ReturnType<typeof vi.fn>).mock.calls[0]).toEqual([
      "clubChatJoin",
      { auth: { username: "user1", password: "pwd1111" }, payload: "Alpha" },
    ]);

    unmount();

    expect(socket.emit).toHaveBeenCalledWith("clubChatLeave", {
      auth: { username: "user1", password: "pwd1111" },
      payload: "Alpha",
    });
  });

  it("builds initial messages on clubChatJoined and handles new message for same room", () => {
    const { socket, handlers } = createMockSocket();

    const { result } = renderHook(() => useSocketsForClubChat("Alpha"), {
      wrapper: createWrapper(socket),
    });

    const joinedPayload: ChatInfo = {
      chatId: "club:Alpha",
      createdAt: new Date(),
      moveLog: [],
      messages: [
        {
          messageId: "m1",
          text: "hello",
          createdBy: { username: "user1", display: "User One", createdAt: new Date() },
          createdAt: new Date(),
        },
      ],
    };

    act(() => {
      handlers.clubChatJoined?.(joinedPayload);
    });

    expect(result.current.messages).not.toBeNull();
    expect(result.current.messages?.length).toBe(2);

    const newMessagePayload: ChatNewMessagePayload = {
      chatId: "club:Alpha",
      message: {
        messageId: "m2",
        text: "hi again",
        createdBy: { username: "user1", display: "User One", createdAt: new Date() },
        createdAt: new Date(),
      },
    };

    act(() => {
      handlers.clubChatNewMessage?.(newMessagePayload);
    });

    expect(result.current.messages?.at(-1)).toMatchObject({ text: "hi again" });
  });

  it("ignores new-message events from other club rooms and emits send payload", () => {
    const { socket, handlers } = createMockSocket();

    const { result } = renderHook(() => useSocketsForClubChat("Alpha"), {
      wrapper: createWrapper(socket),
    });

    act(() => {
      handlers.clubChatJoined?.({
        chatId: "club:Alpha",
        createdAt: new Date(),
        moveLog: [],
        messages: [],
      } as ChatInfo);
    });

    const beforeCount = result.current.messages?.length ?? 0;

    act(() => {
      handlers.clubChatNewMessage?.({
        chatId: "club:Beta",
        message: {
          messageId: "m3",
          text: "should be ignored",
          createdBy: { username: "user2", display: "User Two", createdAt: new Date() },
          createdAt: new Date(),
        },
      } as ChatNewMessagePayload);
    });

    expect(result.current.messages?.length).toBe(beforeCount);

    act(() => {
      result.current.handleMessageCreation("club message");
    });

    expect(socket.emit).toHaveBeenCalledWith("clubChatSendMessage", {
      auth: { username: "user1", password: "pwd1111" },
      payload: { clubName: "Alpha", text: "club message" },
    });
  });
});
