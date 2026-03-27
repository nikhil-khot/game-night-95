import {
  type BattleshipState,
  type GameInfo,
  type GameMode,
  type GameType,
  type TaggedGameView,
} from "@gamenite/shared";
import { createChat } from "./chat.service.ts";
import { populateSafeUserInfo } from "./user.service.ts";
import { type GameServicer } from "../games/gameServiceManager.ts";
import { nimGameService } from "../games/nim.ts";
import { guessGameService } from "../games/guess.ts";
import { battleshipGameService, randomAIAttack, randomAIPlacement } from "../games/battleship.ts";
import { type GameViewUpdates, type UserWithId } from "../types.ts";
import { GameRepo } from "../repository.ts";

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
): Promise<GameInfo> {
  const chat = await createChat(createdAt);
  const gameId = await GameRepo.add({
    type,
    mode,
    done: false,
    chat: chat.chatId,
    createdAt: createdAt.toISOString(),
    createdBy: user.userId,
    players: [user.userId],
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
 * Adds a user to a game that hasn't started yet. If the resulting game object has the maximum
 * allowed number of players, it is the responsibility of the caller to start the game.
 *
 * @param gameId - Ostensible game id
 * @param user - Authenticated user
 * @returns the game's info object, with the `user` listed among the players
 * @throws if the game id is not valid, if the game has started, or if the game cannot accept more
 * players
 */
export async function joinGame(gameId: string, user: UserWithId): Promise<GameInfo> {
  const game = await GameRepo.find(gameId);
  if (!game) throw new Error(`user ${user.username} joining invalid game`);
  if (game.state) {
    throw new Error(`user ${user.username} joining game that started`);
  }
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

  if (game.players.length < gameServices[key].minPlayers) {
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
  const playerIndex = game.players.findIndex((userId) => userId === user.userId);
  if (playerIndex < 0) {
    throw new Error(`user ${user.username} made a move in a game they weren't playing`);
  }
  const result = gameServices[game.type].update(game.state, move, playerIndex, game.players);
  if (!result) throw new Error(`user ${user.username} made an invalid move in ${game.type}`);

  let finalState = result.state;
  let finalViews = result.views;
  let finalDone = result.done;

  // For player vs AI battleship: auto-apply the AI's attack when it becomes the AI's turn
  if (game.mode === "player vs ai" && game.type === "battleship" && !result.done) {
    const bsState = finalState as BattleshipState;
    if (bsState.phase === "battle" && bsState.nextPlayer === 1) {
      const aiAttack = randomAIAttack(bsState.boards[0]);
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
  const playerIndex = game.players.findIndex((userId) => userId === user.userId);
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
