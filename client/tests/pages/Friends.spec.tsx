import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Friends from "../../src/pages/Friends.tsx";
import * as useFriendList from "../../src/hooks/useFriendList.ts";
import * as friendService from "../../src/services/friendService.ts";
import type { SafeUserInfo } from "@gamenite/shared";

// Mock the hooks
vi.mock("../../src/hooks/useFriendList.ts", () => ({
  useFriendList: vi.fn(),
  usePendingRequests: vi.fn(),
}));

vi.mock("../../src/services/friendService.ts", () => ({
  openFriendChat: vi.fn(),
}));

// Mock useAuth hook
vi.mock("../../src/hooks/useAuth.ts", () => ({
  default: vi.fn(),
}));

import useAuth from "../../src/hooks/useAuth.ts";
const mockUseAuth = vi.mocked(useAuth);

// Mock the components
vi.mock("../../src/components/AddFriend.tsx", () => ({
  default: ({ onSuccess }: { onSuccess: () => void }) => (
    <div data-testid="add-friend" onClick={onSuccess}>
      AddFriend
    </div>
  ),
}));

vi.mock("../../src/components/FriendsList.tsx", () => ({
  default: ({
    friends,
    onRemove,
    onSelect,
    selectedUsername,
  }: {
    friends: SafeUserInfo[] | { message: string };
    onRemove: () => void;
    onSelect: (friendUsername: string) => void;
    selectedUsername: string | null;
  }) => (
    <div>
      <div data-testid="friends-list" onClick={onRemove}>
        FriendsList: {JSON.stringify(friends)}
      </div>
      <div data-testid="selected-friend">{selectedUsername ?? "none"}</div>
      {Array.isArray(friends) &&
        friends.map((friend) => (
          <button key={friend.username} onClick={() => onSelect(friend.username)}>
            Open {friend.username}
          </button>
        ))}
    </div>
  ),
}));

vi.mock("../../src/components/PendingRequests.tsx", () => ({
  default: ({
    requests,
    onActionComplete,
  }: {
    requests: SafeUserInfo[] | { message: string };
    onActionComplete: () => void;
  }) => (
    <div data-testid="pending-requests" onClick={onActionComplete}>
      PendingRequests: {JSON.stringify(requests)}
    </div>
  ),
}));

vi.mock("../../src/components/FriendChatSection.tsx", () => ({
  default: ({ friendUsername, chatId }: { friendUsername: string; chatId: string }) => (
    <div data-testid="friend-chat-section">
      Chatting with {friendUsername} in {chatId}
    </div>
  ),
}));

const mockUseFriendList = vi.mocked(useFriendList.useFriendList);
const mockUsePendingRequests = vi.mocked(useFriendList.usePendingRequests);
const mockOpenFriendChat = vi.mocked(friendService.openFriendChat);

