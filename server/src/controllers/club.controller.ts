import {
  withAuth,
  zCreateClubPayload,
  zJoinClubPayload,
  zLeaveClubPayload,
  zDeleteClubPayload,
  zRemoveClubMemberPayload,
  zSetClubMemberRolePayload,
  zSetClubMemberStatusPayload,
} from "@gamenite/shared";
import type { ClubRecord } from "../models.ts";
import type { ClubMemberInfo, ClubInfo } from "@gamenite/shared";
import {
  createClub,
  joinClub,
  leaveClub,
  deleteClub,
  getClub,
  listClubs,
  removeMember,
  setMemberRole,
  setMemberStatus,
} from "../services/club.service.ts";
import { type RestAPI } from "../types.ts";
import { checkAuth } from "../services/auth.service.ts";
import { populateSafeUserInfo } from "../services/user.service.ts";

/**
 * Creates a new club with the authenticated user as the owner.
 *
 * @param req The request containing auth, name, and description in the body.
 * @param res The response, either returning the created ClubInfo or an error.
 */
export const postCreate: RestAPI = async (req, res) => {
  const body = withAuth(zCreateClubPayload).safeParse(req.body);
  if (!body.success) {
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }

  const user = await checkAuth(body.data.auth);
  if (!user) {
    res.status(403).send({ error: "Invalid credentials" });
    return;
  }

  const result = await createClub(
    user.username,
    body.data.payload.name,
    body.data.payload.description,
  );
  if ("error" in result) {
    res.send(result);
    return;
  }

  // Populate club members with username information
  const clubInfo = await populateClubInfo(result);
  res.send(clubInfo);
};

/**
 * Allows the authenticated user to join an existing club.
 *
 * @param req The request containing auth and clubName in the body.
 * @param res The response, either returning the updated ClubInfo or an error.
 */
export const postJoin: RestAPI = async (req, res) => {
  const body = withAuth(zJoinClubPayload).safeParse(req.body);
  if (!body.success) {
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }

  const user = await checkAuth(body.data.auth);
  if (!user) {
    res.status(403).send({ error: "Invalid credentials" });
    return;
  }

  const result = await joinClub(user.username, body.data.payload.clubName);
  if ("error" in result) {
    res.send(result);
    return;
  }

  // Populate club members with username information
  const clubInfo = await populateClubInfo(result);
  res.send(clubInfo);
};

/**
 * Allows the authenticated user to leave a club they are a member of.
 *
 * @param req The request containing auth and clubName in the body.
 * @param res The response, either returning the updated ClubInfo or an error.
 */
export const postLeave: RestAPI = async (req, res) => {
  const body = withAuth(zLeaveClubPayload).safeParse(req.body);
  if (!body.success) {
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }

  const user = await checkAuth(body.data.auth);
  if (!user) {
    res.status(403).send({ error: "Invalid credentials" });
    return;
  }

  const result = await leaveClub(user.username, body.data.payload.clubName);
  if ("error" in result) {
    res.send(result);
    return;
  }

  // Populate club members with username information
  const clubInfo = await populateClubInfo(result);
  res.send(clubInfo);
};

/**
 * Deletes a club owned by the authenticated user.
 *
 * @param req The request containing auth and clubName in the body.
 * @param res The response, either returning success or error.
 */
export const postDelete: RestAPI = async (req, res) => {
  const body = withAuth(zDeleteClubPayload).safeParse(req.body);
  if (!body.success) {
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }

  const user = await checkAuth(body.data.auth);
  if (!user) {
    res.status(403).send({ error: "Invalid credentials" });
    return;
  }

  const result = await deleteClub(user.username, body.data.payload.clubName);
  if ("error" in result) {
    res.send(result);
    return;
  }

  res.send(result);
};

/**
 * Removes a member from a club (only owner or admin can do this).
 *
 * @param req The request containing auth, clubName, and targetUsername in the body.
 * @param res The response, either returning the updated ClubInfo or an error.
 */
