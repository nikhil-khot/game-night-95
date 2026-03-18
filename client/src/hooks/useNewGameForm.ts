import type { GameType, GameMode } from "@gamenite/shared";
import { type ChangeEvent, useState, type SubmitEvent } from "react";
import useAuth from "./useAuth.ts";
import { useNavigate } from "react-router-dom";
import { createGame } from "../services/gameService.ts";

/**
 * Custom hook to manage game creation form logic
 * @throws if outside a LoginContext
 * @returns an object containing
 *  - Form value `gameKey`
 *  - Possibly-null error message `err`
 *  - Form handlers `handleInputChange` and `handleSubmit`
 */
export default function useNewGameForm() {
  const [gameType, setGameType] = useState<GameType | "">("");
  const [gameMode, setGameMode] = useState<GameMode | "">("");
  const [err, setErr] = useState<string | null>(null);
  const auth = useAuth();
  const navigate = useNavigate();

  const handleGameTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setErr(null);

    // type assertion is safe because NewGame.tsx only allows selection of
    // valid game keys
    setGameType(e.target.value as GameType | "");
  };

  const handleGameModeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setErr(null);

    // type assertion is safe because NewGame.tsx only allows selection of
    // valid game modes
    setGameMode(e.target.value as GameMode | "");
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (gameType === "") {
      setErr("Please select a game");
      return;
    }
    if (gameMode === "") {
      setErr("Please select a game mode");
      return;
    }

    setErr(null);
    const game = await createGame(auth, gameType, gameMode);
    if ("error" in game) {
      setErr(game.error);
      return;
    }
    navigate(`/game/${game.gameId}`);
  };

  return {
    gameType,
    gameMode,
    err,
    handleGameTypeChange,
    handleGameModeChange,
    handleSubmit,
  };
}
