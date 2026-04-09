import { z } from "zod";
import { type SafeUserInfo } from "./user.types.ts";

/**
 * Represents game information needed to load the game page
 * - `gameId`: database key
 * - `type`: picks which game this is
 * - `status`: whether the game is waiting, active, or done
 * - `chat`: id for the game's chat
 * - `players`: active players for the game
 * - `createdAt`: when the game was created
 * - `createdBy`: username of the person who created the game
 * - `minPlayers`: the minimum number of players required to start the game
 */
export interface GameInfo {
  gameId: string;
  type: GameType;
  mode: GameMode;
  status: "waiting" | "active" | "done";
  winners: SafeUserInfo[];
  chat: string;
  players: SafeUserInfo[];
  createdAt: Date;
  createdBy: SafeUserInfo;
  minPlayers: number;
  /** Club names [creatorClub, opponentClub] for "club vs club" games */
  clubs?: [string, string];
  /** Per-club player rosters for "club vs club" games: [club0members, club1members] */
  clubRosters?: [SafeUserInfo[], SafeUserInfo[]];
}

/**
 * Represents game information needed to load a view of a game, which may or
 * may not be in progress.
 * - `gameId`: database key
 * - `view`: null if the game is still in a waiting-room state, or the game
 *   view object
 * - `players`: currently active players for the game
 */
export interface GamePlayInfo {
  gameId: string;
  view: TaggedGameView | null;
  players: SafeUserInfo[];
  /** Per-club player rosters for "club vs club" games */
  clubRosters?: [SafeUserInfo[], SafeUserInfo[]];
}

/**
 * Payload for the gamePlayersUpdated socket event.
 */
export interface GamePlayersInfo {
  players: SafeUserInfo[];
  /** Updated club rosters when a "club vs club" game's roster changes */
  clubRosters?: [SafeUserInfo[], SafeUserInfo[]];
}

/*** INDIVIDUAL GAME TYPES ***/
import type { NimView } from "./games/nim.types.ts";
export * from "./games/nim.types.ts";

import type { GuessView } from "./games/guess.types.ts";
export * from "./games/guess.types.ts";

import type { BattleshipView } from "./games/battleship.types.ts";
export * from "./games/battleship.types.ts";

/**
 * A GameType selects which game is being played. There needs to be exactly one
 * type for each game. See README.md for the operations that are required to
 * add a new game.
 */
export type GameType = z.infer<typeof zGameType>;
export const zGameType = z.union([z.literal("nim"), z.literal("guess"), z.literal("battleship")]);

/**
 * A GameMode selects which mode the game is being played in.
 * Each game mode should be supported by each game.
 */
export type GameMode = z.infer<typeof zGameMode>;
export const zGameMode = z.union([
  z.literal("player vs player"),
  z.literal("player vs ai"),
  z.literal("club vs club"),
]);

/*** TYPES USED IN THE GAMES API ***/

export type GameMakeMovePayload = z.infer<typeof zGameMakeMovePayload>;
export const zGameMakeMovePayload = z.object({
  gameId: z.string(),
  move: z.unknown(),
});
export type GameCreationPayload = z.infer<typeof zGameCreationPayload>;
export const zGameCreationPayload = z.object({
  gameType: zGameType,
  gameMode: zGameMode,
  /** Required when gameMode is "club vs club": the opponent club name */
  opponentClub: z.string().optional(),
});

/**
 * The TaggedGameView type allows the views for different game to be
 * distinguished.
 *
 * Each game should have a tagged game view. The `type` should be the game's
 * GameKey, and the `view` should be the type of the games view.
 */
export type TaggedGameView =
  | { type: "nim"; view: NimView }
  | { type: "guess"; view: GuessView }
  | { type: "battleship"; view: BattleshipView };
