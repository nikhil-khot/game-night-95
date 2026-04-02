import { useEffect, useRef, useState } from "react";
import { SHIP_SIZES, type BattleshipMove, type BattleshipView } from "@gamenite/shared";
import type { GameProps } from "../util/types.ts";

const COL_LABELS = "ABCDEFGHIJ";
const CELL = 28; // px per cell
const TOTAL_SHIPS = SHIP_SIZES.length;

const shipNames: Record<number, string> = {
  5: "Carrier",
  4: "Battleship",
  3: "Cruiser",
  2: "Destroyer",
};

function shipName(size: number): string {
  return shipNames[size] ?? `${size}-cell ship`;
}

/** Background color for a board cell during battle */
function cellBg(cell: number, isOpponentBoard: boolean): string {
  if (cell === 4) return "#b45309"; // sunk — amber
  if (cell === 2) return "#dc2626"; // hit — red
  if (cell === 3) return "#bfdbfe"; // miss — light blue
  if (!isOpponentBoard && cell === 1) return "#6b7280"; // own ship — gray
  return "#1e3a5f"; // water / unknown — dark navy
}

type GridProps = {
  board: number[][];
  isOpponentBoard: boolean;
  clickable: boolean;
  onCellClick?: (row: number, col: number) => void;
};

function Grid({ board, isOpponentBoard, clickable, onCellClick }: GridProps) {
  return (
    <div style={{ display: "inline-block" }}>
      <div style={{ display: "flex", marginLeft: 24 }}>
        {Array.from(COL_LABELS).map((c) => (
          <div key={c} style={{ width: CELL, textAlign: "center", fontSize: 11, color: "#64748b" }}>
            {c}
          </div>
        ))}
      </div>
      {board.map((row, r) => (
        <div key={r} style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 20,
              flexShrink: 0,
              textAlign: "right",
              marginRight: 4,
              fontSize: 11,
              color: "#64748b",
            }}
          >
            {r + 1}
          </div>
          {row.map((cell, c) => {
            const canClick = clickable && cell !== 2 && cell !== 3 && cell !== 4;
            return (
              <div
                key={c}
                style={{
                  width: CELL,
                  height: CELL,
                  flexShrink: 0,
                  backgroundColor: cellBg(cell, isOpponentBoard),
                  border: "1px solid #334155",
                  cursor: canClick ? "crosshair" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxSizing: "border-box",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: "bold",
                  userSelect: "none",
                }}
                onClick={() => canClick && onCellClick?.(r, c)}
              >
                {cell === 3 ? "·" : cell === 4 ? "✕" : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Legend() {
  const items = [
    { color: "#6b7280", label: "Ship" },
    { color: "#dc2626", label: "Hit" },
    { color: "#b45309", label: "Sunk" },
    { color: "#bfdbfe", label: "Miss" },
    { color: "#1e3a5f", label: "Unknown" },
  ];
  return (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        marginTop: "1rem",
        fontSize: 13,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      {items.map(({ color, label }) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div
            style={{ width: 14, height: 14, backgroundColor: color, border: "1px solid #334155" }}
          />
          {label}
        </div>
      ))}
    </div>
  );
}

// ── Placement phase helpers ──────────────────────────────────────────────────

type LocalShip = { size: number; row: number; col: number; horizontal: boolean };
type PlacementCellState = "empty" | "ship" | "selected" | "overlap";

function defaultShips(): LocalShip[] {
  return Array.from(SHIP_SIZES).map((size, i) => ({
    size,
    row: i * 2,
    col: 0,
    horizontal: true,
  }));
}

function computeShipCells(ship: LocalShip): [number, number][] {
  return Array.from(
    { length: ship.size },
    (_, j) =>
      [ship.horizontal ? ship.row : ship.row + j, ship.horizontal ? ship.col + j : ship.col] as [
        number,
        number,
      ],
  );
}

function isValidPlacement(ships: LocalShip[]): boolean {
  const occupied = new Set<string>();
  for (const ship of ships) {
    for (const [r, c] of computeShipCells(ship)) {
      if (r < 0 || r >= 10 || c < 0 || c >= 10) return false;
      const key = `${r},${c}`;
      if (occupied.has(key)) return false;
      occupied.add(key);
    }
  }
  return true;
}

function buildPlacementGrid(
  ships: LocalShip[],
  selectedIdx: number,
): { state: PlacementCellState; shipIdx: number }[][] {
  const grid = Array.from({ length: 10 }, () =>
    Array.from({ length: 10 }, () => ({ state: "empty" as PlacementCellState, shipIdx: -1 })),
  );
  for (let i = 0; i < ships.length; i++) {
    for (const [r, c] of computeShipCells(ships[i])) {
      if (r < 0 || r >= 10 || c < 0 || c >= 10) continue;
      if (grid[r][c].state !== "empty") {
        grid[r][c] = { state: "overlap", shipIdx: -1 };
      } else {
        grid[r][c] = { state: i === selectedIdx ? "selected" : "ship", shipIdx: i };
      }
    }
  }
  return grid;
}

function placementCellBg(state: PlacementCellState): string {
  if (state === "selected") return "#22c55e";
  if (state === "ship") return "#6b7280";
  if (state === "overlap") return "#dc2626";
  return "#1e3a5f";
}

function shipsToBoard(ships: LocalShip[]): number[][] {
  const board = Array.from({ length: 10 }, () => Array(10).fill(0) as number[]);
  for (const ship of ships) {
    for (const [r, c] of computeShipCells(ship)) {
      if (r >= 0 && r < 10 && c >= 0 && c < 10) board[r][c] = 1;
    }
  }
  return board;
}

function PlacementGrid({
  ships,
  selectedIdx,
  onSelectShip,
}: {
  ships: LocalShip[];
  selectedIdx: number;
  onSelectShip: (idx: number) => void;
}) {
  const grid = buildPlacementGrid(ships, selectedIdx);
  return (
    <div style={{ display: "inline-block" }}>
      <div style={{ display: "flex", marginLeft: 24 }}>
        {Array.from(COL_LABELS).map((c) => (
          <div key={c} style={{ width: CELL, textAlign: "center", fontSize: 11, color: "#64748b" }}>
            {c}
          </div>
        ))}
      </div>
      {grid.map((row, r) => (
        <div key={r} style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 20,
              flexShrink: 0,
              textAlign: "right",
              marginRight: 4,
              fontSize: 11,
              color: "#64748b",
            }}
          >
            {r + 1}
          </div>
          {row.map(({ state, shipIdx }, c) => (
            <div
              key={c}
              style={{
                width: CELL,
                height: CELL,
                flexShrink: 0,
                backgroundColor: placementCellBg(state),
                border: "1px solid #334155",
                cursor: shipIdx >= 0 ? "pointer" : "default",
                boxSizing: "border-box",
                userSelect: "none",
              }}
              onClick={() => shipIdx >= 0 && onSelectShip(shipIdx)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function BattleshipGame({
  view,
  players,
  userPlayerIndex,
  makeMove,
}: GameProps<BattleshipView, BattleshipMove>) {
  const [sinkNotice, setSinkNotice] = useState<string | null>(null);
  const prevSunkRef = useRef<number[]>([]);

  // Local placement state (persists across placement→battle transition for display)
  const [placementShips, setPlacementShips] = useState<LocalShip[]>(defaultShips);
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Detect newly sunk ships and show a temporary banner
  useEffect(() => {
    if (view.finished || view.phase !== "battle") return;
    const current = view.sunkOpponentShipSizes;
    const prev = prevSunkRef.current;
    prevSunkRef.current = current;
    if (current.length > prev.length) {
      const newlySunk = current.slice(prev.length);
      const names = newlySunk.map(shipName).join(", ");
      setSinkNotice(`You sunk their ${names}!`);
      const timer = setTimeout(() => setSinkNotice(null), 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [view]);

  // Keyboard handler for placement phase
  useEffect(() => {
    if (view.finished || view.phase !== "placement" || view.myShipsPlaced) return;

    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      if (e.key === "Tab") {
        e.preventDefault();
        setSelectedIdx((prev) => (prev + 1) % SHIP_SIZES.length);
        return;
      }

      const isMovement = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "r", "R"].includes(
        e.key,
      );
      if (!isMovement) return;
      e.preventDefault();

      setPlacementShips((prev) => {
        const ship = prev[selectedIdx];
        let next = ship;

        if (e.key === "ArrowUp") {
          next = { ...ship, row: Math.max(0, ship.row - 1) };
        } else if (e.key === "ArrowDown") {
          const maxRow = ship.horizontal ? 9 : 9 - (ship.size - 1);
          next = { ...ship, row: Math.min(maxRow, ship.row + 1) };
        } else if (e.key === "ArrowLeft") {
          next = { ...ship, col: Math.max(0, ship.col - 1) };
        } else if (e.key === "ArrowRight") {
          const maxCol = ship.horizontal ? 9 - (ship.size - 1) : 9;
          next = { ...ship, col: Math.min(maxCol, ship.col + 1) };
        } else if (e.key === "r" || e.key === "R") {
          const h = !ship.horizontal;
          next = {
            ...ship,
            horizontal: h,
            row: Math.min(ship.row, h ? 9 : 9 - (ship.size - 1)),
            col: Math.min(ship.col, h ? 9 - (ship.size - 1) : 9),
          };
        }

        const updated = [...prev];
        updated[selectedIdx] = next;
        return updated;
      });
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedIdx, view]);

  function playerName(index: number) {
    if (index < 0) return "Watcher";
    return index === userPlayerIndex ? "You" : (players[index]?.display ?? `Player ${index + 1}`);
  }

  // ── Finished ──
  if (view.finished) {
    const winner = view.boards[1].some((row) => row.includes(1)) ? 1 : 0;
    return (
      <div className="content spacedSection">
        <h2>Game Over</h2>
        <p>
          <strong>{playerName(winner)}</strong> won!
        </p>
        <div style={{ display: "flex", gap: "2rem", overflowX: "auto" }}>
          {view.boards.map((board, i) => (
            <div key={i} style={{ flexShrink: 0 }}>
              <h3 style={{ marginBottom: "0.5rem" }}>{playerName(i)}</h3>
              <Grid board={board} isOpponentBoard={false} clickable={false} />
            </div>
          ))}
        </div>
        <Legend />
      </div>
    );
  }

  // ── Placement phase ──
  if (view.phase === "placement") {
    const isPlayer = userPlayerIndex >= 0;
    const valid = isValidPlacement(placementShips);

    if (!isPlayer || view.myShipsPlaced) {
      // Show confirmed board (read-only) while waiting for opponent
      return (
        <div className="content spacedSection">
          <h2>Battleship — Placing Ships</h2>
          <p style={{ color: "#64748b" }}>
            {view.opponentReady
              ? "Both players ready! Starting battle…"
              : "Waiting for opponent to place their ships…"}
          </p>
          {isPlayer && (
            <>
              <h3 style={{ marginBottom: "0.5rem" }}>Your Fleet</h3>
              <Grid
                board={shipsToBoard(placementShips)}
                isOpponentBoard={false}
                clickable={false}
              />
            </>
          )}
        </div>
      );
    }

    return (
      <div className="content spacedSection">
        <h2>Battleship — Place Your Ships</h2>
        <p style={{ color: "#94a3b8", fontSize: 13 }}>
          Arrow keys to move · <strong>R</strong> to rotate · Tab or click to select a ship
        </p>

        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "flex-start" }}>
          <PlacementGrid
            ships={placementShips}
            selectedIdx={selectedIdx}
            onSelectShip={setSelectedIdx}
          />

          {/* Ship list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", minWidth: 160 }}>
            {Array.from(SHIP_SIZES).map((size, i) => {
              const ship = placementShips[i];
              const isSelected = i === selectedIdx;
              const cells = computeShipCells(ship);
              const outOfBounds = cells.some(([r, c]) => r < 0 || r >= 10 || c < 0 || c >= 10);
              return (
                <div
                  key={i}
                  onClick={() => setSelectedIdx(i)}
                  style={{
                    padding: "0.3rem 0.6rem",
                    borderRadius: 4,
                    cursor: "pointer",
                    background: isSelected ? "#1e3a5f" : "transparent",
                    border: `1px solid ${isSelected ? "#22c55e" : "#334155"}`,
                    fontSize: 13,
                    color: outOfBounds ? "#f87171" : "#e2e8f0",
                  }}
                >
                  <span style={{ color: isSelected ? "#22c55e" : "#6b7280", marginRight: 6 }}>
                    {"█".repeat(size)}
                  </span>
                  {shipName(size)}
                  <span style={{ color: "#64748b", marginLeft: 6, fontSize: 11 }}>
                    {ship.horizontal ? "H" : "V"}
                  </span>
                </div>
              );
            })}

            <button
              disabled={!valid}
              onClick={() =>
                makeMove({
                  type: "place",
                  ships: placementShips.map(({ row, col, horizontal }) => ({
                    row,
                    col,
                    horizontal,
                  })),
                })
              }
              style={{
                marginTop: "0.5rem",
                padding: "0.5rem 1rem",
                background: valid ? "#22c55e" : "#374151",
                color: valid ? "#000" : "#6b7280",
                border: "none",
                borderRadius: 4,
                cursor: valid ? "pointer" : "not-allowed",
                fontWeight: "bold",
                fontSize: 14,
              }}
            >
              Confirm Placement
            </button>
            {!valid && (
              <p style={{ fontSize: 12, color: "#f87171", margin: 0 }}>
                Ships are overlapping or out of bounds
              </p>
            )}
          </div>
        </div>

        {/* Placement legend */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginTop: "1rem",
            fontSize: 13,
            flexWrap: "wrap",
          }}
        >
          {[
            { color: "#22c55e", label: "Selected ship" },
            { color: "#6b7280", label: "Other ship" },
            { color: "#dc2626", label: "Overlap" },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div
                style={{
                  width: 14,
                  height: 14,
                  backgroundColor: color,
                  border: "1px solid #334155",
                }}
              />
              {label}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Battle phase ──
  const { myBoard, opponentBoard, nextPlayer, sunkOpponentShipSizes } = view;
  const isPlayer = userPlayerIndex >= 0;
  const isMyTurn = userPlayerIndex === nextPlayer;

  return (
    <div className="content spacedSection">
      <h2>Battleship</h2>
      <p>
        {isPlayer
          ? isMyTurn
            ? "Your turn — click on the enemy waters to fire!"
            : `Waiting for ${playerName(nextPlayer)} to fire\u2026`
          : `${playerName(nextPlayer)} is taking their turn`}
      </p>

      {sinkNotice && (
        <div
          style={{
            background: "#b45309",
            color: "#fff",
            padding: "0.4rem 0.8rem",
            borderRadius: 4,
            fontWeight: "bold",
            marginBottom: "0.5rem",
            display: "inline-block",
          }}
        >
          {sinkNotice}
        </div>
      )}

      {isPlayer && (
        <div style={{ fontSize: 13, marginBottom: "0.5rem", color: "#64748b" }}>
          Enemy ships sunk: {sunkOpponentShipSizes.length} / {TOTAL_SHIPS}
        </div>
      )}

      <div style={{ display: "flex", gap: "2rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
        <div style={{ flexShrink: 0 }}>
          <h3 style={{ marginBottom: "0.5rem" }}>You</h3>
          <Grid board={myBoard} isOpponentBoard={false} clickable={false} />
        </div>
        <div style={{ flexShrink: 0 }}>
          <h3 style={{ marginBottom: "0.5rem" }}>Enemy</h3>
          <Grid
            board={opponentBoard}
            isOpponentBoard={true}
            clickable={isMyTurn && isPlayer}
            onCellClick={(row, col) => makeMove([row, col])}
          />
        </div>
      </div>
      <Legend />
    </div>
  );
}
