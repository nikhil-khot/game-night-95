import { randomUUID } from "node:crypto";
import { describe, expect, it, beforeEach } from "vitest";
import { enforceAuth } from "../../src/services/auth.service.ts";
import { createUser } from "../../src/services/user.service.ts";
import {
  addAIToGame,
  createGame,
  getGameById,
  getGames,
  joinGame,
  startGame,
  updateGame,
  viewGame,
} from "../../src/services/game.service.ts";
import { GameRepo, ClubRepo } from "../../src/repository.ts";
import { createClub, joinClub } from "../../src/services/club.service.ts";
import { randomAIPlacement } from "../../src/games/battleship.ts";

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

describe("createGame", () => {
  it("creates a basic player vs player game", async () => {
    const user1 = await enforceAuth({ username: "user1", password: "pwd1111" });
    const game = await createGame(user1, "nim", "player vs player", new Date());
    expect(game.type).toBe("nim");
    expect(game.mode).toBe("player vs player");
    expect(game.status).toBe("waiting");
    expect(game.players.map((p) => p.username)).toContain("user1");
  });

  it("throws for club vs club without an opponent club specified", async () => {
    const user1 = await enforceAuth({ username: "user1", password: "pwd1111" });
    await expect(createGame(user1, "nim", "club vs club", new Date())).rejects.toThrow(
      "require an opponent club",
    );
  });

  it("throws for club vs club when creator is not in a club", async () => {
    const user1 = await enforceAuth({ username: "user1", password: "pwd1111" });
    await expect(createGame(user1, "nim", "club vs club", new Date(), "SomeClub")).rejects.toThrow(
      "must be in a club",
    );
  });

  describe("club vs club", () => {
    beforeEach(async () => {
      await ClubRepo.clear();
    });

    it("throws for club vs club when both clubs are the same", async () => {
      const user1 = await enforceAuth({ username: "user1", password: "pwd1111" });
      await createClub("user1", "Alpha", "test");
      await expect(createGame(user1, "nim", "club vs club", new Date(), "Alpha")).rejects.toThrow(
        "two different clubs",
      );
    });

    it("creates a club vs club game successfully", async () => {
      const user1 = await enforceAuth({ username: "user1", password: "pwd1111" });
      await createClub("user1", "Alpha", "test");
      await createClub("user2", "Beta", "test");
      const game = await createGame(user1, "nim", "club vs club", new Date(), "Beta");
      expect(game.mode).toBe("club vs club");
      expect(game.status).toBe("waiting");
    });
  });
});

describe("addAIToGame", () => {
  it("throws for an invalid game id", async () => {
    const user1 = await enforceAuth({ username: "user1", password: "pwd1111" });
    await expect(addAIToGame(randomUUID(), user1, "easy")).rejects.toThrow("invalid game");
  });

  it("throws if the game has already started", async () => {
    const user1 = await enforceAuth({ username: "user1", password: "pwd1111" });
    const activeGuessId = await getSeededGameId("guess", "active");
    await expect(addAIToGame(activeGuessId, user1, "easy")).rejects.toThrow("already started");
  });

  it("throws if the game mode is not player vs ai", async () => {
    const user1 = await enforceAuth({ username: "user1", password: "pwd1111" });
    const waitingNimId = await getSeededGameId("nim", "waiting");
    await expect(addAIToGame(waitingNimId, user1, "easy")).rejects.toThrow(
      "not in player vs ai mode",
    );
  });

  it("throws if the user is not in the game", async () => {
    const user1 = await enforceAuth({ username: "user1", password: "pwd1111" });
    const user2 = await enforceAuth({ username: "user2", password: "pwd2222" });
    const game = await createGame(user1, "battleship", "player vs ai", new Date());
    await expect(addAIToGame(game.gameId, user2, "easy")).rejects.toThrow("not in this game");
  });

  it("throws if an AI opponent has already been added", async () => {
    const user1 = await enforceAuth({ username: "user1", password: "pwd1111" });
    const game = await createGame(user1, "battleship", "player vs ai", new Date());
    const record = await GameRepo.find(game.gameId);
    await GameRepo.set(game.gameId, { ...record!, aiType: "easy" });
    await expect(addAIToGame(game.gameId, user1, "easy")).rejects.toThrow(
      "AI opponent has already been added",
    );
  });

  it("succeeds and starts a battleship player vs easy AI game", async () => {
    const user1 = await enforceAuth({ username: "user1", password: "pwd1111" });
    const game = await createGame(user1, "battleship", "player vs ai", new Date());
    const views = await addAIToGame(game.gameId, user1, "easy");
    expect(views.players).toHaveLength(1);
    expect(views.watchers.type).toBe("battleship");
  });

  it("succeeds and starts a battleship player vs medium AI game", async () => {
    const user1 = await enforceAuth({ username: "user1", password: "pwd1111" });
    const game = await createGame(user1, "battleship", "player vs ai", new Date());
    const views = await addAIToGame(game.gameId, user1, "medium");
    expect(views.players).toHaveLength(1);
    expect(views.watchers.type).toBe("battleship");
  });

  it("succeeds and starts a battleship player vs hard AI game", async () => {
    const user1 = await enforceAuth({ username: "user1", password: "pwd1111" });
    const game = await createGame(user1, "battleship", "player vs ai", new Date());
    const views = await addAIToGame(game.gameId, user1, "hard");
    expect(views.players).toHaveLength(1);
    expect(views.watchers.type).toBe("battleship");
  });
});

