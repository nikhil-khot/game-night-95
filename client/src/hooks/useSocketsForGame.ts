import { useEffect, useState } from "react";
import useAuth from "./useAuth.ts";
import type { GamePlayInfo, GamePlayersInfo, SafeUserInfo, TaggedGameView } from "@gamenite/shared";
import useLoginContext from "./useLoginContext.ts";

/**
 * Custom hook to manage socket connection for a game
 * @throws if outside a LoginContext
 * @returns an object containing:
 * - `hasWatched`: Boolean that goes from false to true once the server has
 *   acknowledged the socket connection request
 * - `players`: The current list of game players.
 * - `userPlayerIndex`: The index of the current user in the `players` array,
 *   or null if the user is not a player
 * - `view`: The current game view for this user
 * - `joinGame`: Joins the game (if not started)
 * - `startGame`: Start the game (once joined)
 */
export default function useSocketsForGame(gameId: string, initialPlayers: SafeUserInfo[]) {
  const { user, socket } = useLoginContext();
  const auth = useAuth();
  const [view, setView] = useState<null | TaggedGameView>(null);
  const [hasWatched, setHasWatched] = useState<boolean>(false);
  const [players, setPlayers] = useState<SafeUserInfo[]>(initialPlayers);
  const [clubRosters, setClubRosters] = useState<[SafeUserInfo[], SafeUserInfo[]] | undefined>(
    undefined,
  );

  // In club vs club, playerIndex is determined by club roster membership.
  // For all other modes it's the position in the players array.
  let userPlayerIndex: number;
  if (clubRosters) {
    if (clubRosters[0].some(({ username }) => username === user.username)) userPlayerIndex = 0;
    else if (clubRosters[1].some(({ username }) => username === user.username)) userPlayerIndex = 1;
    else userPlayerIndex = -1;
  } else {
    userPlayerIndex = players.findIndex(({ username }) => username === user.username);
  }

  useEffect(() => {
    const handleWatched = (game: GamePlayInfo) => {
      if (game.gameId !== gameId) return;
      socket.off("gameWatched", handleWatched);
      setHasWatched(true);
      setPlayers(game.players);
      if (game.clubRosters) setClubRosters(game.clubRosters);
      setView(game.view);
    };

    const handlePlayersUpdated = (info: GamePlayersInfo) => {
      setPlayers(info.players);
      if (info.clubRosters) setClubRosters(info.clubRosters);
    };

    const handleStateUpdated = (view: TaggedGameView & { forPlayer: boolean }) => {
      if (!view) return;
      if (userPlayerIndex >= 0 && !view.forPlayer) return;
      setView(view);
    };

    socket.on("gameWatched", handleWatched);
    socket.on("gamePlayersUpdated", handlePlayersUpdated);
    socket.on("gameStateUpdated", handleStateUpdated);
    socket.emit("gameWatch", { auth, payload: gameId });

    return () => {
      socket.off("gameWatched", handleWatched);
      socket.off("gamePlayersUpdated", handlePlayersUpdated);
      socket.off("gameStateUpdated", handleStateUpdated);
    };
  }, [gameId, socket, userPlayerIndex, auth]);

  function joinGame() {
    socket.emit("gameJoinAsPlayer", { auth, payload: gameId });
  }

  function addAI(aiType: string) {
    socket.emit("gameAddAI", { auth, payload: { gameId, aiType } });
  }

  function startGame() {
    socket.emit("gameStart", { auth, payload: gameId });
  }

  return {
    hasWatched,
    players,
    clubRosters,
    userPlayerIndex,
    view,
    joinGame,
    startGame,
    addAI,
  };
}
