import {
  type BattleshipView,
  type BattleshipState,
  type ShipPlacement,
  type TaggedGameView,
  SHIP_SIZES,
  zBattleshipAttackMove,
  zBattleshipPlaceMove,
  zBattleshipMove,
} from "@gamenite/shared";
import { GameService } from "./gameServiceManager.ts";
import { type GameLogic } from "./gameLogic.ts";

const BOARD_SIZE = 10;

/** Column labels for move descriptions */
const COLS = "ABCDEFGHIJ";

function emptyBoard(): number[][] {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0) as number[]);
}

/**
 * Builds a board from explicit ship placements.
 * Returns null if any placement is invalid (out of bounds or overlapping).
 */
function buildBoardFromPlacements(
  placements: ShipPlacement[],
): { board: number[][]; ships: [number, number][][] } | null {
  const board = emptyBoard();
  const ships: [number, number][][] = [];

  for (let i = 0; i < placements.length; i++) {
    const size = SHIP_SIZES[i];
    const { row, col, horizontal } = placements[i];
    const cells: [number, number][] = [];

    for (let j = 0; j < size; j++) {
      const r = horizontal ? row : row + j;
      const c = horizontal ? col + j : col;
      if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return null;
      if (board[r][c] !== 0) return null; // overlap
      cells.push([r, c]);
    }

    for (const [r, c] of cells) {
      board[r][c] = 1;
    }
    ships.push(cells);
  }

  return { board, ships };
}

/** Returns true if the board still has any unhit ship cells. */
function hasUnhitShips(board: number[][]): boolean {
  return board.some((row) => row.includes(1));
}

/**
 * Builds the opponent's board view:
 * - Hides unhit ship cells (1 → 0)
 * - Marks cells of fully-sunk ships as 4 instead of 2
 */
function buildOpponentView(board: number[][], ships: [number, number][][]): number[][] {
  const sunkSet = new Set<string>();
  for (const ship of ships) {
    if (ship.every(([r, c]) => board[r][c] === 2)) {
      for (const [r, c] of ship) {
        sunkSet.add(`${r},${c}`);
      }
    }
  }

  return board.map((row, r) =>
    row.map((cell, c) => {
      if (cell === 1) return 0; // hide unhit ship
      if (cell === 2 && sunkSet.has(`${r},${c}`)) return 4; // sunk
      return cell;
    }),
  );
}

/** Returns sizes of all fully-sunk ships for the given player's board. */
function sunkShipSizes(board: number[][], ships: [number, number][][]): number[] {
  return ships
    .filter((ship) => ship.every(([r, c]) => board[r][c] === 2))
    .map((ship) => ship.length);
}

export const battleshipLogic: GameLogic<BattleshipState, BattleshipView> = {
  minPlayers: 2,
  maxPlayers: 2,

  start: () => ({
    boards: [emptyBoard(), emptyBoard()],
    ships: [null, null],
    nextPlayer: 0,
    phase: "placement",
  }),

  update: (state, payload, playerIndex) => {
    if (state.phase === "placement") {
      const move = zBattleshipPlaceMove.safeParse(payload);
      if (move.error) return null;
      if (state.ships[playerIndex] !== null) return null; // already placed

      const result = buildBoardFromPlacements(move.data.ships);
      if (!result) return null;

      const newShips = [...state.ships];
      newShips[playerIndex] = result.ships;
      const newBoards = state.boards.map((b) => b.map((r) => [...r]));
      newBoards[playerIndex] = result.board;

      const bothPlaced = newShips.every((s) => s !== null);
      return {
        boards: newBoards,
        ships: newShips,
        nextPlayer: state.nextPlayer,
        phase: bothPlaced ? "battle" : "placement",
      };
    }

    // Battle phase
    const move = zBattleshipAttackMove.safeParse(payload);
    if (move.error) return null;
    if (playerIndex !== state.nextPlayer) return null;

    const [row, col] = move.data;
    const opponentIndex = 1 - playerIndex;
    const cell = state.boards[opponentIndex][row][col];

    // Cannot attack a cell that has already been attacked
    if (cell === 2 || cell === 3) return null;

    const newBoards = state.boards.map((b) => b.map((r) => [...r]));
    newBoards[opponentIndex][row][col] = cell === 1 ? 2 : 3; // hit or miss

    return { boards: newBoards, ships: state.ships, nextPlayer: opponentIndex, phase: "battle" };
  },

  isDone: (state) => {
    if (state.phase === "placement") return false;
    return state.boards.some((board) => !hasUnhitShips(board));
  },

  viewAs: (state, playerIndex) => {
    if (state.phase === "placement") {
      if (playerIndex === -1) {
        return { finished: false, phase: "placement", myShipsPlaced: false, opponentReady: false };
      }
      return {
        finished: false,
        phase: "placement",
        myShipsPlaced: state.ships[playerIndex] !== null,
        opponentReady: state.ships[1 - playerIndex] !== null,
      };
    }

    const done = state.boards.some((board) => !hasUnhitShips(board));
    if (done) {
      return { finished: true, boards: state.boards };
    }

    if (playerIndex === -1) {
      const ships0 = state.ships[0] as [number, number][][];
      const ships1 = state.ships[1] as [number, number][][];
      return {
        finished: false,
        phase: "battle",
        myBoard: buildOpponentView(state.boards[0], ships0),
        opponentBoard: buildOpponentView(state.boards[1], ships1),
        nextPlayer: state.nextPlayer,
        sunkOpponentShipSizes: [],
      };
    }

    const opponentIndex = 1 - playerIndex;
    const opponentShips = state.ships[opponentIndex] as [number, number][][];
    return {
      finished: false,
      phase: "battle",
      myBoard: state.boards[playerIndex],
      opponentBoard: buildOpponentView(state.boards[opponentIndex], opponentShips),
      nextPlayer: state.nextPlayer,
      sunkOpponentShipSizes: sunkShipSizes(state.boards[opponentIndex], opponentShips),
    };
  },

  tagView: (view): TaggedGameView => ({ type: "battleship", view }),

  describeMove: (_prevState, newState, payload, playerIndex) => {
    const move = zBattleshipMove.parse(payload);
    if (!Array.isArray(move)) {
      return ` placed their ships`;
    }

    const [row, col] = move;
    const opponentIndex = 1 - playerIndex;
    const cell = newState.boards[opponentIndex][row][col];
    const coord = `${COLS[col]}${row + 1}`;
    const ships = newState.ships[opponentIndex] as [number, number][][];

    if (cell === 2) {
      const sunk = ships.find(
        (ship) =>
          ship.some(([r, c]) => r === row && c === col) &&
          ship.every(([r, c]) => newState.boards[opponentIndex][r][c] === 2),
      );
      if (sunk) {
        return ` attacked ${coord} — hit and sank a ${sunk.length}-cell ship!`;
      }
      return ` attacked ${coord} — hit!`;
    }
    return ` attacked ${coord} — miss`;
  },
};

export const battleshipGameService = new GameService<BattleshipState, BattleshipView>(
  battleshipLogic,
);
