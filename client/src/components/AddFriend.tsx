import { useState } from "react";
import useAuth from "../hooks/useAuth.ts";
import { sendFriendRequest } from "../services/friendService.ts";
import "./AddFriend.css";

interface AddFriendProps {
  onSuccess: () => void;
}

/**
 * Component to add a new friend by sending a friend request
 */
export default function AddFriend({ onSuccess }: AddFriendProps) {
  const auth = useAuth();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !auth) {
      setError("Please enter a username");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await sendFriendRequest(auth, username.trim());
    if ("error" in result) {
      setError(result.error);
    } else {
      setSuccess(`Friend request sent to ${username}`);
      setUsername("");
      // Call onSuccess after a short delay
      setTimeout(onSuccess, 500);
    }
    setLoading(false);
  };

  return (
    <div className="addFriendForm">
      <form onSubmit={handleSubmit}>
        <div className="formGroup">
          <input
            type="text"
            placeholder="Enter username..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            className="inputField"
          />
          <button type="submit" disabled={loading || !username.trim()} className="primary">
            {loading ? "Sending..." : "Send Request"}
          </button>
        </div>
      </form>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
    </div>
  );
}
