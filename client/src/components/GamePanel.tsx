import "./GamePanel.css";
import type { GameInfo, SafeUserInfo } from "@gamenite/shared";
import { gameNames } from "../util/consts.ts";
import useLoginContext from "../hooks/useLoginContext.ts";
import useAuth from "../hooks/useAuth.ts";
import { useState } from "react";
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
  const { user } = useLoginContext();
  const auth = useAuth();
  const timeSince = useTimeSince();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const friends = useFriendList(user.username);

  const { view, players, clubRosters, userPlayerIndex, hasWatched, joinGame, startGame, addAI } =
    useSocketsForGame(gameId, initialPlayers);

  // Effective rosters: use live state if available, fall back to initial prop
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
          )
        }
        {
          // If the game hasn't started and the user has joined, show invite and AI/start buttons
          userPlayerIndex >= 0 && !view && (
            <div className="buttonContainer" style={{ display: "flex", gap: 8 }}>
              <button
                className="primary narrow"
                disabled={players.length >= 4}
                onClick={() => setInviteOpen(true)}
              >
                Invite Friend
              </button>
              {mode === "player vs ai" && (
                <>
                  <button className="primary narrow" onClick={() => addAI("easy")}>
                    Add Easy AI
          )}

        {/* Controls for players who have joined but game hasn't started */}
        {userPlayerIndex >= 0 && !hasStarted && (
          <div className="buttonContainer">
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
                </>
              )}
              {players.length >= minPlayers && (
                <button className="primary narrow" onClick={startGame}>
                  Start Game
                </button>
              )}
            </div>
          )
        }
        {inviteOpen && (
          <div className="inviteDialog">
            <div
              style={{ background: "#fff", padding: 16, border: "1px solid #ccc", borderRadius: 8 }}
            >
              <h3>Invite a Friend</h3>
              {"message" in friends ? (
                <div>{friends.message}</div>
              ) : (
                <div
                  style={{
                    maxHeight: 200,
                    overflowY: "auto",
                    border: "1px solid #eee",
                    borderRadius: 4,
                  }}
                >
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {friends.map((f) => (
                      <li
                        key={f.userId}
                        style={{
                          padding: "8px 12px",
                          cursor: "pointer",
                          borderBottom: "1px solid #eee",
                          background: inviteStatus === f.userId ? "#e0e7ff" : "#fff",
                        }}
                        onClick={async () => {
                          setInviteStatus(f.userId);
                          try {
                            await inviteFriendToGame(auth, gameId, f.userId);
                            setInviteStatus("sent:" + f.userId);
                          } catch (err) {
                            const axiosErr = err as AxiosError<{ error?: string }>;
                            const message = axiosErr.response?.data?.error ?? "Failed to invite";
                            setInviteStatus("fail:" + f.userId + ":" + message);
                          }
                          setTimeout(() => {
                            setInviteOpen(false);
                            setInviteStatus(null);
                          }, 1200);
                        }}
                      >
                        {f.username}
                        {inviteStatus === f.userId && (
                          <span style={{ marginLeft: 8 }}>Inviting...</span>
                        )}
                        {inviteStatus === "sent:" + f.userId && (
                          <span style={{ marginLeft: 8 }}>Invitation sent!</span>
                        )}
                        {inviteStatus?.startsWith("fail:" + f.userId + ":") && (
                          <span style={{ marginLeft: 8, color: "red" }}>
                            {inviteStatus.split(":").slice(2).join(":")}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {inviteStatus && inviteStatus.startsWith("fail:") && (
                <div style={{ marginTop: 8, color: "red" }}>
                  {inviteStatus.split(":").slice(2).join(":")}
                </div>
              )}
              <button className="secondary narrow" onClick={() => setInviteOpen(false)}>
                Cancel
              </button>
            </div>
                )}
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
