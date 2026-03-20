import { z } from "zod";

/** Standard fleet sizes: Carrier(5), Battleship(4), Cruiser(3), Submarine(3), Destroyer(2) */
export const SHIP_SIZES = [5, 4, 3, 3, 2] as const;

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
  /** ships[playerIndex][shipIndex] = list of [row, col] cells, or null if not yet placed */
  ships: ([number, number][][] | null)[];
  nextPlayer: number;
  phase: "placement" | "battle";
}

export const zShipPlacement = z.object({
  row: z.int().gte(0).lte(9),
  col: z.int().gte(0).lte(9),
  horizontal: z.boolean(),
});
export type ShipPlacement = z.infer<typeof zShipPlacement>;

export const zBattleshipAttackMove = z.tuple([z.int().gte(0).lte(9), z.int().gte(0).lte(9)]);
export const zBattleshipPlaceMove = z.object({
  type: z.literal("place"),
  ships: z.array(zShipPlacement).length(SHIP_SIZES.length),
});
export const zBattleshipMove = z.union([zBattleshipAttackMove, zBattleshipPlaceMove]);
export type BattleshipMove = z.infer<typeof zBattleshipMove>;

/**
 * During the placement phase, players are arranging their ships before battle begins.
 */
export type BattleshipPlacementView = {
  finished: false;
  phase: "placement";
  myShipsPlaced: boolean;
  opponentReady: boolean;
};

/**
 * Before a game has finished, you have full knowledge of your board
 * and only know if your attacks have hit or missed on your opponent's board.
 * Cells on the opponent board with value 4 indicate a fully-sunk ship.
 */
export type UnfinishedBattleshipView = {
  finished: false;
  phase: "battle";
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
 * The player's view of a battleship game depends on the current phase.
 */
export type BattleshipView =
  | BattleshipPlacementView
  | UnfinishedBattleshipView
  | FinishedBattleshipView;
