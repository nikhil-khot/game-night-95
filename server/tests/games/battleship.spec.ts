import { describe, expect, it } from "vitest";
import {
  battleshipLogic,
  mediumAIAttack,
  randomAIAttack,
  randomAIPlacement,
} from "../../src/games/battleship.ts";
import type { BattleshipState, ShipPlacement } from "@gamenite/shared";
import { SHIP_SIZES } from "@gamenite/shared";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyBoard(): number[][] {
  return Array.from({ length: 10 }, () => Array(10).fill(0) as number[]);
}

/** Valid placements: each ship horizontal at its ship-index row, starting col 0 */
const DEFAULT_PLACEMENTS: ShipPlacement[] = SHIP_SIZES.map((_, i) => ({
  row: i,
  col: 0,
  horizontal: true,
}));

const placeMove = { type: "place" as const, ships: DEFAULT_PLACEMENTS };

/** Build a BattleshipState already in battle phase with the default placement */
function makeBattleState(): BattleshipState {
  // Board for each player: ship cells (1) at rows 0–4 according to SHIP_SIZES
  function makeBoard(): number[][] {
    const b = emptyBoard();
    SHIP_SIZES.forEach((size, row) => {
      for (let col = 0; col < size; col++) b[row][col] = 1;
    });
    return b;
  }

  function makeShips(): [number, number][][] {
    return SHIP_SIZES.map((size, row) =>
      Array.from({ length: size }, (_, col) => [row, col] as [number, number]),
    );
  }

  return {
    boards: [makeBoard(), makeBoard()],
    ships: [makeShips(), makeShips()],
    nextPlayer: 0,
    phase: "battle",
  };
}

// ---------------------------------------------------------------------------
// start()
// ---------------------------------------------------------------------------

