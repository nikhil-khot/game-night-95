import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PendingRequests from "../../src/components/PendingRequests.tsx";
import * as friendService from "../../src/services/friendService.ts";
import type { SafeUserInfo } from "@gamenite/shared";

// Mock the friend service
vi.mock("../../src/services/friendService.ts", () => ({
  respondToFriendRequest: vi.fn(),
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

const mockRespondToFriendRequest = vi.mocked(friendService.respondToFriendRequest);

describe("PendingRequests component", () => {
  const mockAuth = { username: "testuser", password: "testpass" };
  const mockOnActionComplete = vi.fn();

  const mockRequests = [
    { username: "requester1", display: "Requester One", createdAt: new Date() },
    { username: "requester2", display: "Requester Two", createdAt: new Date() },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue(mockAuth);
  });

  it("renders loading message", () => {
    render(
      <PendingRequests
        requests={{ message: "Loading..." }}
        onActionComplete={mockOnActionComplete}
      />,
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders no pending requests message", () => {
    render(
      <PendingRequests
        requests={{ message: "No pending requests..." }}
        onActionComplete={mockOnActionComplete}
      />,
    );

    expect(screen.getByText("No pending requests...")).toBeInTheDocument();
  });

  it("renders error message", () => {
    render(
      <PendingRequests
        requests={{ message: "Error: Failed to load" }}
        onActionComplete={mockOnActionComplete}
      />,
    );

    expect(screen.getByText("Error: Failed to load")).toBeInTheDocument();
  });

  it("renders pending requests list correctly", () => {
    render(<PendingRequests requests={mockRequests} onActionComplete={mockOnActionComplete} />);

    expect(screen.getByText("Requester One")).toBeInTheDocument();
    expect(screen.getByText("Requester Two")).toBeInTheDocument();
    expect(screen.getAllByText("Accept")).toHaveLength(2);
    expect(screen.getAllByText("Decline")).toHaveLength(2);
  });

  it("accepts friend request successfully", async () => {
    mockRespondToFriendRequest.mockResolvedValue({
      fromUserId: "requester1",
      toUserId: "testuser",
      status: "accepted",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    });

    render(<PendingRequests requests={mockRequests} onActionComplete={mockOnActionComplete} />);

    const acceptButtons = screen.getAllByText("Accept");
    fireEvent.click(acceptButtons[0]);

    expect(mockRespondToFriendRequest).toHaveBeenCalledWith(mockAuth, "requester1", "accepted");

    await waitFor(() => {
      expect(mockOnActionComplete).toHaveBeenCalled();
    });
  });

  it("declines friend request successfully", async () => {
    mockRespondToFriendRequest.mockResolvedValue({
      fromUserId: "requester1",
      toUserId: "testuser",
      status: "declined",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    });

    render(<PendingRequests requests={mockRequests} onActionComplete={mockOnActionComplete} />);

    const declineButtons = screen.getAllByText("Decline");
    fireEvent.click(declineButtons[0]);

    expect(mockRespondToFriendRequest).toHaveBeenCalledWith(mockAuth, "requester1", "declined");

    await waitFor(() => {
      expect(mockOnActionComplete).toHaveBeenCalled();
    });
  });

  it("shows error when response fails", async () => {
    mockRespondToFriendRequest.mockResolvedValue({ error: "Request already processed" });

    render(<PendingRequests requests={mockRequests} onActionComplete={mockOnActionComplete} />);

    const acceptButtons = screen.getAllByText("Accept");
    fireEvent.click(acceptButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Request already processed")).toBeInTheDocument();
    });

    expect(mockOnActionComplete).not.toHaveBeenCalled();
  });

  it("shows loading state during response", async () => {
    mockRespondToFriendRequest.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                fromUserId: "requester1",
                toUserId: "testuser",
                status: "accepted",
                createdAt: "2024-01-01T00:00:00Z",
                updatedAt: "2024-01-01T00:00:00Z",
              }),
            100,
          ),
        ),
    );

    render(<PendingRequests requests={mockRequests} onActionComplete={mockOnActionComplete} />);

    const acceptButtons = screen.getAllByText("Accept");
    fireEvent.click(acceptButtons[0]);

    expect(screen.getAllByText("...")).toHaveLength(2); // Both buttons show loading

    await waitFor(() => {
      expect(screen.queryByText("...")).not.toBeInTheDocument();
    });
  });

  it("disables buttons during response", () => {
    mockRespondToFriendRequest.mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    render(<PendingRequests requests={mockRequests} onActionComplete={mockOnActionComplete} />);

    const acceptButtons = screen.getAllByText("Accept");
    const declineButtons = screen.getAllByText("Decline");

    fireEvent.click(acceptButtons[0]);

    expect(acceptButtons[0]).toBeDisabled();
    expect(declineButtons[0]).toBeDisabled();
    expect(acceptButtons[0]).toHaveTextContent("...");
    expect(declineButtons[0]).toHaveTextContent("...");
  });
});
