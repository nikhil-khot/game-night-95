import { ClubRepo } from "../repository.ts";
import { getUserByUsername } from "./auth.service.ts";
import type { ClubMember, ClubRecord, ClubRole } from "../models.ts";
/**
 * Returns all clubs and their repo keys.
 */
async function getAllClubs(): Promise<{ key: string; record: ClubRecord }[]> {
  const allKeys = await ClubRepo.getAllKeys();
  const allRecords = await ClubRepo.getMany(allKeys);
  return allKeys.map((key, i) => ({ key, record: allRecords[i] }));
}

/**
 * Finds a club by its name.
 */
async function findClubByName(name: string): Promise<{ key: string; record: ClubRecord } | null> {
  const all = await getAllClubs();
  return all.find(({ record }) => record.name === name) ?? null;
}

/**
 * Returns the deterministic chat room id for a club.
 */
export function getClubChatId(clubName: string): string {
  return `club:${clubName}`;
}

/**
 * Finds which club (if any) a userId currently belongs to.
 */
async function findClubForUser(
  userId: string,
): Promise<{ key: string; record: ClubRecord } | null> {
  const all = await getAllClubs();
  return all.find(({ record }) => record.members.some((m) => m.userId === userId)) ?? null;
}

/**
 * Returns the ClubMember entry for a userId within a given ClubRecord, or null.
 */
function getMemberEntry(record: ClubRecord, userId: string): ClubMember | null {
  return record.members.find((m) => m.userId === userId) ?? null;
}

/**
 * Returns true if the given role has moderation privileges (can remove members).
 */
function canModerate(role: ClubRole): boolean {
  return role === "owner" || role === "admin";
}

/**
 * Creates a new club with the given user as the owner.
 *
 * @param ownerUsername - The username of the user creating the club
 * @param name - The desired club name (must be unique)
 * @param description - A short bio or description for the club
 * @returns The created ClubRecord, or an error message
 */
export async function createClub(
  ownerUsername: string,
  name: string,
  description: string,
): Promise<ClubRecord | { error: string }> {
  const owner = await getUserByUsername(ownerUsername);
  if (!owner) return { error: `User ${ownerUsername} not found` };

  const existingClub = await findClubForUser(owner.userId);
  if (existingClub) return { error: "You are already a member of a club" };

  const nameConflict = await findClubByName(name);
  if (nameConflict) return { error: `A club named "${name}" already exists` };

  const now = new Date().toISOString();
  const record: ClubRecord = {
    name,
    description,
    members: [{ userId: owner.userId, role: "owner", points: 0, joinedAt: now }],
    createdAt: now,
  };

  await ClubRepo.add(record);
  return record;
}

/**
 * Adds a user to an existing club.
 *
 * @param username - The username of the user joining
 * @param clubName - The name of the club to join
 * @returns The updated ClubRecord, or an error message
 */
export async function joinClub(
  username: string,
  clubName: string,
): Promise<ClubRecord | { error: string }> {
  const user = await getUserByUsername(username);
  if (!user) return { error: `User ${username} not found` };

  const existingClub = await findClubForUser(user.userId);
  if (existingClub) return { error: "You are already a member of a club" };

  const club = await findClubByName(clubName);
  if (!club) return { error: `Club "${clubName}" not found` };

  const updated: ClubRecord = {
    ...club.record,
    members: [
      ...club.record.members,
      { userId: user.userId, role: "member", points: 0, joinedAt: new Date().toISOString() },
    ],
  };

  await ClubRepo.set(club.key, updated);
  return updated;
}

/**
 * Allows a user to leave a club they are a member of.
 * The owner cannot leave their own club.
 *
 * @param username - The username of the user leaving
 * @param clubName - The name of the club to leave
 * @returns The updated ClubRecord, or an error message
 */
export async function leaveClub(
  username: string,
  clubName: string,
): Promise<ClubRecord | { error: string }> {
  const user = await getUserByUsername(username);
  if (!user) return { error: `User ${username} not found` };

  const club = await findClubByName(clubName);
  if (!club) return { error: `Club "${clubName}" not found` };

  const memberEntry = getMemberEntry(club.record, user.userId);
  if (!memberEntry) return { error: `You are not a member of "${clubName}"` };
  if (memberEntry.role === "owner") return { error: "The owner cannot leave their own club" };

  const updated: ClubRecord = {
    ...club.record,
    members: club.record.members.filter((m) => m.userId !== user.userId),
  };

  await ClubRepo.set(club.key, updated);
  return updated;
}

/**
 * Removes a member from a club.
 * Only the owner or an admin can remove members.
 * Admins cannot remove other admins or the owner.
 *
 * @param actorUsername - The username of the user performing the removal
 * @param targetUsername - The username of the user being removed
 * @param clubName - The name of the club
 * @returns The updated ClubRecord, or an error message
 *
 * @todo Decide what happens if the owner removes themselves (club deletion vs. ownership transfer)
 */
