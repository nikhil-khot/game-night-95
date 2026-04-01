import useGameList from "../hooks/useGameList";
import UserLeaderboardView from "../components/UserLeaderboardView";
import "./Leaderboard.css";
import { generateStatsFromGames, sortLeaderboardEntries } from "../util/leaderboardProcessing";

export default function Leaderboard() {
  const gameList = useGameList();

  const leaderboardRows =
    "message" in gameList
      ? []
      : sortLeaderboardEntries(Object.entries(generateStatsFromGames(gameList))).map(
          ([user, record], index) => (
            <UserLeaderboardView key={user} rank={index + 1} user={user} record={record} />
          ),
        );

  return (
    <div className="content">
      <div className="spacedSection">
        <h2>Leaderboard</h2>
        {"message" in gameList ? (
          gameList.message
        ) : (
          <>
            <div className="leaderboardHeader" role="listItem">
              <div className="userRank">{"\u00a0\u00a0\u00a0\u00a0"}Username</div>
              <div className="stats">Stats (Win/Loss/Tie)</div>
            </div>
            <div className="dottedList">{leaderboardRows}</div>
          </>
        )}
      </div>
    </div>
  );
}
