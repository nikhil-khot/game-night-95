import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { enforceAuth } from "../../src/services/auth.service.ts";
import { createUser } from "../../src/services/user.service.ts";
import {
  getGameById,
  getGames,
  joinGame,
  startGame,
  updateGame,
  viewGame,
} from "../../src/services/game.service.ts";

async function getSeededGameId(type: "nim" | "guess", status: "waiting" | "active" | "done") {
  const games = await getGames();
  const game = games.find((g) => g.type === type && g.status === status);
  expect(game).toBeTruthy();
  return game!.gameId;
}

describe("game.service", () => {
  it("returns null for unknown game ids", async () => {
    await expect(getGameById(randomUUID().toString())).resolves.toBeNull();
  });

  it("handles joinGame success and errors", async () => {
    const user1 = await enforceAuth({ username: "user1", password: "pwd1111" });
    const user2 = await enforceAuth({ username: "user2", password: "pwd2222" });

    const waitingNimId = await getSeededGameId("nim", "waiting");
    const activeGuessId = await getSeededGameId("guess", "active");

    await expect(joinGame(activeGuessId, user2)).rejects.toThrow("joining game that started");
    await expect(joinGame(waitingNimId, user1)).rejects.toThrow("joining game they are in already");

    const joined = await joinGame(waitingNimId, user2);
    expect(joined.players.map((p) => p.username)).toContain("user2");

    await createUser("user4", "pwd4444", new Date());
    const user4 = await enforceAuth({ username: "user4", password: "pwd4444" });
    await expect(joinGame(waitingNimId, user4)).rejects.toThrow("joining full");
  });

  it("handles startGame success and errors", async () => {
    const user1 = await enforceAuth({ username: "user1", password: "pwd1111" });
    const user2 = await enforceAuth({ username: "user2", password: "pwd2222" });
    const user3 = await enforceAuth({ username: "user3", password: "pwd3333" });

    const waitingNimId = await getSeededGameId("nim", "waiting");

    await expect(startGame(waitingNimId, user1)).rejects.toThrow("underpopulated");

    await joinGame(waitingNimId, user2);
    await expect(startGame(waitingNimId, user3)).rejects.toThrow("not in");

    const views = await startGame(waitingNimId, user1);
    expect(views.players).toHaveLength(2);
    expect(views.watchers.type).toBe("nim");

    await expect(startGame(waitingNimId, user1)).rejects.toThrow("starting game that started");
  });

  it("handles updateGame success and errors", async () => {
    const user1 = await enforceAuth({ username: "user1", password: "pwd1111" });
    const user2 = await enforceAuth({ username: "user2", password: "pwd2222" });

    const waitingNimId = await getSeededGameId("nim", "waiting");
    const activeGuessId = await getSeededGameId("guess", "active");

    await expect(updateGame(randomUUID().toString(), user1, 1)).rejects.toThrow("invalid game");
    await expect(updateGame(waitingNimId, user1, 1)).rejects.toThrow("hadn't started");

    await createUser("user4", "pwd4444", new Date());
    const user4 = await enforceAuth({ username: "user4", password: "pwd4444" });
    await expect(updateGame(activeGuessId, user4, 10)).rejects.toThrow("weren't playing");

    await expect(updateGame(activeGuessId, user1, 101)).rejects.toThrow("invalid move");

    const okMove = await updateGame(activeGuessId, user1, 50);
    expect(okMove.views.watchers.type).toBe("guess");
    expect(okMove.moveDescription).toBeTruthy();

    const lastMove = await updateGame(activeGuessId, user2, 42);
    expect(lastMove.chatId).toBeTruthy();

    const finished = await getGameById(activeGuessId);
    expect(finished?.status).toBe("done");
  });

  it("handles viewGame for waiting and active games", async () => {
    const user1 = await enforceAuth({ username: "user1", password: "pwd1111" });

    await createUser("user4", "pwd4444", new Date());
    const user4 = await enforceAuth({ username: "user4", password: "pwd4444" });

    const waitingNimId = await getSeededGameId("nim", "waiting");
    const activeGuessId = await getSeededGameId("guess", "active");

    await expect(viewGame(randomUUID().toString(), user1)).rejects.toThrow("invalid game id");

    const waitingView = await viewGame(waitingNimId, user1);
    expect(waitingView.isPlayer).toBe(true);
    expect(waitingView.view).toBeNull();

    const watcherView = await viewGame(activeGuessId, user4);
    expect(watcherView.isPlayer).toBe(false);
    expect(watcherView.view).toMatchObject({ type: "guess" });
  });
});
