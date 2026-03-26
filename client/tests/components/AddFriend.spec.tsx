import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AddFriend from "../../src/components/AddFriend.tsx";
import * as friendService from "../../src/services/friendService.ts";

// Mock the friend service
vi.mock("../../src/services/friendService.ts", () => ({
  sendFriendRequest: vi.fn(),
}));

// Mock useAuth hook
vi.mock("../../src/hooks/useAuth.ts", () => ({
  default: vi.fn(),
}));

import useAuth from "../../src/hooks/useAuth.ts";
const mockUseAuth = vi.mocked(useAuth);

const mockSendFriendRequest = vi.mocked(friendService.sendFriendRequest);

describe("AddFriend component", () => {
  const mockAuth = { username: "testuser", password: "testpass" };
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue(mockAuth);
  });

  it("renders the form correctly", () => {
    render(<AddFriend onSuccess={mockOnSuccess} />);

    expect(screen.getByPlaceholderText("Enter username...")).toBeInTheDocument();
    expect(screen.getByText("Send Request")).toBeInTheDocument();
  });

  it("disables submit button when username is empty", () => {
    render(<AddFriend onSuccess={mockOnSuccess} />);

    const submitButton = screen.getByText("Send Request");
    expect(submitButton).toBeDisabled();
  });

  it("enables submit button when username is entered", () => {
    render(<AddFriend onSuccess={mockOnSuccess} />);

    const input = screen.getByPlaceholderText("Enter username...");
    const submitButton = screen.getByText("Send Request");

    fireEvent.change(input, { target: { value: "frienduser" } });
    expect(submitButton).not.toBeDisabled();
  });

  it("sends friend request successfully", async () => {
    mockSendFriendRequest.mockResolvedValue({
      fromUserId: "user1",
      toUserId: "user2",
      status: "pending",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    });

    render(<AddFriend onSuccess={mockOnSuccess} />);

    const input = screen.getByPlaceholderText("Enter username...");
    const submitButton = screen.getByText("Send Request");

    fireEvent.change(input, { target: { value: "frienduser" } });
    fireEvent.click(submitButton);

    expect(mockSendFriendRequest).toHaveBeenCalledWith(mockAuth, "frienduser");

    await waitFor(() => {
      expect(screen.getByText("Friend request sent to frienduser")).toBeInTheDocument();
    });

    // Wait for the onSuccess callback (called after 500ms timeout)
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it("shows error message when request fails", async () => {
    mockSendFriendRequest.mockResolvedValue({ error: "User not found" });

    render(<AddFriend onSuccess={mockOnSuccess} />);

    const input = screen.getByPlaceholderText("Enter username...");
    const submitButton = screen.getByText("Send Request");

    fireEvent.change(input, { target: { value: "nonexistent" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("User not found")).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it("clears input after successful request", async () => {
    mockSendFriendRequest.mockResolvedValue({
      fromUserId: "user1",
      toUserId: "user2",
      status: "pending",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    });

    render(<AddFriend onSuccess={mockOnSuccess} />);

    const input = screen.getByPlaceholderText("Enter username...");

    fireEvent.change(input, { target: { value: "frienduser" } });
    fireEvent.click(screen.getByText("Send Request"));

    await waitFor(() => {
      expect(input).toHaveValue("");
    });
  });

  it("shows loading state during request", async () => {
    mockSendFriendRequest.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                fromUserId: "user1",
                toUserId: "user2",
                status: "pending",
                createdAt: "2024-01-01T00:00:00Z",
                updatedAt: "2024-01-01T00:00:00Z",
              }),
            100,
          ),
        ),
    );

    render(<AddFriend onSuccess={mockOnSuccess} />);

    const input = screen.getByPlaceholderText("Enter username...");
    const submitButton = screen.getByText("Send Request");

    fireEvent.change(input, { target: { value: "frienduser" } });
    fireEvent.click(submitButton);

    expect(screen.getByText("Sending...")).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.queryByText("Sending...")).not.toBeInTheDocument();
    });
  });
});
