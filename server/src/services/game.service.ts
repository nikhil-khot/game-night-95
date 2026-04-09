import {
  type BattleshipState,
  type GameInfo,
  type GameMode,
  type GamePlayersInfo,
  type GameType,
  type SafeUserInfo,
  type TaggedGameView,
} from "@gamenite/shared";
import { createChat } from "./chat.service.ts";
import { populateSafeUserInfo } from "./user.service.ts";
import { type GameServicer } from "../games/gameServiceManager.ts";
import { nimGameService } from "../games/nim.ts";
import { guessGameService } from "../games/guess.ts";
import {
  battleshipGameService,
  hardAIAttack,
  mediumAIAttack,
  randomAIAttack,
  randomAIPlacement,
} from "../games/battleship.ts";
import { type GameViewUpdates, type UserWithId } from "../types.ts";
import { GameRepo } from "../repository.ts";
import { awardPoints, findUserClub, isClubMember } from "./club.service.ts";

/**
 * The service interface for individual games
 */
export const gameServices: { [key in GameType]: GameServicer } = {
  nim: nimGameService,
  guess: guessGameService,
  battleship: battleshipGameService,
};

/**
 * Expand a stored game
 *
 * @param gameId - Valid game id
 * @returns the expanded game info object
 */
async function populateGameInfo(gameId: string): Promise<GameInfo> {
  const game = await GameRepo.get(gameId);

  let clubRosters: [SafeUserInfo[], SafeUserInfo[]] | undefined;
  if (game.clubRosters) {
    const [r0, r1] = game.clubRosters;
    clubRosters = [
      await Promise.all(r0.map(populateSafeUserInfo)),
      await Promise.all(r1.map(populateSafeUserInfo)),
    ];
  }

  return {
    gameId,
    createdBy: await populateSafeUserInfo(game.createdBy),
    chat: game.chat,
    createdAt: new Date(game.createdAt),
    players: await Promise.all(game.players.map(populateSafeUserInfo)),
    type: game.type,
    mode: game.mode,
    status: !game.state ? "waiting" : game.done ? "done" : "active",
    minPlayers: gameServices[game.type].minPlayers,
    winners: await Promise.all(game.winners.map(populateSafeUserInfo)),
    clubs: game.clubs,
    clubRosters,
  };
}

/**
 * Create and store a new game
 *
 * @param user - Initial player in the game's waiting room
 * @param type - Game type
 * @param mode - Game mode
 * @param createdAt - Creation time for this game
 * @returns the new game's info object
 */
export async function createGame(
  user: UserWithId,
  type: GameType,
  mode: GameMode,
  createdAt: Date,
  opponentClub?: string,
): Promise<GameInfo> {
  let clubs: [string, string] | undefined;
  let clubRosters: [string[], string[]] | undefined;
  if (mode === "club vs club") {
    if (!opponentClub) throw new Error("club vs club games require an opponent club");
    const myClub = await findUserClub(user.username);
    if (!myClub)
      throw new Error(`${user.username} must be in a club to create a club vs club game`);
    if (myClub === opponentClub) throw new Error("club vs club games require two different clubs");
    clubs = [myClub, opponentClub];
    clubRosters = [[user.userId], []];
  }

  const chat = await createChat(createdAt);
  const gameId = await GameRepo.add({
    type,
    mode,
    done: false,
    chat: chat.chatId,
    createdAt: createdAt.toISOString(),
    createdBy: user.userId,
    players: [user.userId],
    winners: [],
    clubs,
    clubRosters,
  });
  return populateGameInfo(gameId);
}

/**
 * Retrieves a single game from the database. If you expect the id to be valid, use `forceGameById`.
 *
 * @param gameId - Ostensible game id
 * @returns the game's info object, or null
 */
export async function getGameById(gameId: string): Promise<GameInfo | null> {
  const game = await GameRepo.find(gameId);
  if (!game) return null;
  return populateGameInfo(gameId);
}

/**
 * Adds a user to a game that hasn't started yet.
 *
 * For "club vs club" games, any member of either participating club may join and
 * there is no maximum roster size — multiple club members may participate on the
 * same side. For all other modes, the existing single-player-per-slot rules apply.
 *
 * @param gameId - Ostensible game id
 * @param user - Authenticated user
 * @returns the game's info object, with the `user` listed among the players
 * @throws if the game id is not valid, if the game has started, or if the user
 *   cannot join (wrong club, already in game, game full for non-club modes, etc.)
 */
