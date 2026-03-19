import { z, ZodTuple } from "zod";

/**
 * The internal state of the battleship game is a list of 2d boards (one for each player).
 *
 * Board cell values:
 *   0 = empty water (not attacked)
 *   1 = ship (not yet attacked)
 *   2 = hit (ship cell that was attacked, ship not yet fully sunk)
 *   3 = miss (water cell that was attacked)
 *
 * In the opponent's view, fully-sunk ship cells are additionally marked as:
 *   4 = sunk (all cells of this ship have been hit)
 */
export interface BattleshipState {
  boards: number[][][];
  /** ships[playerIndex][shipIndex] = list of [row, col] cells for that ship */
  ships: [number, number][][][];
  nextPlayer: number;
}

/**
 * Before a game has finished, you have full knowledge of your board
 * and only know if your attacks have hit or missed on your opponent's board.
 * Cells on the opponent board with value 4 indicate a fully-sunk ship.
 */
export type UnfinishedBattleshipView = {
  finished: false;
  myBoard: number[][];
  opponentBoard: number[][];
  nextPlayer: number;
  /** Sizes of opponent ships that have been fully sunk, in the order they were sunk */
  sunkOpponentShipSizes: number[];
};

/**
 * After a game has finished, all boards are fully visible.
 */
export type FinishedBattleshipView = {
  finished: true;
  boards: number[][][];
};

/**
 * The player's view of a battleship game depends on whether the game has
 * finished or not.
 */
export type BattleshipView = UnfinishedBattleshipView | FinishedBattleshipView;

/**
 * A move in the battleship game is a [row, col] coordinate (each 0–9)
 * representing the cell to attack.
 */
export type BattleshipMove = z.infer<typeof zBattleshipMove>;
export const zBattleshipMove: ZodTuple = z.tuple([z.int().gte(0).lte(9), z.int().gte(0).lte(9)]);
