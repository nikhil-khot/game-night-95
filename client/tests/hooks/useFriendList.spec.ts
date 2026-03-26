import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useFriendList, usePendingRequests } from "../../src/hooks/useFriendList.ts";
import * as friendService from "../../src/services/friendService.ts";

// Mock the friend service
vi.mock("../../src/services/friendService.ts", () => ({
  getFriendsList: vi.fn(),
  getPendingRequests: vi.fn(),
}));

const mockGetFriendsList = vi.mocked(friendService.getFriendsList);
const mockGetPendingRequests = vi.mocked(friendService.getPendingRequests);

describe("useFriendList hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("useFriendList", () => {
    it("returns loading message initially", () => {
      mockGetFriendsList.mockResolvedValue([]);

      const { result } = renderHook(() => useFriendList("testuser"));

      expect(result.current).toEqual({ message: "Loading..." });
    });

    it("returns friends list when data is loaded", async () => {
      const mockFriends = [
        { username: "friend1", display: "Friend One", createdAt: new Date() },
        { username: "friend2", display: "Friend Two", createdAt: new Date() },
      ];
      mockGetFriendsList.mockResolvedValue(mockFriends);

      const { result } = renderHook(() => useFriendList("testuser"));

      await waitFor(() => {
        expect(result.current).toEqual(mockFriends);
      });

      expect(mockGetFriendsList).toHaveBeenCalledWith("testuser");
    });

    it("returns error message when API fails", async () => {
      mockGetFriendsList.mockResolvedValue({ error: "Failed to load friends" });

      const { result } = renderHook(() => useFriendList("testuser"));

      await waitFor(() => {
        expect(result.current).toEqual({ message: "Error: Failed to load friends" });
      });
    });

    it("returns no friends message when list is empty", async () => {
      mockGetFriendsList.mockResolvedValue([]);

      const { result } = renderHook(() => useFriendList("testuser"));

      await waitFor(() => {
        expect(result.current).toEqual({ message: "No friends yet..." });
      });
    });

    it("refetches data when refreshTrigger changes", async () => {
      mockGetFriendsList.mockResolvedValue([
        { username: "friend1", display: "Friend One", createdAt: new Date() },
      ]);

      const { result, rerender } = renderHook(
        ({ username, refreshTrigger }) => useFriendList(username, refreshTrigger),
        { initialProps: { username: "testuser", refreshTrigger: 0 } },
      );

      await waitFor(() => {
        expect(result.current).not.toEqual({ message: "Loading..." });
      });

      // Change refresh trigger
      rerender({ username: "testuser", refreshTrigger: 1 });

      expect(mockGetFriendsList).toHaveBeenCalledTimes(2);
    });
  });

  describe("usePendingRequests", () => {
    it("returns loading message initially", () => {
      mockGetPendingRequests.mockResolvedValue([]);

      const { result } = renderHook(() => usePendingRequests("testuser"));

      expect(result.current).toEqual({ message: "Loading..." });
    });

    it("returns pending requests list when data is loaded", async () => {
      const mockRequests = [
        { username: "requester1", display: "Requester One", createdAt: new Date() },
        { username: "requester2", display: "Requester Two", createdAt: new Date() },
      ];
      mockGetPendingRequests.mockResolvedValue(mockRequests);

      const { result } = renderHook(() => usePendingRequests("testuser"));

      await waitFor(() => {
        expect(result.current).toEqual(mockRequests);
      });

      expect(mockGetPendingRequests).toHaveBeenCalledWith("testuser");
    });

    it("returns error message when API fails", async () => {
      mockGetPendingRequests.mockResolvedValue({ error: "Failed to load requests" });

      const { result } = renderHook(() => usePendingRequests("testuser"));

      await waitFor(() => {
        expect(result.current).toEqual({ message: "Error: Failed to load requests" });
      });
    });

    it("returns no pending requests message when list is empty", async () => {
      mockGetPendingRequests.mockResolvedValue([]);

      const { result } = renderHook(() => usePendingRequests("testuser"));

      await waitFor(() => {
        expect(result.current).toEqual({ message: "No pending requests..." });
      });
    });

    it("refetches data when refreshTrigger changes", async () => {
      mockGetPendingRequests.mockResolvedValue([
        { username: "requester1", display: "Requester One", createdAt: new Date() },
      ]);

      const { result, rerender } = renderHook(
        ({ username, refreshTrigger }) => usePendingRequests(username, refreshTrigger),
        { initialProps: { username: "testuser", refreshTrigger: 0 } },
      );

      await waitFor(() => {
        expect(result.current).not.toEqual({ message: "Loading..." });
      });

      // Change refresh trigger
      rerender({ username: "testuser", refreshTrigger: 1 });

      expect(mockGetPendingRequests).toHaveBeenCalledTimes(2);
    });
  });
});