export async function joinGame(gameId: string, user: UserWithId): Promise<GameInfo> {
  const game = await GameRepo.find(gameId);
  if (!game) throw new Error(`user ${user.username} joining invalid game`);
  if (game.state) {
    throw new Error(`user ${user.username} joining game that started`);
  }
  if (game.aiType) {
    throw new Error(`user ${user.username} joining a game that already has an AI opponent`);
  }

  if (game.mode === "club vs club") {
    const clubs = game.clubs!;
    const inClub0 = await isClubMember(user.username, clubs[0]);
    const inClub1 = await isClubMember(user.username, clubs[1]);
    if (!inClub0 && !inClub1) {
      throw new Error(`user ${user.username} is not a member of either participating club`);
    }

    const clubIdx = inClub0 ? 0 : 1;
    const [r0, r1]: [string[], string[]] = game.clubRosters ?? [[], []];
    const roster: [string[], string[]] = [r0, r1];
    if (roster[clubIdx].includes(user.userId)) {
      throw new Error(`user ${user.username} joining game they are in already`);
    }

    roster[clubIdx] = [...roster[clubIdx], user.userId];
    game.clubRosters = roster;
    game.players = [...game.players, user.userId];
    await GameRepo.set(gameId, game);
    return populateGameInfo(gameId);
  }

  // Non-club-vs-club: original single-slot logic
  if (game.players.some((userId) => userId === user.userId)) {
    throw new Error(`user ${user.username} joining game they are in already`);
  }
  if (game.players.length === gameServices[game.type].maxPlayers) {
    throw new Error(`user ${user.username} joining full`);
  }

  game.players = [...game.players, user.userId];
  await GameRepo.set(gameId, game);

  return populateGameInfo(gameId);
}

/**
 * Adds an AI opponent to a "player vs ai" game and immediately starts it.
 *
 * @param gameId - Ostensible game id
 * @param user - Authenticated player who is in the game
 * @param aiType - Difficulty string: "easy" | "medium" | "hard"
 * @returns the initial view updates (same as startGame)
 * @throws if the game is invalid, already started, not "player vs ai", or already has an AI
 */
export async function addAIToGame(
  gameId: string,
  user: UserWithId,
  aiType: string,
): Promise<GameViewUpdates> {
  const game = await GameRepo.find(gameId);
  if (!game) throw new Error(`invalid game ${gameId}`);
  if (game.state) throw new Error("game has already started");
  if (game.mode !== "player vs ai") throw new Error("game is not in player vs ai mode");
  if (game.aiType) throw new Error("an AI opponent has already been added");
  if (!game.players.some((id) => id === user.userId)) {
    throw new Error(`user ${user.username} is not in this game`);
  }

  game.aiType = aiType;
  await GameRepo.set(gameId, game);

  return startGame(gameId, user);
}

/**
 * Helper to expand a 2-entry player-views array to all club members.
 * The game service only knows about 2 representative players (one per club);
 * this expands the result so every joined club member gets the correct view.
 */
function expandViewsForClubs(
  views: GameViewUpdates,
  clubRosters: [string[], string[]],
): GameViewUpdates {
  return {
    watchers: views.watchers,
    players: [
      ...clubRosters[0].map((userId) => ({ userId, view: views.players[0].view })),
      ...clubRosters[1].map((userId) => ({ userId, view: views.players[1].view })),
    ],
  };
}

/**
 * Initializes a game that hasn't started yet
 *
 * @param gameId - Ostensible game id
 * @param user - Authenticated user
 * @returns the necessary views for everyone watching the game
 * @throws if the game id is not valid, if the game already started, or if the game lacks enough
 * players to start
 */
