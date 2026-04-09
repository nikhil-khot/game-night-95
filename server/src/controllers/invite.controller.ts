/* eslint no-console: "off" */
import { withAuth } from "@gamenite/shared";
import { z } from "zod";
import type { RestAPI } from "../types.ts";
import { inviteToGame, getInvitedGames } from "../services/game.service.ts";
import { checkAuth, getUserByUsername } from "../services/auth.service.ts";

// POST /api/game/invite
export const postInvite: RestAPI = async (req, res) => {
  const body = withAuth(z.object({ gameId: z.string(), friendId: z.string() })).safeParse(req.body);
  if (body.error) {
    console.error("[INVITE] Bad request body for /api/game/invite", {
      errors: body.error.issues,
      rawBody: req.body,
    });
    return res.status(400).send({ error: "Poorly-formed request" });
  }

  const {
    auth,
    payload: { gameId, friendId },
  } = body.data;

  const user = await checkAuth(auth);
  if (!user) {
    console.warn("[INVITE] Invalid credentials on /api/game/invite", {
      username: auth.username,
    });
    return res.status(403).send({ error: "Invalid credentials" });
  }
  try {
    await inviteToGame(gameId, user.userId, friendId);
    res.send({ success: true });
  } catch (e) {
    console.error("[INVITE] Error in inviteToGame", {
      gameId,
      inviterId: user.userId,
      friendId,
      error: e instanceof Error ? e.message : e,
    });
    res.status(400).send({ error: e.message });
  }
};

// GET /api/game/invited
export const getInvited: RestAPI = async (req, res) => {
  // For simplicity, use the username query parameter and look up the user
  const username = typeof req.query.username === "string" ? req.query.username : undefined;
  if (!username) {
    console.error("[INVITE] Missing username on /api/game/invited", {
      query: req.query,
    });
    // Treat missing username as "no invited games" rather than an error
    res.send({ games: [] });
    return;
  }
  const user = await getUserByUsername(username);
  if (!user) {
    console.warn("[INVITE] User not found for /api/game/invited; returning empty list", {
      username,
    });
    // If the user doesn't exist in auth, just return an empty list
    // so the client can treat this as "no invited games".
    res.send({ games: [] });
    return;
  }
  console.log("[INVITE] Fetching invited games", { username, userId: user.userId });
  const games = await getInvitedGames(user.userId);
  res.send({ games });
};
