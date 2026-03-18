import "./GamePanel.css";
import type { GameInfo } from "@gamenite/shared";
import { gameNames } from "../util/consts.ts";
import useLoginContext from "../hooks/useLoginContext.ts";
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
  createdAt,
  minPlayers,
}: GameInfo) {
  const { user } = useLoginContext();
  const timeSince = useTimeSince();

  const { view, players, userPlayerIndex, hasWatched, joinGame, startGame, addAI } =
    useSocketsForGame(gameId, initialPlayers);

  return hasWatched ? (
    <div className="gamePanel">
      <div className="gameRoster">
        <h2>{gameNames[type]}</h2>
        <div className="smallAndGray">Game room created {timeSince(createdAt)}</div>
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
        {
          // If the game hasn't started and user hasn't joined, they can join if it is a player vs player game
          userPlayerIndex < 0 && !view && mode === "player vs player" && (
            <div className="buttonContainer">
              <button className="primary narrow" onClick={joinGame}>
                Join Game
              </button>
            </div>
          )
        }
        {
          // If the game hasn't started and the user has joined, they can add ai opponents (if in the right game mode)
          // and/or start the game once enough players exist
          userPlayerIndex >= 0 && !view && (
            <div className="buttonContainer">
              {mode === "player vs ai" && (
                <>
                  <button className="primary narrow" onClick={() => addAI("easy")}>
                    Add Easy AI
                  </button>
                  <button className="primary narrow" onClick={() => addAI("medium")}>
                    Add Medium AI
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
