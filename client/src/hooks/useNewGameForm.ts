import type { GameType, GameMode } from "@gamenite/shared";
import { type ChangeEvent, useState, type SubmitEvent, useEffect } from "react";
import useAuth from "./useAuth.ts";
import { useNavigate } from "react-router-dom";
import { createGame } from "../services/gameService.ts";
import { listClubs } from "../services/clubService.ts";

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
  const [myClub, setMyClub] = useState<string | null>(null);
  const [opponentClub, setOpponentClub] = useState<string>("");
  const [otherClubs, setOtherClubs] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const auth = useAuth();
  const navigate = useNavigate();

  // When "club vs club" is selected, find the user's own club and the list of other clubs
  useEffect(() => {
    if (gameMode !== "club vs club") return;
    let ignore = false;
    (async () => {
      const result = await listClubs();
      if (ignore || "error" in result) return;
      const mine = result.find((c) => c.members.some((m) => m.username === auth.username));
      setMyClub(mine?.name ?? null);
      setOtherClubs(result.filter((c) => c.name !== mine?.name).map((c) => c.name));
    })();
    return () => {
      ignore = true;
    };
  }, [gameMode, auth.username]);

  const handleGameTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setErr(null);
    setGameType(e.target.value as GameType | "");
  };

  const handleGameModeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setErr(null);
    setMyClub(null);
    setOpponentClub("");
    setOtherClubs([]);
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
    if (gameMode === "club vs club") {
      if (!myClub) {
        setErr("You must be in a club to create a club vs club game");
        return;
      }
      if (!opponentClub) {
        setErr("Please select an opponent club");
        return;
      }
    }

    setErr(null);
    const game = await createGame(
      auth,
      gameType,
      gameMode,
      gameMode === "club vs club" ? opponentClub : undefined,
    );
    if ("error" in game) {
      setErr(game.error);
      return;
    }
    navigate(`/game/${game.gameId}`);
  };

  return {
    gameType,
    gameMode,
    myClub,
    opponentClub,
    setOpponentClub,
    otherClubs,
    err,
    handleGameTypeChange,
    handleGameModeChange,
    handleSubmit,
  };
}
