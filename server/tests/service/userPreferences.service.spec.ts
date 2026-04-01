import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { getUserByUsername } from "../../src/services/auth.service.ts";
import {
  createDefaultUserPreferences,
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

    const updated2 = await updateUserPreferences(user!.userId, {});
    expect(updated2).toStrictEqual({
      userId: user!.userId,
      theme: "dark",
      fontSize: "medium",
      updatedAt: expect.anything(),
    });

    const loaded = await getUserPreferences(user!.userId);
    expect(loaded).toStrictEqual(updated2);
  });
});

describe("updateUserPreferences additional tests", () => {
  it("handles updates with only valid fields", async () => {
    const user = await getUserByUsername("user2");
    expect(user).not.toBeNull();

    const updates: { theme: "dark"; fontSize: "large" } = { theme: "dark", fontSize: "large" };
    const updated = await updateUserPreferences(user!.userId, updates);

    expect(updated).toStrictEqual({
      userId: user!.userId,
      theme: "dark",
      fontSize: "large",
      updatedAt: expect.anything(),
    });
  });

  it("does not modify preferences when updates are empty", async () => {
    const user = await getUserByUsername("user2");
    expect(user).not.toBeNull();

    const updated = await updateUserPreferences(user!.userId, {});

    expect(updated).toStrictEqual({
      userId: user!.userId,
      theme: "light", // Default value
      fontSize: "medium", // Default value
      updatedAt: expect.anything(),
    });
  });
});

describe("updateUserPreferences edge cases", () => {
  it("throws an error when updating preferences for an invalid user", async () => {
    await expect(
      updateUserPreferences(randomUUID().toString(), { theme: "dark" }),
    ).rejects.toThrow();
  });

  it("handles empty updates gracefully", async () => {
    const user = await getUserByUsername("user3");
    expect(user).not.toBeNull();

    const updated = await updateUserPreferences(user!.userId, {});
    expect(updated).toStrictEqual({
      userId: user!.userId,
      theme: "light", // Default value
      fontSize: "medium", // Default value
      updatedAt: expect.anything(),
    });
  });
});

describe("createDefaultUserPreferences", () => {
  it("assigns default preferences correctly", async () => {
    const userId = randomUUID();
    const defaultPrefs = await createDefaultUserPreferences(userId);

    expect(defaultPrefs).toStrictEqual({
      userId,
      theme: "light",
      fontSize: "medium",
      updatedAt: expect.any(String),
    });
  });
});
