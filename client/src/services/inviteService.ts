import { api } from "./api";
import type { UserAuth } from "@gamenite/shared";

export const inviteFriendToGame = async (auth: UserAuth, gameId: string, friendId: string) => {
  const res = await api.post(`/api/game/invite`, {
    auth,
    payload: { gameId, friendId },
  });
  return res.data;
};

export const getInvitedGames = async (auth: UserAuth) => {
  try {
    const res = await api.get(`/api/game/invited`, { params: { username: auth.username } });
    return res.data.games ?? [];
  } catch (err) {
    return [];
  }
};
