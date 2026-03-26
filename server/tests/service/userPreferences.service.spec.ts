import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { getUserByUsername } from "../../src/services/auth.service.ts";
import {
  getOrCreateUserPreferences,
  getUserPreferences,
  updateUserPreferences,
} from "../../src/services/userPreferences.service.ts";

describe("getOrCreateUserPreferences", () => {
  it("returns defaults for a valid user", async () => {
    const user = await getUserByUsername("user1");
    expect(user).not.toBeNull();

    const prefs = await getOrCreateUserPreferences(user!.userId);
    expect(prefs).toStrictEqual({
      userId: user!.userId,
      theme: "light",
      fontSize: "medium",
      updatedAt: expect.anything(),
    });
  });

  it("throws for an invalid user", async () => {
    await expect(getOrCreateUserPreferences(randomUUID().toString())).rejects.toThrow();
  });
});

describe("updateUserPreferences", () => {
  it("applies partial updates without dropping existing fields", async () => {
    const user = await getUserByUsername("user2");
    expect(user).not.toBeNull();

    const updated1 = await updateUserPreferences(user!.userId, { theme: "dark" });
    expect(updated1).toStrictEqual({
      userId: user!.userId,
      theme: "dark",
      fontSize: "medium",
      updatedAt: expect.anything(),
    });

    const updated2 = await updateUserPreferences(user!.userId, {
      banner: { imageUrl: "https://example.com/b.png", position: "top" },
    });
    expect(updated2).toStrictEqual({
      userId: user!.userId,
      theme: "dark",
      fontSize: "medium",
      banner: { imageUrl: "https://example.com/b.png", position: "top" },
      updatedAt: expect.anything(),
    });

    const loaded = await getUserPreferences(user!.userId);
    expect(loaded).toStrictEqual(updated2);
  });
});