export const postRemoveMember: RestAPI = async (req, res) => {
  const body = withAuth(zRemoveClubMemberPayload).safeParse(req.body);
  if (!body.success) {
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }

  const user = await checkAuth(body.data.auth);
  if (!user) {
    res.status(403).send({ error: "Invalid credentials" });
    return;
  }

  const result = await removeMember(
    user.username,
    body.data.payload.targetUsername,
    body.data.payload.clubName,
  );
  if ("error" in result) {
    res.send(result);
    return;
  }

  // Populate club members with username information
  const clubInfo = await populateClubInfo(result);
  res.send(clubInfo);
};

/**
 * Sets a member's role in a club (only owner can do this).
 *
 * @param req The request containing auth, clubName, targetUsername, and newRole in the body.
 * @param res The response, either returning the updated ClubInfo or an error.
 */
export const postSetMemberRole: RestAPI = async (req, res) => {
  const body = withAuth(zSetClubMemberRolePayload).safeParse(req.body);
  if (!body.success) {
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }

  const user = await checkAuth(body.data.auth);
  if (!user) {
    res.status(403).send({ error: "Invalid credentials" });
    return;
  }

  const result = await setMemberRole(
    user.username,
    body.data.payload.targetUsername,
    body.data.payload.clubName,
    body.data.payload.newRole,
  );
  if ("error" in result) {
    res.send(result);
    return;
  }

  // Populate club members with username information
  const clubInfo = await populateClubInfo(result);
  res.send(clubInfo);
};

/**
 * Sets the authenticated member's status message within a club.
 *
 * @param req The request containing auth, clubName, and statusMessage in the body.
 * @param res The response, either returning the updated ClubInfo or an error.
 */
export const postSetMemberStatus: RestAPI = async (req, res) => {
  const body = withAuth(zSetClubMemberStatusPayload).safeParse(req.body);
  if (!body.success) {
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }

  const user = await checkAuth(body.data.auth);
  if (!user) {
    res.status(403).send({ error: "Invalid credentials" });
    return;
  }

  const result = await setMemberStatus(
    user.username,
    body.data.payload.clubName,
    body.data.payload.statusMessage,
  );
  if ("error" in result) {
    res.send(result);
    return;
  }

  const clubInfo = await populateClubInfo(result);
  res.send(clubInfo);
};

/**
 * Gets information about a specific club by name.
 *
 * @param req The request containing the club name as a parameter.
 * @param res The response, either returning the ClubInfo or an error.
 */
export const getByName: RestAPI<ClubInfo> = async (req, res) => {
  const clubName = req.params.name;
  if (typeof clubName !== "string") {
    res.status(400).send({ error: "Missing or invalid club name parameter" });
    return;
  }

  const result = await getClub(clubName);
  if ("error" in result) {
    res.send(result);
    return;
  }

  // Populate club members with username information
  const clubInfo = await populateClubInfo(result);
  res.send(clubInfo);
};

/**
 * Lists all clubs.
 *
 * @param req The request.
 * @param res The response, returning an array of ClubInfo.
 */
export const getList: RestAPI<ClubInfo[]> = async (req, res) => {
  const clubs = await listClubs();

  // Populate all clubs with member information
  const clubsInfo: ClubInfo[] = [];
  for (const club of clubs) {
    const clubInfo = await populateClubInfo(club);
    clubsInfo.push(clubInfo);
  }

  res.send(clubsInfo);
};

/**
 * Helper function to populate a club record with user information for club members.
 * Converts member userIds to full user information.
 */
async function populateClubInfo(club: ClubRecord): Promise<ClubInfo> {
  const membersInfo: ClubMemberInfo[] = await Promise.all(
    club.members.map(async (member) => {
      const userInfo = await populateSafeUserInfo(member.userId);
      return {
        userId: member.userId,
        username: userInfo.username,
        role: member.role,
        points: member.points,
        joinedAt: member.joinedAt,
        statusMessage: member.statusMessage,
      };
    }),
  );

  return {
    name: club.name,
    description: club.description,
    members: membersInfo,
    createdAt: club.createdAt,
  };
}
