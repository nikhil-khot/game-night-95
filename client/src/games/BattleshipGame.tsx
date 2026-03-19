import { useEffect, useRef, useState } from "react";
import type { BattleshipMove, BattleshipView } from "@gamenite/shared";
import type { GameProps } from "../util/types.ts";

const COL_LABELS = "ABCDEFGHIJ";
const CELL = 28; // px per cell
const TOTAL_SHIPS = 5;

const shipNames: Record<number, string> = {
  5: "Carrier",
  4: "Battleship",
  3: "Cruiser",
  2: "Destroyer",
};

function shipName(size: number): string {
  return shipNames[size] ?? `${size}-cell ship`;
}

/** Background color for a board cell */
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
      {/* Column header row */}
      <div style={{ display: "flex", marginLeft: 24 }}>
        {Array.from(COL_LABELS).map((c) => (
          <div key={c} style={{ width: CELL, textAlign: "center", fontSize: 11, color: "#64748b" }}>
            {c}
          </div>
        ))}
      </div>
      {/* Board rows */}
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

export default function BattleshipGame({
  view,
  players,
  userPlayerIndex,
  makeMove,
}: GameProps<BattleshipView, BattleshipMove>) {
  const [sinkNotice, setSinkNotice] = useState<string | null>(null);
  const prevSunkRef = useRef<number[]>([]);

  // Detect newly sunk ships and show a temporary banner
  useEffect(() => {
    if (view.finished) return;
    const unfinished = view as {
      finished: false;
      sunkOpponentShipSizes: number[];
    };
    const current = unfinished.sunkOpponentShipSizes;
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

  function playerName(index: number) {
    if (index < 0) return "Watcher";
    return index === userPlayerIndex ? "You" : (players[index]?.display ?? `Player ${index + 1}`);
  }

  if (view.finished) {
    const winner = view.boards[1].some((row) => row.includes(1)) ? 0 : 1;
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

  const { myBoard, opponentBoard, nextPlayer, sunkOpponentShipSizes } = view as {
    finished: false;
    myBoard: number[][];
    opponentBoard: number[][];
    nextPlayer: number;
    sunkOpponentShipSizes: number[];
  };
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

      {/* Sink notification banner */}
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

      {/* Ships sunk counter */}
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
