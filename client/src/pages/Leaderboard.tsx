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
                    const winner = game.winner;
                    if (winner !== "none" && winner !== "tie") {
                      acc[winner.display] = (acc[winner.display] ?? 0) + 1;
                    }
                    return acc;
                  },
                  {} as Record<string, number>,
                ),
              ).map(([user, wins]) => (
                <div>
                  {user} has {wins} wins!
                </div>
              ))}
            </div>
          )}
        </>
      </div>
    </div>
  );
}
