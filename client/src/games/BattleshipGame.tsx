import type { BattleshipMove, BattleshipView } from "@gamenite/shared";
import type { GameProps } from "../util/types.ts";

export default function BattleshipGame({
  view,
  players,
  userPlayerIndex,
  makeMove,
}: GameProps<BattleshipView, BattleshipMove>) {
  return (
    <div className="content spacedSection">
      <div>Game not yet implemented!</div>
    </div>
  );
}
