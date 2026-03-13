import { z, ZodTuple } from "zod";

/**
 * The internal state of the battleship game is a list of 2d boards (one for each player)
 */
export interface BattleshipState {
  boards: number[][][];
}

/**
 * Before a game has finished, you have full knowledge of your board
 * and only know if your attacks have hit or missed on your opponent's board.
 */
export type UnfinishedBattleshipView = {
  finished: false;
  myBoard: number[][];
  opponentBoard: number[][];
};

/**
 * After a game has finished, the secret and everyone's guesses are all
 * visible to everyone.
 */
export type FinishedBattleshipView = {
  finished: true;
  boards: number[][][];
};

/**
 * The player's view of a guessing game depends on whether the game has
 * finished (whether all players have guessed) or not.
 */
export type BattleshipView = UnfinishedBattleshipView | FinishedBattleshipView;

/**
 * A move in the battleship game is an integer is an integer between 0 and 9,
 * representing your ship placement during the initial phase or your attack
 * during the attacking phase.
 */
export type BattleshipMove = z.infer<typeof zBattleshipMove>;
export const zBattleshipMove: ZodTuple = z.tuple([z.int().gte(0).lte(9), z.int().gte(0).lte(9)]);
