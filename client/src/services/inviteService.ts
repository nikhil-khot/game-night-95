import { api } from "./api.ts";
import type { GameInfo, UserAuth } from "@gamenite/shared";

export const inviteFriendToGame = async (
  auth: UserAuth,
  gameId: string,
  friendId: string,
): Promise<void> => {
  await api.post<{ success: boolean } | { error: string }>(`/api/game/invite`, {
    auth,
    payload: { gameId, friendId },
  });
};

export const getInvitedGames = async (auth: UserAuth): Promise<GameInfo[]> => {
  try {
    const res = await api.get<{ games: GameInfo[] }>(`/api/game/invited`, {
      params: { username: auth.username },
    });
    return res.data.games ?? [];
  } catch {
    return [];
  }
};