describe("joinGame - AI and club vs club cases", () => {
  it("throws when the game already has an AI opponent", async () => {
    const user1 = await enforceAuth({ username: "user1", password: "pwd1111" });
    const user2 = await enforceAuth({ username: "user2", password: "pwd2222" });
    const game = await createGame(user1, "battleship", "player vs ai", new Date());
    const record = await GameRepo.find(game.gameId);
    await GameRepo.set(game.gameId, { ...record!, aiType: "easy" });
    await expect(joinGame(game.gameId, user2)).rejects.toThrow("already has an AI opponent");
  });

  describe("club vs club join", () => {
    beforeEach(async () => {
      await ClubRepo.clear();
    });

    it("throws when the joining user is not in either participating club", async () => {
      const user1 = await enforceAuth({ username: "user1", password: "pwd1111" });
      const user2 = await enforceAuth({ username: "user2", password: "pwd2222" });
      await createClub("user1", "Alpha", "test");
      await createClub("user3", "Beta", "test");
      const game = await createGame(user1, "nim", "club vs club", new Date(), "Beta");
      await expect(joinGame(game.gameId, user2)).rejects.toThrow(
        "is not a member of either participating club",
      );
    });

    it("succeeds when the joining user is in the opponent club", async () => {
      const user1 = await enforceAuth({ username: "user1", password: "pwd1111" });
      const user2 = await enforceAuth({ username: "user2", password: "pwd2222" });
      await createClub("user1", "Alpha", "test");
      await createClub("user3", "Beta", "test");
      await joinClub("user2", "Beta");
      const game = await createGame(user1, "nim", "club vs club", new Date(), "Beta");
      const joined = await joinGame(game.gameId, user2);
      expect(joined.players).toHaveLength(2);
    });
  });
});

describe("updateGame - player vs AI battleship", () => {
  async function setupBattleshipVsAI(aiType: string) {
    const user1 = await enforceAuth({ username: "user1", password: "pwd1111" });
    const game = await createGame(user1, "battleship", "player vs ai", new Date());
    await addAIToGame(game.gameId, user1, aiType);
    // Human places ships; AI already placed in startGame via addAIToGame
    await updateGame(game.gameId, user1, { type: "place", ships: randomAIPlacement() });
    return { gameId: game.gameId, user1 };
  }

  it("auto-applies easy AI attack after player fires", async () => {
    const { gameId, user1 } = await setupBattleshipVsAI("easy");
    const result = await updateGame(gameId, user1, [0, 0]);
    expect(result.views.watchers.type).toBe("battleship");
  });

  it("auto-applies medium AI attack after player fires", async () => {
    const { gameId, user1 } = await setupBattleshipVsAI("medium");
    const result = await updateGame(gameId, user1, [0, 0]);
    expect(result.views.watchers.type).toBe("battleship");
  });

  it("auto-applies hard AI attack after player fires", async () => {
    const { gameId, user1 } = await setupBattleshipVsAI("hard");
    const result = await updateGame(gameId, user1, [0, 0]);
    expect(result.views.watchers.type).toBe("battleship");
  });
});

describe("updateGame - club vs club completion", () => {
  beforeEach(async () => {
    await ClubRepo.clear();
  });

  it("awards points to both clubs when a club vs club nim game ends", async () => {
    const user1 = await enforceAuth({ username: "user1", password: "pwd1111" });
    const user2 = await enforceAuth({ username: "user2", password: "pwd2222" });

    await createClub("user1", "Alpha", "test");
    await createClub("user3", "Beta", "test");
    await joinClub("user2", "Beta");

    const game = await createGame(user1, "nim", "club vs club", new Date(), "Beta");
    await joinGame(game.gameId, user2);
    await startGame(game.gameId, user1);

    // Play nim to completion: take 3 each turn, 7 turns total.
    // Player who takes the last token loses; player 0 (user1) takes last → user2 wins.
    for (let i = 0; i < 6; i++) {
      const mover = i % 2 === 0 ? user1 : user2;
      await updateGame(game.gameId, mover, 3);
    }
    const finalResult = await updateGame(game.gameId, user1, 3);
    expect(finalResult.views.watchers.type).toBe("nim");

    const finished = await getGameById(game.gameId);
    expect(finished?.status).toBe("done");
    expect(finished?.winners.map((w) => w.username)).toContain("user2");
  });
});
