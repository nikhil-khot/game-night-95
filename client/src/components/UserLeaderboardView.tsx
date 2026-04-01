import type { GameType } from "@gamenite/shared";
import "./UserLeaderboardView.css";

export default function UserLeaderboardView({
  user,
  rank,
  record,
}: {
  user: string;
  rank: number;
  record: {
    [game in GameType]: { wins: number; losses: number; ties: number };
  };
}) {
  const totalWins = record.nim.wins + record.guess.wins + record.battleship.wins;
  const totalLosses = record.nim.losses + record.guess.losses + record.battleship.losses;
  const totalTies = record.nim.ties + record.guess.ties + record.battleship.ties;
  return (
    <div className="leaderboardItem" role="listitem">
      <div className="userRank">
        {rank}. {user}
      </div>
      <div className="stats">
        Overall: {totalWins} / {totalLosses} / {totalTies}
      </div>
      <div className="stats">
        Nim: {record.nim.wins} / {record.nim.losses} / {record.nim.ties}
      </div>
      <div className="stats">
        Number Guesser: {record.guess.wins} / {record.guess.losses} / {record.guess.ties}
      </div>
      <div className="stats">
        Battleship: {record.battleship.wins} / {record.battleship.losses} / {record.battleship.ties}
      </div>
    </div>
  );
}