describe("Friends page", () => {
  const mockAuth = { username: "testuser", password: "testpass" };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue(mockAuth);
    mockOpenFriendChat.mockResolvedValue({ chatId: "friend:one:two" });
  });

  it("renders the page title", () => {
    mockUseFriendList.mockReturnValue({ message: "Loading..." });
    mockUsePendingRequests.mockReturnValue({ message: "Loading..." });

    render(<Friends />);

    expect(screen.getByRole("heading", { level: 2, name: "Friends" })).toBeInTheDocument();
  });

  it("renders all sections with loading states", () => {
    mockUseFriendList.mockReturnValue({ message: "Loading..." });
    mockUsePendingRequests.mockReturnValue({ message: "Loading..." });

    render(<Friends />);

    expect(screen.getByRole("heading", { level: 3, name: "Add Friend" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Pending Requests" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Friends List" })).toBeInTheDocument();
    expect(screen.getByText("Select a friend to start chatting.")).toBeInTheDocument();
  });

  it("passes friends data to FriendsList component", () => {
    const mockFriends = [
      {
        userId: "id1",
        username: "friend1",
        display: "Friend One",
        createdAt: new Date(),
        bio: "",
      },
    ];
    mockUseFriendList.mockReturnValue(mockFriends);
    mockUsePendingRequests.mockReturnValue({ message: "No pending requests..." });

    render(<Friends />);

    expect(screen.getByTestId("friends-list")).toHaveTextContent(JSON.stringify(mockFriends));
  });

  it("passes pending requests data to PendingRequests component", () => {
    const mockRequests = [
      {
        userId: "id2",
        username: "requester1",
        display: "Requester One",
        createdAt: new Date(),
        bio: "",
      },
    ];
    mockUseFriendList.mockReturnValue({ message: "No friends yet..." });
    mockUsePendingRequests.mockReturnValue(mockRequests);

    render(<Friends />);

    expect(screen.getByTestId("pending-requests")).toHaveTextContent(JSON.stringify(mockRequests));
  });

  it("shows friend count in section header", () => {
    const mockFriends = [
      {
        userId: "id3",
        username: "friend1",
        display: "Friend One",
        createdAt: new Date(),
        bio: "",
      },
      {
        userId: "id4",
        username: "friend2",
        display: "Friend Two",
        createdAt: new Date(),
        bio: "",
      },
    ];
    mockUseFriendList.mockReturnValue(mockFriends);
    mockUsePendingRequests.mockReturnValue({ message: "No pending requests..." });

    render(<Friends />);

    expect(screen.getByText("Friends List (2)")).toBeInTheDocument();
  });

  it("shows pending request count in section header", () => {
    const mockRequests = [
      {
        userId: "id5",
        username: "requester1",
        display: "Requester One",
        createdAt: new Date(),
        bio: "",
      },
      {
        userId: "id6",
        username: "requester2",
        display: "Requester Two",
        createdAt: new Date(),
        bio: "",
      },
      {
        userId: "id7",
        username: "requester3",
        display: "Requester Three",
        createdAt: new Date(),
        bio: "",
      },
    ];
    mockUseFriendList.mockReturnValue({ message: "No friends yet..." });
    mockUsePendingRequests.mockReturnValue(mockRequests);

    render(<Friends />);

    expect(screen.getByText("Pending Requests (3)")).toBeInTheDocument();
  });

  it("does not show count when there are no friends", () => {
    mockUseFriendList.mockReturnValue({ message: "No friends yet..." });
    mockUsePendingRequests.mockReturnValue({ message: "No pending requests..." });

    render(<Friends />);

    expect(screen.getByRole("heading", { level: 3, name: "Friends List" })).toBeInTheDocument();
    expect(screen.queryByText("Friends List (0)")).not.toBeInTheDocument();
  });

  it("does not show count when there are no pending requests", () => {
    mockUseFriendList.mockReturnValue({ message: "No friends yet..." });
    mockUsePendingRequests.mockReturnValue({ message: "No pending requests..." });

    render(<Friends />);

    expect(screen.getByText("Pending Requests")).toBeInTheDocument();
    expect(screen.queryByText("Pending Requests (0)")).not.toBeInTheDocument();
  });

  it("calls hooks with correct username", () => {
    mockUseFriendList.mockReturnValue({ message: "Loading..." });
    mockUsePendingRequests.mockReturnValue({ message: "Loading..." });

    render(<Friends />);

    expect(mockUseFriendList).toHaveBeenCalledWith("testuser", 0);
    expect(mockUsePendingRequests).toHaveBeenCalledWith("testuser", 0);
  });

  it("opens a private chat when a friend is selected", async () => {
    const mockFriends = [
      {
        userId: "id8",
        username: "friend1",
        display: "Friend One",
        createdAt: new Date(),
        bio: "",
      },
    ];
    mockUseFriendList.mockReturnValue(mockFriends);
    mockUsePendingRequests.mockReturnValue({ message: "No pending requests..." });
    mockOpenFriendChat.mockResolvedValue({ chatId: "friend:a:b" });

    render(<Friends />);

    fireEvent.click(screen.getByText("Open friend1"));

    await waitFor(() => {
      expect(mockOpenFriendChat).toHaveBeenCalledWith(mockAuth, "friend1");
    });
    expect(screen.getByTestId("friend-chat-section")).toHaveTextContent(
      "Chatting with friend1 in friend:a:b",
    );
    expect(screen.getByTestId("selected-friend")).toHaveTextContent("friend1");
  });

  it("shows friend chat errors", async () => {
    const mockFriends = [
      {
        userId: "id9",
        username: "friend1",
        display: "Friend One",
        createdAt: new Date(),
        bio: "",
      },
    ];
    mockUseFriendList.mockReturnValue(mockFriends);
    mockUsePendingRequests.mockReturnValue({ message: "No pending requests..." });
    mockOpenFriendChat.mockResolvedValue({ error: "Not allowed" });

    render(<Friends />);

    fireEvent.click(screen.getByText("Open friend1"));

    await waitFor(() => {
      expect(screen.getByText("Not allowed")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("friend-chat-section")).not.toBeInTheDocument();
  });
});
