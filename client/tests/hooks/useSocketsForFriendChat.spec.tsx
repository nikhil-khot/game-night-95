import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ChatInfo, ChatNewMessagePayload } from "@gamenite/shared";
import { LoginContext } from "../../src/contexts/LoginContext.ts";
import type { GameSocket } from "../../src/util/types.ts";
import useSocketsForFriendChat from "../../src/hooks/useSocketsForFriendChat.ts";

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

describe("useSocketsForFriendChat", () => {
  it("emits join on mount and leave on unmount", () => {
    const { socket } = createMockSocket();

    const { unmount } = renderHook(() => useSocketsForFriendChat("friend:one:two"), {
      wrapper: createWrapper(socket),
    });

    expect((socket.emit as ReturnType<typeof vi.fn>).mock.calls[0]).toEqual([
      "friendChatJoin",
      { auth: { username: "user1", password: "pwd1111" }, payload: "friend:one:two" },
    ]);

    unmount();

    expect(socket.emit).toHaveBeenCalledWith("friendChatLeave", {
      auth: { username: "user1", password: "pwd1111" },
      payload: "friend:one:two",
    });
  });

  it("builds initial messages and appends new messages for the same friend chat", () => {
    const { socket, handlers } = createMockSocket();

    const { result } = renderHook(() => useSocketsForFriendChat("friend:one:two"), {
      wrapper: createWrapper(socket),
    });

    act(() => {
      handlers.friendChatJoined?.({
        chatId: "friend:one:two",
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
      } as ChatInfo);
    });

    expect(result.current.messages).not.toBeNull();
    expect(result.current.messages?.length).toBe(2);

    act(() => {
      handlers.friendChatNewMessage?.({
        chatId: "friend:one:two",
        message: {
          messageId: "m2",
          text: "hi again",
          createdBy: { username: "user1", display: "User One", createdAt: new Date() },
          createdAt: new Date(),
        },
      } as ChatNewMessagePayload);
    });

    expect(result.current.messages?.at(-1)).toMatchObject({ text: "hi again" });
  });

  it("ignores other friend chat rooms and emits send payload", () => {
    const { socket, handlers } = createMockSocket();

    const { result } = renderHook(() => useSocketsForFriendChat("friend:one:two"), {
      wrapper: createWrapper(socket),
    });

    act(() => {
      handlers.friendChatJoined?.({
        chatId: "friend:one:two",
        createdAt: new Date(),
        moveLog: [],
        messages: [],
      } as ChatInfo);
    });

    const beforeCount = result.current.messages?.length ?? 0;

    act(() => {
      handlers.friendChatNewMessage?.({
        chatId: "friend:other:chat",
        message: {
          messageId: "m3",
          text: "ignored",
          createdBy: { username: "user2", display: "User Two", createdAt: new Date() },
          createdAt: new Date(),
        },
      } as ChatNewMessagePayload);
    });

    expect(result.current.messages?.length).toBe(beforeCount);

    act(() => {
      result.current.handleMessageCreation("private hello");
    });

    expect(socket.emit).toHaveBeenCalledWith("friendChatSendMessage", {
      auth: { username: "user1", password: "pwd1111" },
      payload: { chatId: "friend:one:two", text: "private hello" },
    });
  });
});
