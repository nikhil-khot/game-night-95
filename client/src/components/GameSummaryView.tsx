import "./GameSummaryView.css";
import type { GameInfo } from "@gamenite/shared";
import { NavLink, useNavigate } from "react-router-dom";
import { gameModes, gameNames } from "../util/consts.ts";
import useTimeSince from "../hooks/useTimeSince.ts";
import UserLink from "./UserLink.tsx";

/**
 * Summarizes information for a single game as part of a list of games
 */
export default function GameSummaryView({
  gameId,
  status,
  type,
  mode,
  players,
  createdAt,
  createdBy,
}: GameInfo) {
  const timeSince = useTimeSince();
  const navigate = useNavigate();
  const numPlayers = players.length;
  return (
    <div className="gameSummary" role="listitem">
      <div className="stats" onClick={() => navigate(`/game/${gameId}`)}>
        {status}
        {status !== "done" && `, ${numPlayers} player${numPlayers === 1 ? "" : "s"}`}
      </div>
      <NavLink to={`/game/${gameId}`} className="gameLink">
        A game of {gameNames[type]}
      </NavLink>
      <div className="gameMode">{gameModes[mode]}</div>
      <div className="lastActivity">
        <UserLink user={createdBy} capitalize /> created {timeSince(createdAt)}
      </div>
    </div>
  );
}
