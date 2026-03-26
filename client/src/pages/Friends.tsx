import { useState } from "react";
import useAuth from "../hooks/useAuth.ts";
import { useFriendList, usePendingRequests } from "../hooks/useFriendList.ts";
import AddFriend from "../components/AddFriend.tsx";
import FriendsList from "../components/FriendsList.tsx";
import PendingRequests from "../components/PendingRequests.tsx";
import "./Friends.css";

/**
 * The Friends page allows users to:
 * - View their list of friends
 * - View and respond to pending friend requests
 * - Add new friends by sending requests
 */
export default function Friends() {
  const auth = useAuth();
  const [refreshCount, setRefreshCount] = useState(0);

  // Load friends and pending requests for the current user
  const friendsList = useFriendList(auth.username, refreshCount);
  const pendingRequests = usePendingRequests(auth.username, refreshCount);

  const handleFriendAction = () => {
    // Increment refresh count to trigger data refetch
    setRefreshCount((prev) => prev + 1);
  };

  return (
    <div className="content">
      <div className="spacedSection">
        <h2>Friends</h2>

        <div className="friendsContainer">
          {/* Add Friend Section */}
          <div className="friendsSection">
            <h3>Add Friend</h3>
            <AddFriend onSuccess={handleFriendAction} />
          </div>

          {/* Pending Requests Section */}
          <div className="friendsSection">
            <h3>
              Pending Requests
              {!("message" in pendingRequests) && pendingRequests.length > 0
                ? ` (${pendingRequests.length})`
                : ""}
            </h3>
            <PendingRequests requests={pendingRequests} onActionComplete={handleFriendAction} />
          </div>

          {/* Friends List Section */}
          <div className="friendsSection">
            <h3>
              Friends
              {!("message" in friendsList) && friendsList.length > 0
                ? ` (${friendsList.length})`
                : ""}
            </h3>
            <FriendsList friends={friendsList} onRemove={handleFriendAction} />
          </div>
        </div>
      </div>
    </div>
  );
}