export async function startGame(gameId: string, user: UserWithId): Promise<GameViewUpdates> {
  const game = await GameRepo.find(gameId);
  if (!game) throw new Error(`user ${user.username} starting invalid game`);
  if (game.state) {
    throw new Error(`user ${user.username} starting game that started`);
  }

  const key: GameType = game.type;

  if (game.mode === "club vs club") {
    const [r0, r1]: [string[], string[]] = game.clubRosters ?? [[], []];
    const rosters: [string[], string[]] = [r0, r1];
    if (rosters[0].length === 0 || rosters[1].length === 0) {
      throw new Error(`user ${user.username} starting underpopulated game`);
    }
    if (!rosters[0].includes(user.userId) && !rosters[1].includes(user.userId)) {
      throw new Error(`user ${user.username} starting game they're not in`);
    }

    // Use one representative per club for the underlying 2-player game
    const repPlayers = [rosters[0][0], rosters[1][0]];
    const { state, views: rawViews } = gameServices[key].create(repPlayers);
    const views = expandViewsForClubs(rawViews, rosters);

    game.state = state;
    await GameRepo.set(gameId, game);
    return Promise.resolve(views);
  }

  const effectivePlayers = game.players.length + (game.aiType ? 1 : 0);
  if (effectivePlayers < gameServices[key].minPlayers) {
    throw new Error(`user ${user.username} starting underpopulated game`);
  }
  if (!game.players.some((userId) => userId === user.userId)) {
    throw new Error(`user ${user.username} starting game they're not in`);
  }
  let { state, views } = gameServices[key].create(game.players);

  // For player vs AI battleship: auto-place the AI's ships (player index 1)
  if (game.mode === "player vs ai" && game.type === "battleship") {
    const aiPlaceMove = { type: "place" as const, ships: randomAIPlacement() };
    const aiResult = gameServices[key].update(state, aiPlaceMove, 1, game.players);
    if (aiResult) {
      state = aiResult.state;
      views = aiResult.views;
    }
  }

  game.state = state;
  await GameRepo.set(gameId, game);

  return Promise.resolve(views);
}

/**
 * Get a list of all games
 *
 * @returns a list of game summaries, ordered reverse chronologically
 */
export async function getGames(): Promise<GameInfo[]> {
  const keys = await GameRepo.getAllKeys();
  const unsorted = await Promise.all(keys.map(populateGameInfo));

  return unsorted.toSorted((game1, game2) => game2.createdAt.getTime() - game1.createdAt.getTime());
}

/**
 * Represents the result of a game update, including view updates and the
 * move description suffix (the display name is prepended by the caller).
 */
export interface GameUpdateResult {
  views: GameViewUpdates;
  moveDescription: string;
  chatId: string;
}

/**
 * Updates a game state and returns the necessary view updates
 *
 * @param gameId - Ostensible game id
 * @param user - Authenticated user
 * @param move - Unsanitized game move
 * @returns the view updates and move description to send to players and watchers
 * @throws if the game id or move is not valid
 */
export async function updateGame(
  gameId: string,
  user: UserWithId,
  move: unknown,
): Promise<GameUpdateResult> {
  const game = await GameRepo.find(gameId);
  if (!game) throw new Error(`user ${user.username} acted on an invalid game`);
  if (!game.state) {
    throw new Error(`user ${user.username} made a move in game of that hadn't started`);
  }

  // Determine playerIndex and representative player list based on mode
  let playerIndex: number;
  let gamePlayers: string[];

  if (game.mode === "club vs club" && game.clubRosters) {
    const [cr0, cr1] = game.clubRosters;
    if (cr0.includes(user.userId)) {
      playerIndex = 0;
    } else if (cr1.includes(user.userId)) {
      playerIndex = 1;
    } else {
      throw new Error(`user ${user.username} made a move in a game they weren't playing`);
    }
    gamePlayers = [cr0[0], cr1[0]];
  } else {
    playerIndex = game.players.findIndex((userId) => userId === user.userId);
    if (playerIndex < 0) {
      throw new Error(`user ${user.username} made a move in a game they weren't playing`);
    }
    gamePlayers = game.players;
  }

  const result = gameServices[game.type].update(game.state, move, playerIndex, gamePlayers);
  if (!result) throw new Error(`user ${user.username} made an invalid move in ${game.type}`);

  let finalState = result.state;
  let finalViews =
    game.mode === "club vs club" && game.clubRosters
      ? expandViewsForClubs(result.views, game.clubRosters)
      : result.views;
  let finalDone = result.done;

  // For player vs AI battleship: auto-apply the AI's attack when it becomes the AI's turn
  if (game.mode === "player vs ai" && game.type === "battleship" && !result.done) {
    const bsState = finalState as BattleshipState;
    if (bsState.phase === "battle" && bsState.nextPlayer === 1) {
      const aiAttack =
        game.aiType === "hard"
          ? hardAIAttack(bsState.boards[0])
          : game.aiType === "medium"
            ? mediumAIAttack(bsState.boards[0])
            : randomAIAttack(bsState.boards[0]);
      const aiResult = gameServices[game.type].update(finalState, aiAttack, 1, game.players);
      if (aiResult) {
        finalState = aiResult.state;
        finalViews = aiResult.views;
        finalDone = finalDone || aiResult.done;
      }
    }
  }

  game.state = finalState;
  game.done = game.done || finalDone;
  if (finalDone) {
    const winners = result.winners; // club/player indices: [0] or [1] or []

    if (game.mode === "club vs club" && game.clubRosters) {
      const [wr0, wr1] = game.clubRosters;
      const winnerRosters: [string[], string[]] = [wr0, wr1];
      game.winners = winners.length === 0 ? [] : (winnerRosters[winners[0]] ?? []);
    } else {
      game.winners = winners
        .filter((index) => index < game.players.length)
        .map((index) => game.players[index]);
    }

    if (game.mode === "club vs club" && game.clubs && game.clubRosters) {
      const clubs = game.clubs;
      const [ar0, ar1] = game.clubRosters;
      const awardRosters: [string[], string[]] = [ar0, ar1];
      const winnerSet = new Set(game.winners);
      for (let clubIdx = 0; clubIdx < 2; clubIdx++) {
        const clubWon = awardRosters[clubIdx].some((uid) => winnerSet.has(uid));
        for (const userId of awardRosters[clubIdx]) {
          const points = clubWon ? 10 : 2;
          await awardPoints(userId, clubs[clubIdx], points);
        }
      }
    }
  }
  await GameRepo.set(gameId, game);

  return {
    views: finalViews,
    moveDescription: result.moveDescription,
    chatId: game.chat,
  };
}

