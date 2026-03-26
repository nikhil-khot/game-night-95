import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Friends from "../../src/pages/Friends.tsx";
import * as useFriendList from "../../src/hooks/useFriendList.ts";
import type { SafeUserInfo } from "@gamenite/shared";

// Mock the hooks
vi.mock("../../src/hooks/useFriendList.ts", () => ({
  useFriendList: vi.fn(),
  usePendingRequests: vi.fn(),
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
  }: {
    friends: SafeUserInfo[] | { message: string };
    onRemove: () => void;
  }) => (
    <div data-testid="friends-list" onClick={onRemove}>
      FriendsList: {JSON.stringify(friends)}
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

const mockUseFriendList = vi.mocked(useFriendList.useFriendList);
const mockUsePendingRequests = vi.mocked(useFriendList.usePendingRequests);

describe("Friends page", () => {
  const mockAuth = { username: "testuser", password: "testpass" };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue(mockAuth);
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
    expect(screen.getByRole("heading", { level: 3, name: "Friends" })).toBeInTheDocument();
  });

  it("passes friends data to FriendsList component", () => {
    const mockFriends = [{ username: "friend1", display: "Friend One", createdAt: new Date() }];
    mockUseFriendList.mockReturnValue(mockFriends);
    mockUsePendingRequests.mockReturnValue({ message: "No pending requests..." });

    render(<Friends />);

    expect(screen.getByTestId("friends-list")).toHaveTextContent(JSON.stringify(mockFriends));
  });

  it("passes pending requests data to PendingRequests component", () => {
    const mockRequests = [
      { username: "requester1", display: "Requester One", createdAt: new Date() },
    ];
    mockUseFriendList.mockReturnValue({ message: "No friends yet..." });
    mockUsePendingRequests.mockReturnValue(mockRequests);

    render(<Friends />);

    expect(screen.getByTestId("pending-requests")).toHaveTextContent(JSON.stringify(mockRequests));
  });

  it("shows friend count in section header", () => {
    const mockFriends = [
      { username: "friend1", display: "Friend One", createdAt: new Date() },
      { username: "friend2", display: "Friend Two", createdAt: new Date() },
    ];
    mockUseFriendList.mockReturnValue(mockFriends);
    mockUsePendingRequests.mockReturnValue({ message: "No pending requests..." });

    render(<Friends />);

    expect(screen.getByText("Friends (2)")).toBeInTheDocument();
  });

  it("shows pending request count in section header", () => {
    const mockRequests = [
      { username: "requester1", display: "Requester One", createdAt: new Date() },
      { username: "requester2", display: "Requester Two", createdAt: new Date() },
      { username: "requester3", display: "Requester Three", createdAt: new Date() },
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

    expect(screen.getByRole("heading", { level: 3, name: "Friends" })).toBeInTheDocument();
    expect(screen.queryByText("Friends (0)")).not.toBeInTheDocument();
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
});
