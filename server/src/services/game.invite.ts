import { GameRepo } from "../repository";
import type { RecordId } from "../models";

export async function inviteToGame(gameId: string, inviterId: RecordId, friendId: RecordId) {
  const game = await GameRepo.find(gameId);
  if (!game) throw new Error("Game not found");
  if (game.players.length >= 4) throw new Error("Lobby is full");
  if (game.invited?.includes(friendId) || game.players.includes(friendId))
    throw new Error("User already invited or in game");
  game.invited = [...(game.invited || []), friendId];
  await GameRepo.set(gameId, game);
}

export async function getInvitedGames(userId: RecordId) {
  const allGames = await GameRepo.all();
  return allGames.filter((g) => g.invited?.includes(userId));
}
