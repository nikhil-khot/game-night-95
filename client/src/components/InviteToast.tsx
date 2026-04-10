import { useEffect, useMemo, useState } from "react";
import type { GameInfo } from "@gamenite/shared";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth.ts";
import { declineInvitedGame, getInvitedGames } from "../services/inviteService.ts";
import useLoginContext from "../hooks/useLoginContext.ts";
import "./InviteToast.css";

/**
 * Small side notification for pending game invites.
 * Polls the invited-games endpoint periodically and shows the newest invite
 * with an option to view the game or dismiss.
 */
export default function InviteToast() {
  const auth = useAuth();
  const { user } = useLoginContext();
  const navigate = useNavigate();

  const [invitedGames, setInvitedGames] = useState<GameInfo[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Poll for invited games periodically
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const games = await getInvitedGames(auth);
        if (!cancelled) {
          setInvitedGames(games);
        }
      } catch (err) {
        // Silently ignore; this is a best-effort hint UI
        if (!cancelled) {
          setInvitedGames([]);
        }
      }
    };

    void load();
    const id = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [auth]);

  const visibleInvites = useMemo(
    () => invitedGames.filter((g) => !dismissedIds.has(g.gameId)),
    [invitedGames, dismissedIds],
  );

  if (visibleInvites.length === 0) return null;

  const latest = visibleInvites[0];
  const otherPlayer = latest.players.find((p) => p.username !== user.username);
  const initials = (otherPlayer?.username ?? "?").slice(0, 2).toUpperCase();
  const displayName = otherPlayer?.username ?? "Someone";

  return (
    <div className="inviteToastContainer">
      <div className="inviteToast">
        <button
          type="button"
          className="inviteToastClose"
          onClick={() => {
            setDismissedIds((prev) => new Set(prev).add(latest.gameId));
          }}
          aria-label="Dismiss invite notification"
        >
          ×
        </button>
        <div className="inviteToastAvatar">{initials}</div>
        <div className="inviteToastBody">
          <div className="inviteToastName">{displayName}</div>
          <div className="inviteToastText">wants to play!</div>
        </div>
        <div className="inviteToastActions">
          <button
            type="button"
            className="inviteToastAccept"
            onClick={() => navigate(`/game/${latest.gameId}`)}
          >
            accept
          </button>
          <button
            type="button"
            className="inviteToastDecline"
            onClick={async () => {
              // Optimistically remove from local state
              setDismissedIds((prev) => new Set(prev).add(latest.gameId));
              try {
                await declineInvitedGame(auth, latest.gameId);
                // Also remove from invitedGames so it disappears from any future toasts
                setInvitedGames((current) => current.filter((g) => g.gameId !== latest.gameId));
              } catch {
                // If the decline fails, just leave it dismissed locally
              }
            }}
          >
            decline
          </button>
        </div>
      </div>
    </div>
  );
}
