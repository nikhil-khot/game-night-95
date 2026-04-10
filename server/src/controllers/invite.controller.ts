/* eslint no-console: "off" */
import { withAuth } from "@gamenite/shared";
import { z } from "zod";
import type { RestAPI } from "../types.ts";
import {
  cancelInviteToGame,
  declineInviteForUser,
  inviteToGame,
  getInvitedGames,
} from "../services/game.service.ts";
import { checkAuth, getUserByUsername } from "../services/auth.service.ts";

// POST /api/game/invite
export const postInvite: RestAPI = async (req, res) => {
  const body = withAuth(z.object({ gameId: z.string(), friendId: z.string() })).safeParse(req.body);
  if (!body.success) {
    console.error("[INVITE] Bad request body for /api/game/invite", {
      errors: body.error?.issues,
      rawBody: req.body,
    });
    res.status(400).send({ error: "Poorly-formed request" });
    return;
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
    res.status(403).send({ error: "Invalid credentials" });
    return;
  }
  try {
    await inviteToGame(gameId, user.userId, friendId);
    res.send({ success: true });
    return;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[INVITE] Error in inviteToGame", {
      gameId,
      inviterId: user.userId,
      friendId,
      error: message,
    });
    res.status(400).send({ error: message });
    return;
  }
};

// POST /api/game/invite/cancel
export const postCancelInvite: RestAPI = async (req, res) => {
  const body = withAuth(z.object({ gameId: z.string(), friendId: z.string() })).safeParse(req.body);
  if (!body.success) {
    console.error("[INVITE] Bad request body for /api/game/invite/cancel", {
      errors: body.error?.issues,
      rawBody: req.body,
    });
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }

  const {
    auth,
    payload: { gameId, friendId },
  } = body.data;

  const user = await checkAuth(auth);
  if (!user) {
    console.warn("[INVITE] Invalid credentials on /api/game/invite/cancel", {
      username: auth.username,
    });
    res.status(403).send({ error: "Invalid credentials" });
    return;
  }

  try {
    await cancelInviteToGame(gameId, user.userId, friendId);
    res.send({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[INVITE] Error in cancelInviteToGame", {
      gameId,
      inviterId: user.userId,
      friendId,
      error: message,
    });
    res.status(400).send({ error: message });
  }
};

// POST /api/game/invite/decline
export const postDeclineInvite: RestAPI = async (req, res) => {
  const body = withAuth(z.object({ gameId: z.string() })).safeParse(req.body);
  if (!body.success) {
    console.error("[INVITE] Bad request body for /api/game/invite/decline", {
      errors: body.error?.issues,
      rawBody: req.body,
    });
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }

  const {
    auth,
    payload: { gameId },
  } = body.data;

  const user = await checkAuth(auth);
  if (!user) {
    console.warn("[INVITE] Invalid credentials on /api/game/invite/decline", {
      username: auth.username,
    });
    res.status(403).send({ error: "Invalid credentials" });
    return;
  }

  try {
    await declineInviteForUser(gameId, user.userId);
    res.send({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[INVITE] Error in declineInviteForUser", {
      gameId,
      userId: user.userId,
      error: message,
    });
    res.status(400).send({ error: message });
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
