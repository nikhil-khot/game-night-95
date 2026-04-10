import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FriendsList from "../../src/components/FriendsList.tsx";
import * as friendService from "../../src/services/friendService.ts";
import type { SafeUserInfo } from "@gamenite/shared";

// Mock the friend service
vi.mock("../../src/services/friendService.ts", () => ({
  removeFriend: vi.fn(),
}));

// Mock useAuth hook
vi.mock("../../src/hooks/useAuth.ts", () => ({
  default: vi.fn(),
}));

import useAuth from "../../src/hooks/useAuth.ts";
const mockUseAuth = vi.mocked(useAuth);

// Mock UserLink component
vi.mock("../../src/components/UserLink.tsx", () => ({
  default: ({ user }: { user: SafeUserInfo }) => <span>{user.display}</span>,
}));

const mockRemoveFriend = vi.mocked(friendService.removeFriend);

describe("FriendsList component", () => {
  const mockAuth = { username: "testuser", password: "testpass" };
  const mockOnRemove = vi.fn();
  const mockOnSelect = vi.fn();

  const mockFriends = [
    {
      userId: "id1",
      username: "friend1",
      display: "Friend One",
      createdAt: new Date(),
      bio: "",
    },
    {
      userId: "id2",
      username: "friend2",
      display: "Friend Two",
      createdAt: new Date(),
      bio: "",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue(mockAuth);
  });

  it("renders loading message", () => {
    render(
      <FriendsList
        friends={{ message: "Loading..." }}
        onRemove={mockOnRemove}
        onSelect={mockOnSelect}
        selectedUsername={null}
      />,
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders no friends message", () => {
    render(
      <FriendsList
        friends={{ message: "No friends yet..." }}
        onRemove={mockOnRemove}
        onSelect={mockOnSelect}
        selectedUsername={null}
      />,
    );

    expect(screen.getByText("No friends yet...")).toBeInTheDocument();
  });

  it("renders error message", () => {
    render(
      <FriendsList
        friends={{ message: "Error: Failed to load" }}
        onRemove={mockOnRemove}
        onSelect={mockOnSelect}
        selectedUsername={null}
      />,
    );

    expect(screen.getByText("Error: Failed to load")).toBeInTheDocument();
  });

  it("renders friends list correctly", () => {
    render(
      <FriendsList
        friends={mockFriends}
        onRemove={mockOnRemove}
        onSelect={mockOnSelect}
        selectedUsername={null}
      />,
    );

    expect(screen.getByText("Friend One")).toBeInTheDocument();
    expect(screen.getByText("Friend Two")).toBeInTheDocument();
    expect(screen.getAllByText("Remove")).toHaveLength(2);
  });

  it("selects a friend when the row is clicked", () => {
    render(
      <FriendsList
        friends={mockFriends}
        onRemove={mockOnRemove}
        onSelect={mockOnSelect}
        selectedUsername={null}
      />,
    );

    fireEvent.click(screen.getByText("Friend One"));

    expect(mockOnSelect).toHaveBeenCalledWith("friend1");
  });

  it("supports keyboard selection and active state", () => {
    render(
      <FriendsList
        friends={mockFriends}
        onRemove={mockOnRemove}
        onSelect={mockOnSelect}
        selectedUsername="friend1"
      />,
    );

    const activeFriend = screen.getByText("Friend One").closest(".friendItem");
    const secondFriend = screen.getByText("Friend Two").closest(".friendItem");

    expect(activeFriend).toHaveClass("friendItemActive");

    fireEvent.keyDown(secondFriend!, { key: "Enter" });
    expect(mockOnSelect).toHaveBeenCalledWith("friend2");
  });

  it("removes friend successfully", async () => {
    mockRemoveFriend.mockResolvedValue({ success: true });

    render(
      <FriendsList
        friends={mockFriends}
        onRemove={mockOnRemove}
        onSelect={mockOnSelect}
        selectedUsername={null}
      />,
    );

    const removeButtons = screen.getAllByText("Remove");
    fireEvent.click(removeButtons[0]);

    expect(mockRemoveFriend).toHaveBeenCalledWith(mockAuth, "friend1");

    await waitFor(() => {
      expect(mockOnRemove).toHaveBeenCalled();
    });
  });

  it("shows error when removal fails", async () => {
    mockRemoveFriend.mockResolvedValue({ error: "Failed to remove friend" });

    render(
      <FriendsList
        friends={mockFriends}
        onRemove={mockOnRemove}
        onSelect={mockOnSelect}
        selectedUsername={null}
      />,
    );

    const removeButtons = screen.getAllByText("Remove");
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Failed to remove friend")).toBeInTheDocument();
    });

    expect(mockOnRemove).not.toHaveBeenCalled();
  });

  it("shows loading state during removal", async () => {
    mockRemoveFriend.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100)),
    );

    render(
      <FriendsList
        friends={mockFriends}
        onRemove={mockOnRemove}
        onSelect={mockOnSelect}
        selectedUsername={null}
      />,
    );

    const removeButtons = screen.getAllByText("Remove");
    fireEvent.click(removeButtons[0]);

    expect(screen.getByText("Removing...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Removing...")).not.toBeInTheDocument();
    });
  });

  it("disables button during removal", () => {
    mockRemoveFriend.mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    render(
      <FriendsList
        friends={mockFriends}
        onRemove={mockOnRemove}
        onSelect={mockOnSelect}
        selectedUsername={null}
      />,
    );

    const removeButtons = screen.getAllByText("Remove");
    fireEvent.click(removeButtons[0]);

    expect(removeButtons[0]).toBeDisabled();
    expect(removeButtons[0]).toHaveTextContent("Removing...");
  });

  it("does not select a friend when remove is clicked", async () => {
    mockRemoveFriend.mockResolvedValue({ success: true });

    render(
      <FriendsList
        friends={mockFriends}
        onRemove={mockOnRemove}
        onSelect={mockOnSelect}
        selectedUsername={null}
      />,
    );

    fireEvent.click(screen.getAllByText("Remove")[0]);

    await waitFor(() => {
      expect(mockOnRemove).toHaveBeenCalled();
    });
    expect(mockOnSelect).not.toHaveBeenCalled();
  });
});