/**
 * View a game as a specific user
 * @param gameId - Ostensible game id
 * @param user - Authenticated user
 * @returns A boolean for whether that user is a player, the player's view, and the list of players
 */
export async function viewGame(gameId: string, user: UserWithId) {
  const game = await GameRepo.find(gameId);
  if (!game) throw new Error(`user ${user.username} viewed an invalid game id`);

  let playerIndex: number;
  if (game.mode === "club vs club" && game.clubRosters) {
    const [vr0, vr1] = game.clubRosters;
    if (vr0.includes(user.userId)) playerIndex = 0;
    else if (vr1.includes(user.userId)) playerIndex = 1;
    else playerIndex = -1;
  } else {
    playerIndex = game.players.findIndex((userId) => userId === user.userId);
  }

  let view: TaggedGameView | null = null;
  if (game.state) {
    view = gameServices[game.type].view(game.state, playerIndex);
  }
  return {
    isPlayer: playerIndex >= 0,
    view,
    players: await Promise.all(game.players.map(populateSafeUserInfo)),
  };
}

/**
 * Invite another user to a game lobby.
 *
 * @param gameId - game id
 * @param inviterId - user id of the inviter (must already be in players[])
 * @param friendId - user id of the friend being invited
 */
export async function inviteToGame(
  gameId: string,
  inviterId: string,
  friendId: string,
): Promise<void> {
  const game = await GameRepo.find(gameId);
  if (!game) throw new Error("Game not found");

  // Only players in the game may invite others
  if (!game.players.includes(inviterId)) {
    throw new Error("Only players in the game can send invites");
  }

  // Lobby is full when we already have the maximum number of players
  if (game.players.length === gameServices[game.type].maxPlayers) {
    throw new Error("Lobby is full");
  }

  if (game.players.includes(friendId)) {
    throw new Error("User is already in the game");
  }
  if (game.invited?.includes(friendId)) {
    throw new Error("User has already been invited");
  }

  game.invited = [...(game.invited ?? []), friendId];
  await GameRepo.set(gameId, game);
}

/**
 * Get all games where a given user has been invited but is not yet a player.
 */
export async function getInvitedGames(userId: string): Promise<GameInfo[]> {
  const keys = await GameRepo.getAllKeys();
  const games = await GameRepo.getMany(keys);

  const invitedGameIds = keys.filter((_, index) => games[index].invited?.includes(userId));
  return Promise.all(invitedGameIds.map((id) => populateGameInfo(id)));
 * Build the GamePlayersInfo payload for gamePlayersUpdated socket events.
 */
export async function buildGamePlayersInfo(gameId: string): Promise<GamePlayersInfo> {
  const info = await populateGameInfo(gameId);
  return {
    players: info.players,
    clubRosters: info.clubRosters,
  };
}
