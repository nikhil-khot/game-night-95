import { useState } from "react";
import type { SafeUserInfo } from "@gamenite/shared";
import useAuth from "../hooks/useAuth.ts";
import { removeFriend } from "../services/friendService.ts";
import UserLink from "./UserLink.tsx";
import "./FriendsList.css";
import { Button } from "@react95/core";

interface FriendsListProps {
  friends: { message: string } | SafeUserInfo[];
  onRemove: () => void;
  onSelect: (friendUsername: string) => void;
  selectedUsername: string | null;
}

/**
 * Component to display the list of friends with the ability to remove them
 */
export default function FriendsList({
  friends,
  onRemove,
  onSelect,
  selectedUsername,
}: FriendsListProps) {
  const auth = useAuth();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if ("message" in friends) {
    return <div className="noFriends">{friends.message}</div>;
  }

  const handleRemove = async (friendUsername: string) => {
    if (!auth) return;

    setRemovingId(friendUsername);
    setError(null);

    const result = await removeFriend(auth, friendUsername);
    if ("error" in result) {
      setError(result.error);
    } else {
      onRemove();
    }
    setRemovingId(null);
  };

  return (
    <div className="friendsList">
      {error && <p className="error">{error}</p>}
      <div className="dottedList">
        {friends.map((friend) => (
          <div
            key={friend.username}
            className={`friendItem ${selectedUsername === friend.username ? "friendItemActive" : ""}`}
            onClick={() => onSelect(friend.username)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(friend.username);
              }
            }}
          >
            <div className="friendInfo">
              <UserLink user={friend} />
            </div>
            <Button
              className="removeBtn"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(friend.username);
              }}
              disabled={removingId === friend.username}
            >
              {removingId === friend.username ? "Removing..." : "Remove"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
