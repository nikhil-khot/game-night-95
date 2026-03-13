import { beforeEach, describe, expect, it } from "vitest";
import {
  awardPoints,
  createClub,
  getClub,
  joinClub,
  listClubs,
  removeMember,
  setMemberRole,
} from "../../src/services/club.service.ts";
import { AuthRepo, ClubRepo } from "../../src/repository.ts";

beforeEach(async () => {
  await ClubRepo.clear();
});

describe("createClub/joinClub/list/get", () => {
  it("creates a club and allows another user to join", async () => {
    const created = await createClub("user1", "Alpha", "First club");
    expect(created).toMatchObject({
      name: "Alpha",
      description: "First club",
      members: [{ role: "owner", points: 0 }],
    });

    const joined = await joinClub("user2", "Alpha");
    expect(joined).toMatchObject({
      name: "Alpha",
      members: [{ role: "owner" }, { role: "member" }],
    });

    const listed = await listClubs();
    expect(listed).toHaveLength(1);

    const fetched = await getClub("Alpha");
    expect(fetched).toMatchObject({ name: "Alpha" });
  });

  it("rejects duplicate club names and joining unknown clubs", async () => {
    await createClub("user1", "Alpha", "First club");

    await expect(createClub("user3", "Alpha", "Duplicate")).resolves.toStrictEqual({
      error: 'A club named "Alpha" already exists',
    });

    await expect(joinClub("user2", "MissingClub")).resolves.toStrictEqual({
      error: 'Club "MissingClub" not found',
    });
  });

  it("prevents a user from being in multiple clubs", async () => {
    await createClub("user1", "Alpha", "First club");

    await expect(createClub("user1", "Beta", "Second club")).resolves.toStrictEqual({
      error: "You are already a member of a club",
    });

    await joinClub("user2", "Alpha");
    await createClub("user3", "Gamma", "Third club");

    await expect(joinClub("user2", "Gamma")).resolves.toStrictEqual({
      error: "You are already a member of a club",
    });
  });
});

describe("member moderation and roles", () => {
  it("enforces owner/admin role permissions", async () => {
    await createClub("user1", "Alpha", "First club");
    await joinClub("user2", "Alpha");
    await joinClub("user3", "Alpha");

    await expect(removeMember("user2", "user3", "Alpha")).resolves.toStrictEqual({
      error: "You do not have permission to remove members",
    });

    await expect(setMemberRole("user1", "user2", "Alpha", "admin")).resolves.toMatchObject({
      members: expect.any(Array),
    });

    await expect(removeMember("user2", "user1", "Alpha")).resolves.toStrictEqual({
      error: "Admins can only remove regular members",
    });

    await expect(removeMember("user2", "user3", "Alpha")).resolves.toMatchObject({
      members: expect.any(Array),
    });
  });

  it("allows only the owner to change roles and protects owner role", async () => {
    await createClub("user1", "Alpha", "First club");
    await joinClub("user2", "Alpha");

    await expect(setMemberRole("user2", "user1", "Alpha", "member")).resolves.toStrictEqual({
      error: "Only the owner can change member roles",
    });

    await expect(setMemberRole("user1", "user1", "Alpha", "admin")).resolves.toStrictEqual({
      error: "Cannot change the owner's role",
    });
  });
});

describe("awardPoints", () => {
  it("adds points for a club member and rejects non-members", async () => {
    await createClub("user1", "Alpha", "First club");

    const owner = await AuthRepo.find("user1");
    const stranger = await AuthRepo.find("user2");
    expect(owner).not.toBeNull();
    expect(stranger).not.toBeNull();

    const updated = await awardPoints(owner!.userId, "Alpha", 10);
    expect(updated).toMatchObject({
      members: [expect.objectContaining({ userId: owner!.userId, points: 10 })],
    });

    await expect(awardPoints(stranger!.userId, "Alpha", 5)).resolves.toStrictEqual({
      error: 'User is not a member of "Alpha"',
    });
  });
});
