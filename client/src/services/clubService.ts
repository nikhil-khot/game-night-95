import type { APIResponse } from "../util/types.ts";
import { api, exceptionToErrorMsg } from "./api.ts";
import type { ErrorMsg, UserAuth, ClubInfo, ClubRole } from "@gamenite/shared";

const CLUB_API_URL = `/api/club`;

/**
 * Creates a new club with the authenticated user as the owner
 *
 * @param auth - The authenticated user
 * @param name - The name of the club
 * @param description - The description of the club
 * @returns The created ClubInfo or an error message
 */
export const createClub = async (
  auth: UserAuth,
  name: string,
  description: string,
): APIResponse<ClubInfo> => {
  try {
    const res = await api.post<ClubInfo | ErrorMsg>(`${CLUB_API_URL}/create`, {
      auth,
      payload: { name, description },
    });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/**
 * Joins an existing club
 *
 * @param auth - The authenticated user
 * @param clubName - The name of the club to join
 * @returns The updated ClubInfo or an error message
 */
export const joinClub = async (auth: UserAuth, clubName: string): APIResponse<ClubInfo> => {
  try {
    const res = await api.post<ClubInfo | ErrorMsg>(`${CLUB_API_URL}/join`, {
      auth,
      payload: { clubName },
    });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/**
 * Leaves a club the user is a member of
 *
 * @param auth - The authenticated user
 * @param clubName - The name of the club to leave
 * @returns The updated ClubInfo or an error message
 */
export const leaveClub = async (auth: UserAuth, clubName: string): APIResponse<ClubInfo> => {
  try {
    const res = await api.post<ClubInfo | ErrorMsg>(`${CLUB_API_URL}/leave`, {
      auth,
      payload: { clubName },
    });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/**
 * Deletes a club (owner only)
 */
export const deleteClub = async (
  auth: UserAuth,
  clubName: string,
): APIResponse<{ success: true }> => {
  try {
    const res = await api.post<{ success: true } | ErrorMsg>(`${CLUB_API_URL}/delete`, {
      auth,
      payload: { clubName },
    });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/**
 * Removes a member from a club (only owner or admin can do this)
 *
 * @param auth - The authenticated user
 * @param clubName - The name of the club
 * @param targetUsername - The username of the member to remove
 * @returns The updated ClubInfo or an error message
 */
export const removeMember = async (
  auth: UserAuth,
  clubName: string,
  targetUsername: string,
): APIResponse<ClubInfo> => {
  try {
    const res = await api.post<ClubInfo | ErrorMsg>(`${CLUB_API_URL}/remove-member`, {
      auth,
      payload: { clubName, targetUsername },
    });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/**
 * Sets a member's role in a club (only owner can do this)
 *
 * @param auth - The authenticated user
 * @param clubName - The name of the club
 * @param targetUsername - The username of the member to change role for
 * @param newRole - The new role ("admin" or "member")
 * @returns The updated ClubInfo or an error message
 */
export const setMemberRole = async (
  auth: UserAuth,
  clubName: string,
  targetUsername: string,
  newRole: Extract<ClubRole, "admin" | "member">,
): APIResponse<ClubInfo> => {
  try {
    const res = await api.post<ClubInfo | ErrorMsg>(`${CLUB_API_URL}/set-member-role`, {
      auth,
      payload: { clubName, targetUsername, newRole },
    });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/**
 * Sets the authenticated member's status message within a club.
 */
export const setMemberStatus = async (
  auth: UserAuth,
  clubName: string,
  statusMessage: string,
): APIResponse<ClubInfo> => {
  try {
    const res = await api.post<ClubInfo | ErrorMsg>(`${CLUB_API_URL}/set-status`, {
      auth,
      payload: { clubName, statusMessage },
    });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/**
 * Gets information about a specific club by name
 *
 * @param clubName - The name of the club
 * @returns The ClubInfo or an error message
 */
export const getClub = async (clubName: string): APIResponse<ClubInfo> => {
  try {
    const res = await api.get<ClubInfo | ErrorMsg>(`${CLUB_API_URL}/${clubName}`);
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/**
 * Gets the list of all clubs
 *
 * @returns An array of ClubInfo or an error message
 */
export const listClubs = async (): APIResponse<ClubInfo[]> => {
  try {
    const res = await api.get<ClubInfo[] | ErrorMsg>(`${CLUB_API_URL}/list`);
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};
