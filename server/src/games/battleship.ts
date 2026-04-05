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
      return {
        finished: false,
        phase: "battle",
        myBoard: state.boards[0],
        opponentBoard: state.boards[1],
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
      return ` finished placing ships!`;
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
  getWinnerIndices: (_prevState, newState, payload, playerIndex) => {
    return hasUnhitShips(newState.boards[0]) ? [0] : [1];
  },
};

export const battleshipGameService = new GameService<BattleshipState, BattleshipView>(
  battleshipLogic,
);

/**
 * Generates a random valid placement for all ships in SHIP_SIZES.
 * Used by the easy AI bot to place its ships at game start.
 */
export function randomAIPlacement(): ShipPlacement[] {
  const board = emptyBoard();
  const placements: ShipPlacement[] = [];

  for (let i = 0; i < SHIP_SIZES.length; i++) {
    const size = SHIP_SIZES[i];
    let placed = false;
    while (!placed) {
      const horizontal = Math.random() < 0.5;
      const maxRow = horizontal ? BOARD_SIZE - 1 : BOARD_SIZE - size;
      const maxCol = horizontal ? BOARD_SIZE - size : BOARD_SIZE - 1;
      const row = Math.floor(Math.random() * (maxRow + 1));
      const col = Math.floor(Math.random() * (maxCol + 1));

      let valid = true;
      const cells: [number, number][] = [];
      for (let j = 0; j < size; j++) {
        const r = horizontal ? row : row + j;
        const c = horizontal ? col + j : col;
        if (board[r][c] !== 0) {
          valid = false;
          break;
        }
        cells.push([r, c]);
      }

      if (valid) {
        for (const [r, c] of cells) board[r][c] = 1;
        placements.push({ row, col, horizontal });
        placed = true;
      }
    }
  }

  return placements;
}

/**
 * Picks a random unattacked cell on the given board for the easy AI to attack.
 * `opponentBoard` should be the board belonging to the player being attacked.
 * @internal also used as a fallback by the other AI attack functions
 */
export function randomAIAttack(opponentBoard: number[][]): [number, number] {
  const available: [number, number][] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (opponentBoard[r][c] !== 2 && opponentBoard[r][c] !== 3) {
        available.push([r, c]);
      }
    }
  }
  return available[Math.floor(Math.random() * available.length)];
}

const DIRECTIONS: [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

/**
 * Picks an attack cell for the medium AI.
 *
 * If any hit cells (value 2) have at least one unattacked neighbor, the AI
 * picks randomly among those neighbors — continuing to hunt down partially
 * revealed ships. Otherwise it falls back to a fully random unattacked cell.
 *
 * `opponentBoard` should be the board belonging to the player being attacked.
 */
export function mediumAIAttack(opponentBoard: number[][]): [number, number] {
  const adjacent: [number, number][] = [];
  const seen = new Set<string>();

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (opponentBoard[r][c] !== 2) continue;
      for (const [dr, dc] of DIRECTIONS) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) continue;
        const cell = opponentBoard[nr][nc];
        if (cell === 2 || cell === 3) continue; // already attacked
        const key = `${nr},${nc}`;
        if (!seen.has(key)) {
          adjacent.push([nr, nc]);
          seen.add(key);
        }
      }
    }
  }

  if (adjacent.length > 0) {
    return adjacent[Math.floor(Math.random() * adjacent.length)];
  }

  return randomAIAttack(opponentBoard);
}

/**
 * Targeting helper for the hard AI.
 *
 * Groups connected hit cells (value 2) via BFS, prioritises the largest group,
 * then:
 *  - If the group is axis-aligned (all in one row or column), extends the line
 *    at both ends.
 *  - Otherwise (isolated hit or L-shape), tries all four cardinal neighbours.
 *
 * Returns the chosen cell, or null if every group is completely surrounded by
 * already-attacked cells (caller should fall back to hunting).
 */
