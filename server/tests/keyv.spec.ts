import { createRepo, setDbInitializer } from "../src/keyv.ts";
import { Keyv } from "keyv";
import { describe, it, expect, beforeEach } from "vitest";

describe("Keyv Repository", () => {
  beforeEach(() => {
    setDbInitializer((name: string) => new Keyv({ namespace: name }));
  });

  it("should add a value and return its key", async () => {
    const repo = createRepo("test-repo");
    const key = await repo.add("test-value");
    expect(typeof key).toBe("string");
  });

  it("should set and retrieve a value", async () => {
    const repo = createRepo("test-repo");
    await repo.set("test-key", "test-value");
    const value = await repo.get("test-key");
    expect(value).toBe("test-value");
  });

  it("should retrieve multiple values", async () => {
    const repo = createRepo("test-repo");
    await repo.set("key1", "value1");
    await repo.set("key2", "value2");
    const values = await repo.getMany(["key1", "key2"]);
    expect(values).toEqual(["value1", "value2"]);
  });

  it("should return all keys", async () => {
    const repo = createRepo("test-repo");
    await repo.set("key1", "value1");
    await repo.set("key2", "value2");
    const keys = await repo.getAllKeys();
    expect(keys).toEqual(expect.arrayContaining(["key1", "key2"]));
  });

  it("should clear all values", async () => {
    const repo = createRepo("test-repo");
    await repo.set("key1", "value1");
    await repo.clear();
    const keys = await repo.getAllKeys();
    expect(keys).toHaveLength(0);
  });
});
