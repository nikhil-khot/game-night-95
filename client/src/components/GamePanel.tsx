import "./GamePanel.css";
import type { GameInfo, SafeUserInfo } from "@gamenite/shared";
import { gameNames } from "../util/consts.ts";
import useLoginContext from "../hooks/useLoginContext.ts";
import useAuth from "../hooks/useAuth.ts";
import { useEffect, useState } from "react";
import type { AxiosError } from "axios";
import { inviteFriendToGame } from "../services/inviteService.ts";
import { useFriendList } from "../hooks/useFriendList.ts";
import GameDispatch from "../games/GameDispatch.tsx";
import useSocketsForGame from "../hooks/useSocketsForGame.ts";
import useTimeSince from "../hooks/useTimeSince.ts";
import UserLink from "./UserLink.tsx";

/**
 * A game panel allows viewing the status and players of a live game
 */
export default function GamePanel({
  gameId,
  type,
  mode,
  players: initialPlayers,
  clubs,
  clubRosters: initialClubRosters,
  createdAt,
  minPlayers,
}: GameInfo) {
  const { user, socket } = useLoginContext();
  const auth = useAuth();
  const timeSince = useTimeSince();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [inviteSearch, setInviteSearch] = useState("");
  const [onlineStatus, setOnlineStatus] = useState<Record<string, boolean>>({});
  const friends = useFriendList(user.username);

  const { view, players, clubRosters, userPlayerIndex, hasWatched, joinGame, startGame, addAI } =
    useSocketsForGame(gameId, initialPlayers);

  // Effective rosters: use live state if available, fall back to initial prop
  const effectiveClubRosters: [SafeUserInfo[], SafeUserInfo[]] | undefined =
    clubRosters ?? initialClubRosters;

  const isClubVsClub = mode === "club vs club";
  const hasStarted = !!view;

  // In club vs club: the game can start once at least 1 member from each club has joined
  const clubVsClubReady =
    isClubVsClub &&
    effectiveClubRosters !== undefined &&
    effectiveClubRosters[0].length >= 1 &&
    effectiveClubRosters[1].length >= 1;

  // Track online/offline status for friends when the invite dialog is open
  useEffect(() => {
    if (!inviteOpen) return;
    if ("message" in friends) return;

    const handleStatus = ({ userId, isOnline }: { userId: string; isOnline: boolean }) => {
      setOnlineStatus((prev) => {
        if (prev[userId] === isOnline) return prev;
        return { ...prev, [userId]: isOnline };
      });
    };

    socket.on("userStatusUpdated", handleStatus);

    // Ask for the current presence of each friend
    const friendList = friends;
    friendList.forEach((f) => {
      socket.emit("userPresenceQuery", { auth, payload: f.userId });
    });

    return () => {
      socket.off("userStatusUpdated", handleStatus);
    };
  }, [inviteOpen, friends, socket, auth]);

  function renderClubRoster(clubName: string, members: SafeUserInfo[]) {
    return (
      <div key={clubName} style={{ marginBottom: "0.5rem" }}>
        <strong>{clubName}</strong>
        <div className="dottedList" role="list">
          {members.length === 0 ? (
            <div className="dottedListItem smallAndGray" role="listitem">
              No members joined yet
            </div>
          ) : (
            members.map((member) => (
              <div className="dottedListItem" role="listitem" key={member.username}>
                {member.username === user.username ? "you" : <UserLink user={member} />}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return hasWatched ? (
    <div className="gamePanel">
      <div className="gameRoster">
        <h2>{gameNames[type]}</h2>
        <div className="smallAndGray">Game room created {timeSince(createdAt)}</div>

        {isClubVsClub && effectiveClubRosters && clubs ? (
          <>
            {renderClubRoster(clubs[0], effectiveClubRosters[0])}
            {renderClubRoster(clubs[1], effectiveClubRosters[1])}
          </>
        ) : (
          <div className="dottedList" role="list">
            {players.map((player, index) => (
              <div className="dottedListItem" role="listitem" key={player.username}>
                {player.username === user.username ? (
                  `you are player #${index + 1}`
                ) : (
                  <span>
                    Player #{index + 1} is <UserLink user={player} />
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Join button: shown when not yet in the game and game hasn't started */}
        {userPlayerIndex < 0 &&
          !hasStarted &&
          (mode === "player vs player" || mode === "club vs club") && (
            <div className="buttonContainer">
              <button className="primary narrow" onClick={joinGame}>
                Join Game
              </button>
            </div>
          )}

        {/* Controls (invite / AI / start) for players who have joined but the game hasn't started */}
        {userPlayerIndex >= 0 && !hasStarted && (
          <div className="buttonContainer">
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              {mode === "player vs player" && (
                <button
                  className="primary narrow"
                  disabled={players.length >= 4}
                  onClick={() => setInviteOpen(true)}
                >
                  Invite Friend
                </button>
              )}
              {mode === "player vs ai" && (
                <>
                  <button className="primary narrow" onClick={() => addAI("easy")}>
                    Add Easy AI
                  </button>
                  <button className="primary narrow" onClick={() => addAI("medium")}>
                    Add Medium AI
                  </button>
                  <button className="primary narrow" onClick={() => addAI("hard")}>
                    Add Hard AI
                  </button>
                </>
              )}
            </div>
            {isClubVsClub
              ? clubVsClubReady && (
                  <button className="primary narrow" onClick={startGame}>
                    Start Game
                  </button>
                )
              : players.length >= minPlayers && (
                  <button className="primary narrow" onClick={startGame}>
                    Start Game
                  </button>
                )}
          </div>
        )}
        {inviteOpen && (
          <div className="inviteDialog">
            <div className="inviteDialogCard">
              <div className="inviteDialogHeader">
                <div className="inviteDialogTitle">Invite a Friend</div>
                <div className="inviteDialogHint">Player vs player only</div>
                <button
                  type="button"
                  className="inviteCloseButton"
                  onClick={() => setInviteOpen(false)}
                  aria-label="Close invite dialog"
                >
                  ×
                </button>
              </div>
              <div className="inviteSearch">
                <input
                  type="text"
                  className="inviteSearchInput"
                  placeholder="Search by username..."
                  value={inviteSearch}
                  onChange={(e) => setInviteSearch(e.target.value)}
                />
              </div>
              {"message" in friends ? (
                <div>{friends.message}</div>
              ) : (
                <ul className="inviteList">
                  {friends
                    .filter((f) =>
                      (f.username + ("display" in f && f.display ? f.display : ""))
                        .toLowerCase()
                        .includes(inviteSearch.toLowerCase()),
                    )
                    .map((f) => {
                      const initials = f.username.slice(0, 2).toUpperCase();
                      const isInThisGame = players.some((p) => p.userId === f.userId);
                      const presence = onlineStatus[f.userId];
                      let statusLabel: string;
                      if (isInThisGame) {
                        statusLabel = "In this game";
                      } else if (presence === true) {
                        statusLabel = "Online";
                      } else if (presence === false) {
                        statusLabel = "Offline";
                      } else {
                        statusLabel = "Friend";
                      }
                      return (
                        <li key={f.userId} className="inviteListItem">
                          <div className="inviteFriendMeta">
                            <div className="inviteAvatar">{initials}</div>
                            <div>
                              <div className="inviteFriendName">{f.username}</div>
                              <div className="inviteFriendSub">
                                {(presence === true || presence === false) && (
                                  <span
                                    className={
                                      "invitePresenceDot" + (presence ? " online" : " offline")
                                    }
                                  />
                                )}
                                <span>{statusLabel}</span>
                              </div>
                            </div>
                          </div>
                          <div className="inviteActions">
                            <button
                              className="primary narrow"
                              type="button"
                              onClick={async () => {
                                if (inviteStatus === "sent:" + f.userId) return;
                                setInviteStatus(f.userId);
                                try {
                                  await inviteFriendToGame(auth, gameId, f.userId);
                                  setInviteStatus("sent:" + f.userId);
                                } catch (err) {
                                  const axiosErr = err as AxiosError<{ error?: string }>;
                                  const message =
                                    axiosErr.response?.data?.error ?? "Failed to invite";
                                  setInviteStatus("fail:" + f.userId + ":" + message);
                                }
                              }}
                            >
                              {inviteStatus === "sent:" + f.userId ? "Invited" : "Invite"}
                            </button>
                            <div
                              className={
                                "inviteStatusText" +
                                (inviteStatus?.startsWith("fail:" + f.userId + ":") ? " error" : "")
                              }
                            >
                              {inviteStatus === f.userId && "Inviting..."}
                              {inviteStatus === "sent:" + f.userId && "Invitation sent"}
                              {inviteStatus?.startsWith("fail:" + f.userId + ":") &&
                                inviteStatus.split(":").slice(2).join(":")}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
      {view ? (
        <div className="gameFrame">
          <GameDispatch
            gameId={gameId}
            userPlayerIndex={userPlayerIndex}
            players={players}
            view={view}
          />
        </div>
      ) : (
        <div className="gameFrame waiting content">waiting for game to begin</div>
      )}
    </div>
  ) : (
    <div></div>
  );
}
