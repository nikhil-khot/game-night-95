import type { ErrorMsg, SafeUserInfo } from "@gamenite/shared";
import { useEffect, useState } from "react";
import { getFriendsList, getPendingRequests } from "../services/friendService.ts";

/**
 * Custom hook to get the list of friends for a given user
 *
 * @param username - The username to fetch friends for
 * @param refreshTrigger - A value that when changed will trigger a refetch
 * @returns A message to display if loading/error, or the list of friends
 */
export function useFriendList(
  username: string,
  refreshTrigger: number = 0,
): { message: string } | SafeUserInfo[] {
  const [friends, setFriends] = useState<SafeUserInfo[] | ErrorMsg | null>(null);

  useEffect(() => {
    const loadFriends = async () => {
      const result = await getFriendsList(username);
      setFriends(result);
    };
    loadFriends();
  }, [username, refreshTrigger]);

  if (!friends) return { message: "Loading..." };
  if ("error" in friends) return { message: `Error: ${friends.error}` };
  if (friends.length === 0) return { message: "No friends yet..." };
  return friends;
}

/**
 * Custom hook to get the list of pending friend requests for a given user
 *
 * @param username - The username to fetch pending requests for
 * @param refreshTrigger - A value that when changed will trigger a refetch
 * @returns A message to display if loading/error, or the list of pending requesters
 */
export function usePendingRequests(
  username: string,
  refreshTrigger: number = 0,
): { message: string } | SafeUserInfo[] {
  const [pending, setPending] = useState<SafeUserInfo[] | ErrorMsg | null>(null);

  useEffect(() => {
    const loadPending = async () => {
      const result = await getPendingRequests(username);
      setPending(result);
    };
    loadPending();
  }, [username, refreshTrigger]);

  if (!pending) return { message: "Loading..." };
  if ("error" in pending) return { message: `Error: ${pending.error}` };
  if (pending.length === 0) return { message: "No pending requests..." };
  return pending;
}
