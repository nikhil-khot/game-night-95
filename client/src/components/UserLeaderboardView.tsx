import type { GameType, SafeUserInfo } from "@gamenite/shared";
import "./UserLeaderboardView.css";
import { NavLink } from "react-router-dom";

export default function UserLeaderboardView({
  user,
  rank,
  record,
}: {
  user: SafeUserInfo | undefined;
  rank: number | undefined;
  record: {
    [game in GameType]: { wins: number; losses: number; ties: number };
  };
}) {
  const totalWins = record.nim.wins + record.guess.wins + record.battleship.wins;
  const totalLosses = record.nim.losses + record.guess.losses + record.battleship.losses;
  const totalTies = record.nim.ties + record.guess.ties + record.battleship.ties;
  return (
    <div className="leaderboardItem" role="listitem">
      {rank && user ? (
        <div className="userRank">
          {rank}. <NavLink to={`/profile/${user.username}`}>{user.display}</NavLink>
        </div>
      ) : (
        <> </>
      )}
      <div className="stats">
        {totalWins} / {totalLosses} / {totalTies}
      </div>
      <div className="stats">
        {record.nim.wins} / {record.nim.losses} / {record.nim.ties}
      </div>
      <div className="stats">
        {record.guess.wins} / {record.guess.losses} / {record.guess.ties}
      </div>
      <div className="stats">
        {record.battleship.wins} / {record.battleship.losses} / {record.battleship.ties}
      </div>
    </div>
  );
}
