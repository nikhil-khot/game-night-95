import { type GameType, type GameMode } from "@gamenite/shared";

export const gameNames: { [type in GameType]: string } = {
  nim: "Nim",
  guess: "Number Guesser",
  battleship: "Battleship",
};

export const gameModes: { [mode in GameMode]: string } = {
  "player vs player": "Player vs Player",
  "player vs ai": "Player vs AI",
  "club vs club": "Club vs Club",
};
