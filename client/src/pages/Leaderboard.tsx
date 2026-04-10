import useGameList from "../hooks/useGameList";
import UserLeaderboardView from "../components/UserLeaderboardView";
import "./Leaderboard.css";
import { generateStatsFromGames, sortLeaderboardEntries } from "../util/leaderboardProcessing";
import { Frame } from "@react95/core";

export default function Leaderboard() {
  const gameList = useGameList();

  const leaderboardRows =
    "message" in gameList
      ? []
      : sortLeaderboardEntries(generateStatsFromGames(gameList)).map(
          ([userInfo, record], index) => (
            <UserLeaderboardView key={index} rank={index + 1} user={userInfo} record={record} />
          ),
        );

  return (
    <div className="content">
      <Frame bgColor="$material" boxShadow="$out" padding="$4" className="outerFrame">
        <Frame h="100%" boxShadow="$in" className="innerFrame">
          <div className="content">
            <div className="spacedSection">
              <h2>Leaderboard</h2>
              {"message" in gameList ? (
                gameList.message
              ) : (
                <div>
                  <div className="leaderboardHeader" role="listItem">
                    <div className="userRank">{"\u00a0\u00a0\u00a0\u00a0"}Username</div>
                    <div className="stats">Stats (Win/Loss/Tie)</div>
                  </div>
                  <div className="leaderboardSubheader" role="">
                    <div className="userRank"></div>
                    <div className="stats">Overall</div>
                    <div className="stats">Nim</div>
                    <div className="stats">Number Guesser</div>
                    <div className="stats">Battleship</div>
                  </div>
                  <div className="dottedList">{leaderboardRows}</div>
                </div>
              )}
            </div>
          </div>
        </Frame>
      </Frame>
    </div>
  );
}
