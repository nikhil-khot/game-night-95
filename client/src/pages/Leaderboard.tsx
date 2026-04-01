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
                    if (winners.length > 0) {
                      winners.forEach((winner) => {
                        acc[winner.display] = (acc[winner.display] ?? 0) + 1;
                      });
                    }
                    return acc;
                  },
                  {} as Record<string, number>,
                ),
              )
                .sort((a, b) => {
                  return b[1] - a[1];
                })
                .map(([user, wins]) => (
                  <div>
                    {user} has {wins} {wins === 1 ? "win!" : "wins!"}
                  </div>
                ))}
            </div>
          )}
        </>
      </div>
    </div>
  );
}
