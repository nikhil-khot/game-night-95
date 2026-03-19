import {
  type BattleshipView,
  type BattleshipState,
  type TaggedGameView,
  zBattleshipMove,
} from "@gamenite/shared";
import { GameService } from "./gameServiceManager.ts";
import { type GameLogic } from "./gameLogic.ts";

/** Standard fleet: Carrier(5), Battleship(4), Cruiser(3), Submarine(3), Destroyer(2) */
const SHIP_SIZES = [5, 4, 3, 3, 2];
const BOARD_SIZE = 10;

/** Column labels for move descriptions */
const COLS = "ABCDEFGHIJ";

/**
 * Places ships randomly on a 10×10 board.
 * Returns the board (0 = water, 1 = ship) and the ship positions.
 */
function placeShipsRandomly(): { board: number[][]; ships: [number, number][][] } {
  const board: number[][] = Array.from(
    { length: BOARD_SIZE },
    () => Array(BOARD_SIZE).fill(0) as number[],
  );
  const ships: [number, number][][] = [];

  for (const size of SHIP_SIZES) {
    let placed = false;
    while (!placed) {
      const horizontal = Math.random() < 0.5;
      const maxRow = horizontal ? BOARD_SIZE - 1 : BOARD_SIZE - size;
      const maxCol = horizontal ? BOARD_SIZE - size : BOARD_SIZE - 1;
      const row = Math.floor(Math.random() * (maxRow + 1));
      const col = Math.floor(Math.random() * (maxCol + 1));

      let canPlace = true;
      for (let i = 0; i < size; i++) {
        const r = horizontal ? row : row + i;
        const c = horizontal ? col + i : col;
        if (board[r][c] !== 0) {
          canPlace = false;
          break;
        }
      }

      if (canPlace) {
        const cells: [number, number][] = [];
        for (let i = 0; i < size; i++) {
          const r = horizontal ? row : row + i;
          const c = horizontal ? col + i : col;
          board[r][c] = 1;
          cells.push([r, c]);
        }
        ships.push(cells);
        placed = true;
      }
    }
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

  start: () => {
    const p0 = placeShipsRandomly();
    const p1 = placeShipsRandomly();
    return {
      boards: [p0.board, p1.board],
      ships: [p0.ships, p1.ships],
      nextPlayer: 0,
    };
  },

  update: (state, payload, playerIndex) => {
    const move = zBattleshipMove.safeParse(payload);
    if (move.error) return null;
    if (playerIndex !== state.nextPlayer) return null;

    const [row, col] = move.data as [number, number];
    const opponentIndex = 1 - playerIndex;
    const cell = state.boards[opponentIndex][row][col];

    // Cannot attack a cell that has already been attacked
    if (cell === 2 || cell === 3) return null;

    const newBoards = state.boards.map((b) => b.map((r) => [...r]));
    newBoards[opponentIndex][row][col] = cell === 1 ? 2 : 3; // hit or miss

    return { boards: newBoards, ships: state.ships, nextPlayer: opponentIndex };
  },

  isDone: (state) => state.boards.some((board) => !hasUnhitShips(board)),

  viewAs: (state, playerIndex) => {
    const done = state.boards.some((board) => !hasUnhitShips(board));
    if (done) {
      return { finished: true, boards: state.boards };
    }
    if (playerIndex === -1) {
      // Watchers: hide ships from both boards
      return {
        finished: false,
        myBoard: buildOpponentView(state.boards[0], state.ships[0]),
        opponentBoard: buildOpponentView(state.boards[1], state.ships[1]),
        nextPlayer: state.nextPlayer,
        sunkOpponentShipSizes: [],
      };
    }
    const opponentIndex = 1 - playerIndex;
    return {
      finished: false,
      myBoard: state.boards[playerIndex],
      opponentBoard: buildOpponentView(state.boards[opponentIndex], state.ships[opponentIndex]),
      nextPlayer: state.nextPlayer,
      sunkOpponentShipSizes: sunkShipSizes(state.boards[opponentIndex], state.ships[opponentIndex]),
    };
  },

  tagView: (view): TaggedGameView => ({ type: "battleship", view }),

  describeMove: (_prevState, newState, payload, playerIndex) => {
    const [row, col] = zBattleshipMove.parse(payload) as [number, number];
    const opponentIndex = 1 - playerIndex;
    const cell = newState.boards[opponentIndex][row][col];
    const coord = `${COLS[col]}${row + 1}`;

    if (cell === 2) {
      // Check if this hit sank a ship
      const sunk = newState.ships[opponentIndex].find(
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
