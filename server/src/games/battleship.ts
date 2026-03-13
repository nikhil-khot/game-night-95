import { type BattleshipView, type BattleshipState, type TaggedGameView } from "@gamenite/shared";
import { GameService } from "./gameServiceManager.ts";
import { type GameLogic } from "./gameLogic.ts";

export const battleshipLogic: GameLogic<BattleshipState, BattleshipView> = {
  minPlayers: 2,
  maxPlayers: 2,
  start: function (): BattleshipState {
    throw new Error("Function not implemented.");
  },
  update: function (
    state: BattleshipState,
    payload: unknown,
    playerIndex: number,
  ): BattleshipState | null {
    throw new Error("Function not implemented.");
  },
  isDone: function (state: BattleshipState): boolean {
    throw new Error("Function not implemented.");
  },
  viewAs: function (state: BattleshipState, playerIndex: number): BattleshipView {
    throw new Error("Function not implemented.");
  },
  tagView: function (view: BattleshipView): TaggedGameView {
    throw new Error("Function not implemented.");
  },
  describeMove: function (
    _prevState: BattleshipState,
    newState: BattleshipState,
    payload: unknown,
    playerIndex: number,
  ): string {
    throw new Error("Function not implemented.");
  },
};

export const battleshipGameService = new GameService<BattleshipState, BattleshipView>(
  battleshipLogic,
);