export async function removeMember(
  actorUsername: string,
  targetUsername: string,
  clubName: string,
): Promise<ClubRecord | { error: string }> {
  const actor = await getUserByUsername(actorUsername);
  const target = await getUserByUsername(targetUsername);
  if (!actor) return { error: `User ${actorUsername} not found` };
  if (!target) return { error: `User ${targetUsername} not found` };

  const club = await findClubByName(clubName);
  if (!club) return { error: `Club "${clubName}" not found` };

  const actorEntry = getMemberEntry(club.record, actor.userId);
  const targetEntry = getMemberEntry(club.record, target.userId);
  if (!actorEntry) return { error: `${actorUsername} is not a member of this club` };
  if (!targetEntry) return { error: `${targetUsername} is not a member of this club` };

  if (!canModerate(actorEntry.role))
    return { error: "You do not have permission to remove members" };
  if (actorEntry.role === "admin" && targetEntry.role !== "member") {
    return { error: "Admins can only remove regular members" };
  }

  const updated: ClubRecord = {
    ...club.record,
    members: club.record.members.filter((m) => m.userId !== target.userId),
  };

  await ClubRepo.set(club.key, updated);
  return updated;
}

/**
 * Deletes a club. Only the owner can delete their club.
 *
 * @param ownerUsername - The username of the user requesting deletion
 * @param clubName - The name of the club to delete
 * @returns { success: true } or error
 */
export async function deleteClub(
  ownerUsername: string,
  clubName: string,
): Promise<{ success: true } | { error: string }> {
  const owner = await getUserByUsername(ownerUsername);
  if (!owner) return { error: `User ${ownerUsername} not found` };

  const club = await findClubByName(clubName);
  if (!club) return { error: `Club "${clubName}" not found` };

  const ownerEntry = getMemberEntry(club.record, owner.userId);
  if (!ownerEntry || ownerEntry.role !== "owner") {
    return { error: "Only the owner can delete the club" };
  }

  await ClubRepo.delete(club.key);
  return { success: true };
}

/**
 * Promotes a member to admin, or demotes an admin back to member.
 * Only the owner can change roles.
 *
 * @param ownerUsername - The username of the club owner
 * @param targetUsername - The username of the member whose role is changing
 * @param clubName - The name of the club
 * @param newRole - Either "admin" or "member"
 * @returns The updated ClubRecord, or an error message
 */
export async function setMemberRole(
  ownerUsername: string,
  targetUsername: string,
  clubName: string,
  newRole: Extract<ClubRole, "admin" | "member">,
): Promise<ClubRecord | { error: string }> {
  const owner = await getUserByUsername(ownerUsername);
  const target = await getUserByUsername(targetUsername);
  if (!owner) return { error: `User ${ownerUsername} not found` };
  if (!target) return { error: `User ${targetUsername} not found` };

  const club = await findClubByName(clubName);
  if (!club) return { error: `Club "${clubName}" not found` };

  const ownerEntry = getMemberEntry(club.record, owner.userId);
  const targetEntry = getMemberEntry(club.record, target.userId);
  if (!ownerEntry || ownerEntry.role !== "owner")
    return { error: "Only the owner can change member roles" };
  if (!targetEntry) return { error: `${targetUsername} is not a member of this club` };
  if (targetEntry.role === "owner") return { error: "Cannot change the owner's role" };

  const updated: ClubRecord = {
    ...club.record,
    members: club.record.members.map((m) =>
      m.userId === target.userId ? { ...m, role: newRole } : m,
    ),
  };

  await ClubRepo.set(club.key, updated);
  return updated;
}

/**
 * Retrieves all clubs as a list.
 *
 * @returns An array of all ClubRecords
 */
export async function listClubs(): Promise<ClubRecord[]> {
  const all = await getAllClubs();
  return all.map(({ record }) => record);
}

/**
 * Retrieves a single club by name.
 *
 * @param clubName - The name of the club
 * @returns The ClubRecord, or an error message
 */
export async function getClub(clubName: string): Promise<ClubRecord | { error: string }> {
  const club = await findClubByName(clubName);
  if (!club) return { error: `Club "${clubName}" not found` };
  return club.record;
}

/**
 * Checks whether a user is a member of a given club.
 */
export async function isClubMember(username: string, clubName: string): Promise<boolean> {
  const user = await getUserByUsername(username);
  if (!user) return false;

  const club = await findClubByName(clubName);
  if (!club) return false;

  return club.record.members.some((member) => member.userId === user.userId);
}

/**
 * Adds leaderboard points to a club member.
 *
 * @param userId - The userId to award points to
 * @param clubName - The name of the club
 * @param points - The number of points to add (can be negative to deduct)
 * @returns The updated ClubRecord, or an error message
 */
export async function awardPoints(
  userId: string,
  clubName: string,
  points: number,
): Promise<ClubRecord | { error: string }> {
  const club = await findClubByName(clubName);
  if (!club) return { error: `Club "${clubName}" not found` };

  const memberEntry = getMemberEntry(club.record, userId);
  if (!memberEntry) return { error: `User is not a member of "${clubName}"` };

  const updated: ClubRecord = {
    ...club.record,
    members: club.record.members.map((m) =>
      m.userId === userId ? { ...m, points: m.points + points } : m,
    ),
  };

  await ClubRepo.set(club.key, updated);
  return updated;
}
