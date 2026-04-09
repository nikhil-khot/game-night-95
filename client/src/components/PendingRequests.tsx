import { useState } from "react";
import type { SafeUserInfo } from "@gamenite/shared";
import useAuth from "../hooks/useAuth.ts";
import { respondToFriendRequest } from "../services/friendService.ts";
import UserLink from "./UserLink.tsx";
import "./PendingRequests.css";
import { Button } from "@react95/core";

interface PendingRequestsProps {
  requests: { message: string } | SafeUserInfo[];
  onActionComplete: () => void;
}

/**
 * Component to display pending friend requests and allow accepting/declining them
 */
export default function PendingRequests({ requests, onActionComplete }: PendingRequestsProps) {
  const auth = useAuth();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if ("message" in requests) {
    return <div className="noPending">{requests.message}</div>;
  }

  const handleRespond = async (fromUsername: string, response: "accepted" | "declined") => {
    if (!auth) return;

    setProcessingId(fromUsername);
    setError(null);

    const result = await respondToFriendRequest(auth, fromUsername, response);
    if ("error" in result) {
      setError(result.error);
    } else {
      onActionComplete();
    }
    setProcessingId(null);
  };

  return (
    <div className="pendingRequests">
      {error && <p className="error">{error}</p>}
      <div className="dottedList">
        {requests.map((requester) => (
          <div key={requester.username} className="requestItem">
            <div className="requesterInfo">
              <UserLink user={requester} />
            </div>
            <div className="buttonGroup">
              <Button
                className="acceptBtn"
                onClick={() => handleRespond(requester.username, "accepted")}
                disabled={processingId === requester.username}
              >
                {processingId === requester.username ? "..." : "Accept"}
              </Button>
              <Button
                className="declineBtn"
                onClick={() => handleRespond(requester.username, "declined")}
                disabled={processingId === requester.username}
              >
                {processingId === requester.username ? "..." : "Decline"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
