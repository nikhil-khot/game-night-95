import useGameList from "../hooks/useGameList";

export default function GameList() {
  const gameList = useGameList();

  return (
    <div className="content">
      <div className="spacedSection">
        <h2>Leaderboard</h2>
        <>
          {"message" in gameList ? (
            gameList.message
          ) : (
            <div className="dottedList">
              {Object.entries(
                gameList.reduce(
                  (acc, game) => {
                    const winners = game.winners;
                    if (winners.length !== 0) {
                      if (winners.length === 1) {
                        const winner = winners[0];
                        if (!acc[winner.display]) {
                          acc[winner.display] = { wins: 0, losses: 0, ties: 0 };
                        }
                        acc[winner.display].wins += 1;
                      } else if (winners.length > 1) {
                        winners.forEach((winner) => {
                          if (!acc[winner.display]) {
                            acc[winner.display] = { wins: 0, losses: 0, ties: 0 };
                          }
                          acc[winner.display].ties += 1;
                        });
                      }
                      game.players.forEach((player) => {
                        if (!winners.some((winner) => winner.username === player.username)) {
                          if (!acc[player.display]) {
                            acc[player.display] = { wins: 0, losses: 0, ties: 0 };
                          }
                          acc[player.display].losses += 1;
                        }
                      });
                    }
                    return acc;
                  },
                  {} as Record<string, Record<"wins" | "losses" | "ties", number>>,
                ),
              )
                .sort((a, b) => {
                  const aWins = a[1].wins;
                  const bWins = b[1].wins;
                  if (aWins !== bWins) {
                    return bWins - aWins; // Sort by wins descending
                  }
                  const aLosses = a[1].losses;
                  const bLosses = b[1].losses;
                  if (aLosses !== bLosses) {
                    return aLosses - bLosses; // Sort by losses ascending
                  }
                  const aTies = a[1].ties;
                  const bTies = b[1].ties;
                  return bTies - aTies; // Sort by ties descending
                })
                .map(([user, record]) => (
                  <div key={user}>
                    {user} has {record.wins} {record.wins === 1 ? "win, " : "wins, "}
                    {record.losses} {record.losses === 1 ? "loss, " : "losses, "}
                    and {record.ties} {record.ties === 1 ? "tie" : "ties"}
                  </div>
                ))}
            </div>
          )}
        </>
      </div>
    </div>
  );
}
