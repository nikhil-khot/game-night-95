import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "../../src/services/api.ts";
import {
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
  getFriendsList,
  getPendingRequests,
} from "../../src/services/friendService.ts";

// Mock axios
vi.mock("axios");

// Mock the api instance
vi.mock("../../src/services/api.ts", () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
  exceptionToErrorMsg: vi.fn((error) => ({ error: error.message || "Unknown error" })),
}));

const mockApi = vi.mocked(api, true);

describe("friendService", () => {
  const mockAuth = { username: "testuser", password: "testpass" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendFriendRequest", () => {
    it("sends friend request successfully", async () => {
      const mockResponse = {
        fromUserId: "user1",
        toUserId: "user2",
        status: "pending",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockApi.post.mockResolvedValue({ data: mockResponse });

      const result = await sendFriendRequest(mockAuth, "frienduser");

      expect(result).toEqual(mockResponse);
      expect(mockApi.post).toHaveBeenCalledWith("/api/friend/send", {
        auth: mockAuth,
        payload: { toUsername: "frienduser" },
      });
    });

    it("handles API error", async () => {
      const errorResponse = { error: "User not found" };
      mockApi.post.mockResolvedValue({ data: errorResponse });

      const result = await sendFriendRequest(mockAuth, "nonexistent");

      expect(result).toEqual(errorResponse);
    });

    it("handles network error", async () => {
      const networkError = new Error("Network error");
      mockApi.post.mockRejectedValue(networkError);

      const result = await sendFriendRequest(mockAuth, "frienduser");

      expect(result).toEqual({ error: "Network error" });
    });
  });

  describe("respondToFriendRequest", () => {
    it("accepts friend request successfully", async () => {
      const mockResponse = {
        fromUserId: "user2",
        toUserId: "user1",
        status: "accepted",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockApi.post.mockResolvedValue({ data: mockResponse });

      const result = await respondToFriendRequest(mockAuth, "requester", "accepted");

      expect(result).toEqual(mockResponse);
      expect(mockApi.post).toHaveBeenCalledWith("/api/friend/respond", {
        auth: mockAuth,
        payload: { fromUsername: "requester", response: "accepted" },
      });
    });

    it("declines friend request successfully", async () => {
      const mockResponse = {
        fromUserId: "user2",
        toUserId: "user1",
        status: "declined",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockApi.post.mockResolvedValue({ data: mockResponse });

      const result = await respondToFriendRequest(mockAuth, "requester", "declined");

      expect(result).toEqual(mockResponse);
      expect(mockApi.post).toHaveBeenCalledWith("/api/friend/respond", {
        auth: mockAuth,
        payload: { fromUsername: "requester", response: "declined" },
      });
    });
  });

  describe("removeFriend", () => {
    it("removes friend successfully", async () => {
      const mockResponse = { success: true };
      mockApi.post.mockResolvedValue({ data: mockResponse });

      const result = await removeFriend(mockAuth, "frienduser");

      expect(result).toEqual(mockResponse);
      expect(mockApi.post).toHaveBeenCalledWith("/api/friend/remove", {
        auth: mockAuth,
        payload: { targetUsername: "frienduser" },
      });
    });

    it("handles removal error", async () => {
      const errorResponse = { error: "Users are not friends" };
      mockApi.post.mockResolvedValue({ data: errorResponse });

      const result = await removeFriend(mockAuth, "notfriend");

      expect(result).toEqual(errorResponse);
    });
  });

  describe("getFriendsList", () => {
    it("fetches friends list successfully", async () => {
      const mockFriends = [
        { username: "friend1", display: "Friend One", createdAt: new Date() },
        { username: "friend2", display: "Friend Two", createdAt: new Date() },
      ];

      mockApi.get.mockResolvedValue({ data: mockFriends });

      const result = await getFriendsList("testuser");

      expect(result).toEqual(mockFriends);
      expect(mockApi.get).toHaveBeenCalledWith("/api/friend/list?username=testuser");
    });

    it("handles empty friends list", async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      const result = await getFriendsList("testuser");

      expect(result).toEqual([]);
    });

    it("handles API error", async () => {
      const errorResponse = { error: "User not found" };
      mockApi.get.mockResolvedValue({ data: errorResponse });

      const result = await getFriendsList("nonexistent");

      expect(result).toEqual(errorResponse);
    });
  });

  describe("getPendingRequests", () => {
    it("fetches pending requests successfully", async () => {
      const mockRequests = [
        { username: "requester1", display: "Requester One", createdAt: new Date() },
        { username: "requester2", display: "Requester Two", createdAt: new Date() },
      ];

      mockApi.get.mockResolvedValue({ data: mockRequests });

      const result = await getPendingRequests("testuser");

      expect(result).toEqual(mockRequests);
      expect(mockApi.get).toHaveBeenCalledWith("/api/friend/pending?username=testuser");
    });

    it("handles empty pending requests", async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      const result = await getPendingRequests("testuser");

      expect(result).toEqual([]);
    });

    it("handles API error", async () => {
      const errorResponse = { error: "User not found" };
      mockApi.get.mockResolvedValue({ data: errorResponse });

      const result = await getPendingRequests("nonexistent");

      expect(result).toEqual(errorResponse);
    });
  });
});
