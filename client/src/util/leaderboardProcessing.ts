import type { GameInfo, GameType, SafeUserInfo } from "@gamenite/shared";

function createInitialStats(): {
  [game in GameType]: { wins: number; losses: number; ties: number };
} {
  return {
    nim: { wins: 0, losses: 0, ties: 0 },
    guess: { wins: 0, losses: 0, ties: 0 },
    battleship: { wins: 0, losses: 0, ties: 0 },
  };
}

export function generateStatsFromGames(gameList: GameInfo[]) {
  return gameList.reduce(
    (
      acc: Map<
        SafeUserInfo,
        { [game in GameType]: { wins: number; losses: number; ties: number } }
      >,
      game,
    ) => {
      const winners = game.winners;
      if (winners.length === 0) {
        return acc;
      }

      const ensurePlayer = (user: SafeUserInfo) => {
        if (!acc.has(user)) {
          acc.set(user, createInitialStats());
        }
      };

      if (winners.length === 1) {
        const winner = winners[0];
        ensurePlayer(winner);
        acc.get(winner)![game.type].wins += 1;
      } else {
        winners.forEach((winner) => {
          ensurePlayer(winner);
          acc.get(winner)![game.type].ties += 1;
        });
      }

      game.players.forEach((player) => {
        if (!winners.some((winner) => winner.username === player.username)) {
          ensurePlayer(player);
          acc.get(player)![game.type].losses += 1;
        }
      });

      return acc;
    },
    new Map<SafeUserInfo, { [game in GameType]: { wins: number; losses: number; ties: number } }>(),
  );
}

export function sortLeaderboardEntries(
  statsMap: Map<
    SafeUserInfo,
    { [game in GameType]: { wins: number; losses: number; ties: number } }
  >,
) {
  return Array.from(statsMap.entries()).sort((a, b) => {
    const score = (record: {
      [game in GameType]: { wins: number; losses: number; ties: number };
    }) => ({
      wins: record.nim.wins + record.guess.wins + record.battleship.wins,
      losses: record.nim.losses + record.guess.losses + record.battleship.losses,
      ties: record.nim.ties + record.guess.ties + record.battleship.ties,
    });

    const aScore = score(a[1]);
    const bScore = score(b[1]);

    if (aScore.wins !== bScore.wins) return bScore.wins - aScore.wins;
    if (aScore.losses !== bScore.losses) return aScore.losses - bScore.losses;
    return bScore.ties - aScore.ties;
  });
}