describe(`Battleship's start() logic`, () => {
  it("Should start in placement phase with two empty boards and no ships placed", () => {
    const state = battleshipLogic.start(2);
    expect(state.phase).toBe("placement");
    expect(state.ships).toStrictEqual([null, null]);
    expect(state.boards).toHaveLength(2);
    expect(state.boards[0].flat().every((c) => c === 0)).toBe(true);
    expect(state.boards[1].flat().every((c) => c === 0)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// update() — placement phase
// ---------------------------------------------------------------------------

describe(`Battleship's update() logic (placement phase)`, () => {
  it("Should reject a poorly-typed move", () => {
    const state = battleshipLogic.start(2);
    expect(battleshipLogic.update(state, null, 0)).toBeNull();
    expect(battleshipLogic.update(state, { bad: true }, 0)).toBeNull();
    expect(battleshipLogic.update(state, [0, 0], 0)).toBeNull(); // attack move not valid in placement
  });

  it("Should reject placements where a ship goes out of bounds", () => {
    const state = battleshipLogic.start(2);
    // Carrier (size 5) placed horizontal at col 7 → cols 7-11, out of bounds
    const badPlacements: ShipPlacement[] = DEFAULT_PLACEMENTS.map((p, i) =>
      i === 0 ? { row: 0, col: 7, horizontal: true } : p,
    );
    expect(battleshipLogic.update(state, { type: "place", ships: badPlacements }, 0)).toBeNull();
  });

  it("Should reject placements where ships overlap", () => {
    const state = battleshipLogic.start(2);
    // All ships at row 0 col 0 horizontal → all overlap
    const overlapPlacements: ShipPlacement[] = SHIP_SIZES.map(() => ({
      row: 0,
      col: 0,
      horizontal: true,
    }));
    expect(
      battleshipLogic.update(state, { type: "place", ships: overlapPlacements }, 0),
    ).toBeNull();
  });

  it("Should accept a valid placement and mark only that player's ships", () => {
    const state = battleshipLogic.start(2);
    const next = battleshipLogic.update(state, placeMove, 0);
    expect(next).not.toBeNull();
    expect(next!.ships[0]).not.toBeNull();
    expect(next!.ships[1]).toBeNull();
    expect(next!.phase).toBe("placement");
  });

  it("Should reject a player placing their ships a second time", () => {
    const state = battleshipLogic.start(2);
    const next = battleshipLogic.update(state, placeMove, 0)!;
    expect(battleshipLogic.update(next, placeMove, 0)).toBeNull();
  });

  it("Should transition to battle phase once both players have placed", () => {
    const state = battleshipLogic.start(2);
    const after0 = battleshipLogic.update(state, placeMove, 0)!;
    const after1 = battleshipLogic.update(after0, placeMove, 1)!;
    expect(after1.phase).toBe("battle");
    expect(after1.ships[0]).not.toBeNull();
    expect(after1.ships[1]).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// update() — battle phase
// ---------------------------------------------------------------------------

describe(`Battleship's update() logic (battle phase)`, () => {
  it("Should reject a move from the wrong player", () => {
    const state = makeBattleState(); // nextPlayer: 0
    expect(battleshipLogic.update(state, [0, 0], 1)).toBeNull();
  });

  it("Should reject a poorly-typed attack move", () => {
    const state = makeBattleState();
    expect(
      battleshipLogic.update(state, { type: "place", ships: DEFAULT_PLACEMENTS }, 0),
    ).toBeNull();
  });

  it("Should reject out-of-bounds attack coordinates", () => {
    const state = makeBattleState();
    expect(battleshipLogic.update(state, [10, 0], 0)).toBeNull();
    expect(battleshipLogic.update(state, [0, 10], 0)).toBeNull();
    expect(battleshipLogic.update(state, [-1, 0], 0)).toBeNull();
  });

  it("Should record a miss (3) when attacking empty water", () => {
    const state = makeBattleState(); // player 1's ships are on rows 0–4
    const next = battleshipLogic.update(state, [9, 9], 0)!;
    expect(next).not.toBeNull();
    expect(next.boards[1][9][9]).toBe(3);
    expect(next.nextPlayer).toBe(1);
  });

  it("Should record a hit (2) when attacking a ship cell", () => {
    const state = makeBattleState(); // player 1's carrier is at row 0, cols 0–4
    const next = battleshipLogic.update(state, [0, 0], 0)!;
    expect(next).not.toBeNull();
    expect(next.boards[1][0][0]).toBe(2);
    expect(next.nextPlayer).toBe(1);
  });

  it("Should reject attacking a cell that was already missed", () => {
    const state = makeBattleState();
    const after0 = battleshipLogic.update(state, [9, 9], 0)!; // miss by p0
    const after1Turn = battleshipLogic.update(after0, [5, 5], 1)!; // p1 attacks their own target
    const invalid = battleshipLogic.update(after1Turn, [9, 9], 0); // p0 attacks same miss
    expect(invalid).toBeNull();
  });

  it("Should reject attacking a cell that was already hit", () => {
    const state = makeBattleState();
    const after0 = battleshipLogic.update(state, [0, 0], 0)!; // hit by p0
    const after1 = battleshipLogic.update(after0, [5, 5], 1)!; // p1 attacks
    const invalid = battleshipLogic.update(after1, [0, 0], 0); // p0 re-attacks hit cell
    expect(invalid).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// isDone()
// ---------------------------------------------------------------------------

describe(`Battleship's isDone() logic`, () => {
  it("Should not be done during the placement phase", () => {
    expect(battleshipLogic.isDone(battleshipLogic.start(2))).toBe(false);
    const halfway = battleshipLogic.update(battleshipLogic.start(2), placeMove, 0)!;
    expect(battleshipLogic.isDone(halfway)).toBe(false);
  });

  it("Should not be done when ships still remain on both boards", () => {
    expect(battleshipLogic.isDone(makeBattleState())).toBe(false);
  });

  it("Should be done when all ship cells on one board are hit", () => {
    const state = makeBattleState();
    // Mark all of player 1's ship cells as hit (2)
    const boards = state.boards.map((b) => b.map((r) => [...r]));
    for (let row = 0; row < SHIP_SIZES.length; row++) {
      for (let col = 0; col < SHIP_SIZES[row]; col++) {
        boards[1][row][col] = 2;
      }
    }
    expect(battleshipLogic.isDone({ ...state, boards })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// viewAs()
// ---------------------------------------------------------------------------

describe(`Battleship's viewAs() logic (placement phase)`, () => {
  it("Should show neither player as ready at the start", () => {
    const state = battleshipLogic.start(2);
    expect(battleshipLogic.viewAs(state, 0)).toStrictEqual({
      finished: false,
      phase: "placement",
      myShipsPlaced: false,
      opponentReady: false,
    });
  });

  it("Should reflect when player 0 has placed but player 1 has not", () => {
    const state = battleshipLogic.update(battleshipLogic.start(2), placeMove, 0)!;
    expect(battleshipLogic.viewAs(state, 0)).toMatchObject({
      myShipsPlaced: true,
      opponentReady: false,
    });
    expect(battleshipLogic.viewAs(state, 1)).toMatchObject({
      myShipsPlaced: false,
      opponentReady: true,
    });
  });

  it("Should return a placement view for watcher (-1)", () => {
    const state = battleshipLogic.start(2);
    expect(battleshipLogic.viewAs(state, -1)).toStrictEqual({
      finished: false,
      phase: "placement",
      myShipsPlaced: false,
      opponentReady: false,
    });
  });
});

describe(`Battleship's viewAs() logic (battle phase)`, () => {
  it("Should show both players' unhit ship cells to a watcher (-1)", () => {
    const state = makeBattleState();
    const view = battleshipLogic.viewAs(state, -1);
    if (view.finished || view.phase !== "battle") throw new Error("unexpected view");
    // Watcher should see unhit ship cells (1) on both boards, not hidden as 0
    expect(view.myBoard[0][0]).toBe(1);
    expect(view.opponentBoard[0][0]).toBe(1);
  });

  it("Should hide unhit ship cells on the opponent's board", () => {
    const state = makeBattleState();
    const view = battleshipLogic.viewAs(state, 0);
    if (view.finished || view.phase !== "battle") throw new Error("unexpected view");
    // Player 1's carrier at [0][0] is unhit; should be hidden (0) in opponentBoard
    expect(view.opponentBoard[0][0]).toBe(0);
  });

  it("Should show own board fully (unhit ship cells as 1)", () => {
    const state = makeBattleState();
    const view = battleshipLogic.viewAs(state, 0);
    if (view.finished || view.phase !== "battle") throw new Error("unexpected view");
    expect(view.myBoard[0][0]).toBe(1);
  });

  it("Should show a hit cell (2) on the opponent board after an attack", () => {
    const state = makeBattleState();
    const next = battleshipLogic.update(state, [0, 0], 0)!;
    const view = battleshipLogic.viewAs(next, 0);
    if (view.finished || view.phase !== "battle") throw new Error("unexpected view");
    expect(view.opponentBoard[0][0]).toBe(2);
  });

  it("Should show a miss cell (3) on the opponent board after a miss", () => {
    const state = makeBattleState();
    const next = battleshipLogic.update(state, [9, 9], 0)!;
    const view = battleshipLogic.viewAs(next, 0);
    if (view.finished || view.phase !== "battle") throw new Error("unexpected view");
    expect(view.opponentBoard[9][9]).toBe(3);
  });

  it("Should mark all cells of a fully-sunk ship as 4 on the opponent board", () => {
    // Sink player 1's destroyer (size 2) at row 4, cols 0–1
    const state = makeBattleState();
    const s1 = battleshipLogic.update(state, [4, 0], 0)!;
    const s2 = battleshipLogic.update(s1, [9, 0], 1)!;
    const s3 = battleshipLogic.update(s2, [4, 1], 0)!;
    const view = battleshipLogic.viewAs(s3, 0);
    if (view.finished || view.phase !== "battle") throw new Error("unexpected view");
    expect(view.opponentBoard[4][0]).toBe(4);
    expect(view.opponentBoard[4][1]).toBe(4);
  });

  it("Should include the size of a sunk ship in sunkOpponentShipSizes", () => {
    const state = makeBattleState();
    const s1 = battleshipLogic.update(state, [4, 0], 0)!;
    const s2 = battleshipLogic.update(s1, [9, 0], 1)!;
    const s3 = battleshipLogic.update(s2, [4, 1], 0)!;
    const view = battleshipLogic.viewAs(s3, 0);
    if (view.finished || view.phase !== "battle") throw new Error("unexpected view");
    expect(view.sunkOpponentShipSizes).toContain(2);
  });

  it("Should return a finished view with all boards visible when the game is over", () => {
    const state = makeBattleState();
    const boards = state.boards.map((b) => b.map((r) => [...r]));
    for (let row = 0; row < SHIP_SIZES.length; row++) {
      for (let col = 0; col < SHIP_SIZES[row]; col++) {
        boards[1][row][col] = 2;
      }
    }
    const doneState = { ...state, boards };
    const view = battleshipLogic.viewAs(doneState, 0);
    expect(view.finished).toBe(true);
    if (!view.finished) throw new Error("unexpected view");
    expect(view.boards).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// tagView()
// ---------------------------------------------------------------------------

describe(`Battleship's tagView() logic`, () => {
  it("Should tag a placement view correctly", () => {
    const view = battleshipLogic.viewAs(battleshipLogic.start(2), 0);
    expect(battleshipLogic.tagView(view)).toStrictEqual({ type: "battleship", view });
  });

  it("Should tag a battle view correctly", () => {
    const view = battleshipLogic.viewAs(makeBattleState(), 0);
    expect(battleshipLogic.tagView(view)).toStrictEqual({ type: "battleship", view });
  });
});

// ---------------------------------------------------------------------------
// describeMove()
// ---------------------------------------------------------------------------

describe(`Battleship's describeMove() logic`, () => {
  it("Should describe a ship placement", () => {
    const state = battleshipLogic.start(2);
    const next = battleshipLogic.update(state, placeMove, 0)!;
    expect(battleshipLogic.describeMove(state, next, placeMove, 0)).toBe(
      " finished placing ships!",
    );
  });

  it("Should describe a miss with the correct coordinate", () => {
    const state = makeBattleState();
    const next = battleshipLogic.update(state, [9, 9], 0)!;
    const desc = battleshipLogic.describeMove(state, next, [9, 9], 0);
    expect(desc).toContain("J10");
    expect(desc).toContain("miss");
  });

  it("Should describe a hit with the correct coordinate", () => {
    const state = makeBattleState();
    const next = battleshipLogic.update(state, [0, 0], 0)!;
    const desc = battleshipLogic.describeMove(state, next, [0, 0], 0);
    expect(desc).toContain("A1");
    expect(desc).toContain("hit");
  });

  it("Should describe sinking a ship with the correct size", () => {
    const state = makeBattleState();
    const s1 = battleshipLogic.update(state, [4, 0], 0)!;
    const s2 = battleshipLogic.update(s1, [9, 0], 1)!;
    const s3 = battleshipLogic.update(s2, [4, 1], 0)!;
    const desc = battleshipLogic.describeMove(s2, s3, [4, 1], 0);
    expect(desc).toContain("sank");
    expect(desc).toContain("2-cell");
  });
});

// ---------------------------------------------------------------------------
// randomAIPlacement()
// ---------------------------------------------------------------------------

describe("randomAIPlacement()", () => {
  it("Should return exactly one placement per ship", () => {
    const placements = randomAIPlacement();
    expect(placements).toHaveLength(SHIP_SIZES.length);
  });

  it("Should return placements whose coordinates are within board bounds", () => {
    const placements = randomAIPlacement();
    placements.forEach(({ row, col, horizontal }, i) => {
      const size = SHIP_SIZES[i];
      expect(row).toBeGreaterThanOrEqual(0);
      expect(col).toBeGreaterThanOrEqual(0);
      if (horizontal) {
        expect(col + size - 1).toBeLessThanOrEqual(9);
        expect(row).toBeLessThanOrEqual(9);
      } else {
        expect(row + size - 1).toBeLessThanOrEqual(9);
        expect(col).toBeLessThanOrEqual(9);
      }
    });
  });

  it("Should produce non-overlapping placements that are accepted by the game logic", () => {
    const placements = randomAIPlacement();
    const state = battleshipLogic.start(2);
    const next = battleshipLogic.update(state, { type: "place", ships: placements }, 0);
    expect(next).not.toBeNull();
  });

  it("Should place the correct total number of ship cells on the board", () => {
    const placements = randomAIPlacement();
    const state = battleshipLogic.start(2);
    const next = battleshipLogic.update(state, { type: "place", ships: placements }, 0)!;
    const shipCells = next.boards[0].flat().filter((c) => c === 1).length;
    const expected = SHIP_SIZES.reduce((sum, s) => sum + s, 0);
    expect(shipCells).toBe(expected);
  });

  it("Should produce valid placements across multiple calls (no single lucky result)", () => {
    for (let i = 0; i < 10; i++) {
      const placements = randomAIPlacement();
      const state = battleshipLogic.start(2);
      expect(battleshipLogic.update(state, { type: "place", ships: placements }, 0)).not.toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// randomAIAttack()
// ---------------------------------------------------------------------------

describe("randomAIAttack()", () => {
  it("Should return coordinates within board bounds", () => {
    const board = emptyBoard();
    const [row, col] = randomAIAttack(board);
    expect(row).toBeGreaterThanOrEqual(0);
    expect(row).toBeLessThanOrEqual(9);
    expect(col).toBeGreaterThanOrEqual(0);
    expect(col).toBeLessThanOrEqual(9);
  });

  it("Should never target a cell already marked as hit (2)", () => {
    const board = emptyBoard();
    // Mark all cells as hit except [5][5]
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        if (r !== 5 || c !== 5) board[r][c] = 2;
      }
    }
    const [row, col] = randomAIAttack(board);
    expect(row).toBe(5);
    expect(col).toBe(5);
  });

  it("Should never target a cell already marked as miss (3)", () => {
    const board = emptyBoard();
    // Mark all cells as miss except [3][7]
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        if (r !== 3 || c !== 7) board[r][c] = 3;
      }
    }
    const [row, col] = randomAIAttack(board);
    expect(row).toBe(3);
    expect(col).toBe(7);
  });

  it("Should target a ship cell (1) that has not been attacked", () => {
    const board = emptyBoard();
    board[2][4] = 1; // only unattacked ship cell
    // Fill everything else with misses
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        if (r !== 2 || c !== 4) board[r][c] = 3;
      }
    }
    const [row, col] = randomAIAttack(board);
    expect(row).toBe(2);
    expect(col).toBe(4);
  });

  it("Should return a cell that the game logic accepts as a valid AI attack", () => {
    const state = makeBattleState();
    // It's player 0's turn; change to player 1 so AI (player 1) can attack
    const stateForAI = { ...state, nextPlayer: 1 };
    const attack = randomAIAttack(stateForAI.boards[0]);
    const next = battleshipLogic.update(stateForAI, attack, 1);
    expect(next).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// mediumAIAttack()
// ---------------------------------------------------------------------------

describe("mediumAIAttack()", () => {
  it("Should return coordinates within board bounds", () => {
    const board = emptyBoard();
    const [row, col] = mediumAIAttack(board);
    expect(row).toBeGreaterThanOrEqual(0);
    expect(row).toBeLessThanOrEqual(9);
    expect(col).toBeGreaterThanOrEqual(0);
    expect(col).toBeLessThanOrEqual(9);
  });

  it("Should never target a cell already marked as hit (2) or miss (3)", () => {
    const board = emptyBoard();
    // Leave only [5][5] unattacked; mark everything else hit or miss alternately
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        if (r !== 5 || c !== 5) board[r][c] = (r + c) % 2 === 0 ? 2 : 3;
      }
    }
    const [row, col] = mediumAIAttack(board);
    expect(row).toBe(5);
    expect(col).toBe(5);
  });

  it("Should target a cell adjacent to a hit when one exists", () => {
    const board = emptyBoard();
    // Single hit at [4][4]; mark all other cells as miss except its neighbors
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        board[r][c] = 3; // miss
      }
    }
    board[4][4] = 2; // hit
    board[3][4] = 0; // unattacked neighbor (up)
    board[5][4] = 0; // unattacked neighbor (down)
    board[4][3] = 0; // unattacked neighbor (left)
    board[4][5] = 0; // unattacked neighbor (right)

    const [row, col] = mediumAIAttack(board);
    const isAdjacent =
      (row === 3 && col === 4) ||
      (row === 5 && col === 4) ||
      (row === 4 && col === 3) ||
      (row === 4 && col === 5);
    expect(isAdjacent).toBe(true);
  });

  it("Should fall back to a random unattacked cell when all hit-cell neighbors are already attacked", () => {
    const board = emptyBoard();
    // Hit at [0][0] with all neighbors already attacked
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        board[r][c] = 3; // miss everywhere
      }
    }
    board[0][0] = 2; // hit
    board[0][1] = 3; // neighbor right — already attacked
    board[1][0] = 3; // neighbor down  — already attacked
    // Only free cell is [9][9]
    board[9][9] = 0;

    const [row, col] = mediumAIAttack(board);
    expect(row).toBe(9);
    expect(col).toBe(9);
  });

  it("Should fall back to random when there are no hits on the board", () => {
    // Board with no hits: medium AI behaves like random AI
    const board = emptyBoard();
    // Mark all cells as miss except [2][7]
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        if (r !== 2 || c !== 7) board[r][c] = 3;
      }
    }
    const [row, col] = mediumAIAttack(board);
    expect(row).toBe(2);
    expect(col).toBe(7);
  });

  it("Should return a cell that the game logic accepts as a valid attack", () => {
    const state = makeBattleState();
    const stateForAI = { ...state, nextPlayer: 1 };
    const attack = mediumAIAttack(stateForAI.boards[0]);
    const next = battleshipLogic.update(stateForAI, attack, 1);
    expect(next).not.toBeNull();
  });
});