function hardAITargetHits(board: number[][], hits: [number, number][]): [number, number] | null {
  // BFS to collect connected groups of hit cells
  const visited = new Set<string>();
  const groups: [number, number][][] = [];

  for (const [r, c] of hits) {
    if (visited.has(`${r},${c}`)) continue;
    const group: [number, number][] = [];
    const queue: [number, number][] = [[r, c]];
    while (queue.length > 0) {
      const [cr, cc] = queue.shift()!;
      if (visited.has(`${cr},${cc}`)) continue;
      visited.add(`${cr},${cc}`);
      group.push([cr, cc]);
      for (const [dr, dc] of DIRECTIONS) {
        const nr = cr + dr;
        const nc = cc + dc;
        if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) continue;
        if (board[nr][nc] === 2 && !visited.has(`${nr},${nc}`)) queue.push([nr, nc]);
      }
    }
    groups.push(group);
  }

  // Process largest group first
  groups.sort((a, b) => b.length - a.length);

  for (const group of groups) {
    const candidates: [number, number][] = [];

    if (group.length >= 2) {
      const allSameRow = group.every(([r]) => r === group[0][0]);
      const allSameCol = group.every(([, c]) => c === group[0][1]);

      if (allSameRow) {
        const row = group[0][0];
        const cols = group.map(([, c]) => c).sort((a, b) => a - b);
        const minC = cols[0];
        const maxC = cols[cols.length - 1];
        if (minC - 1 >= 0 && board[row][minC - 1] !== 2 && board[row][minC - 1] !== 3)
          candidates.push([row, minC - 1]);
        if (maxC + 1 < BOARD_SIZE && board[row][maxC + 1] !== 2 && board[row][maxC + 1] !== 3)
          candidates.push([row, maxC + 1]);
      } else if (allSameCol) {
        const col = group[0][1];
        const rows = group.map(([r]) => r).sort((a, b) => a - b);
        const minR = rows[0];
        const maxR = rows[rows.length - 1];
        if (minR - 1 >= 0 && board[minR - 1][col] !== 2 && board[minR - 1][col] !== 3)
          candidates.push([minR - 1, col]);
        if (maxR + 1 < BOARD_SIZE && board[maxR + 1][col] !== 2 && board[maxR + 1][col] !== 3)
          candidates.push([maxR + 1, col]);
      }
    }

    // Isolated hit, L-shaped group, or axis was blocked — try all neighbours
    if (candidates.length === 0) {
      const seen = new Set<string>();
      for (const [hr, hc] of group) {
        for (const [dr, dc] of DIRECTIONS) {
          const nr = hr + dr;
          const nc = hc + dc;
          if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) continue;
          if (board[nr][nc] === 2 || board[nr][nc] === 3) continue;
          const key = `${nr},${nc}`;
          if (!seen.has(key)) {
            candidates.push([nr, nc]);
            seen.add(key);
          }
        }
      }
    }

    if (candidates.length > 0) {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
  }

  return null;
}

/**
 * Picks an attack cell for the hard AI.
 *
 * **Targeting mode** (active hits exist): identifies connected groups of hit
 * cells, determines the ship's axis from aligned hits, and shoots along that
 * axis to sink the ship efficiently.
 *
 * **Hunting mode** (no active hits): uses a parity/checkerboard pattern —
 * only attacks cells where `(row + col) % 2 === 0`. Because the smallest ship
 * occupies 2 cells, this guarantees a hit within at most 50 shots.
 *
 * `opponentBoard` should be the board belonging to the player being attacked.
 */
export function hardAIAttack(opponentBoard: number[][]): [number, number] {
  const hits: [number, number][] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (opponentBoard[r][c] === 2) hits.push([r, c]);
    }
  }

  if (hits.length > 0) {
    const target = hardAITargetHits(opponentBoard, hits);
    if (target) return target;
  }

  // Hunt: checkerboard parity — every unattacked cell where (r + c) is even
  const parityTargets: [number, number][] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if ((r + c) % 2 === 0 && opponentBoard[r][c] !== 2 && opponentBoard[r][c] !== 3) {
        parityTargets.push([r, c]);
      }
    }
  }
  if (parityTargets.length > 0) {
    return parityTargets[Math.floor(Math.random() * parityTargets.length)];
  }

  return randomAIAttack(opponentBoard);
}
