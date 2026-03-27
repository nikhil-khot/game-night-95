import { useState } from "react";
import type { ClubInfo, ClubMemberInfo } from "@gamenite/shared";
import useAuth from "../hooks/useAuth.ts";
import {
  joinClub,
  leaveClub,
  deleteClub,
  removeMember,
  setMemberRole,
} from "../services/clubService.ts";
import ClubChatSection from "./ClubChatSection.tsx";
import "./ClubsList.css";

interface ClubsListProps {
  clubs: ClubInfo[];
  currentUserClub: ClubInfo | null;
  onClubJoined: () => void;
  onClubUpdated: () => void;
}

/**
 * Component to display a list of clubs with the ability to join them
 * and manage members if the user is an owner or admin
 */
export default function ClubsList({
  clubs,
  currentUserClub,
  onClubJoined,
  onClubUpdated,
}: ClubsListProps) {
  const auth = useAuth();
  const [expandedClub, setExpandedClub] = useState<string | null>(null);
  const [joiningClub, setJoiningClub] = useState<string | null>(null);
  const [leavingClub, setLeavingClub] = useState<string | null>(null);
  const [deletingClub, setDeletingClub] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [changingRole, setChangingRole] = useState<string | null>(null);

  if (!clubs || clubs.length === 0) {
    return <div className="noClubs">No clubs available yet. Create one to get started!</div>;
  }

  const handleJoinClub = async (clubName: string) => {
    if (!auth) return;

    setJoiningClub(clubName);
    setError(null);

    const result = await joinClub(auth, clubName);
    if ("error" in result) {
      setError(result.error);
    } else {
      onClubJoined();
    }
    setJoiningClub(null);
  };

  const handleLeaveClub = async (clubName: string) => {
    if (!auth) return;

    setLeavingClub(clubName);
    setError(null);

    const result = await leaveClub(auth, clubName);
    if ("error" in result) {
      setError(result.error);
    } else {
      onClubUpdated();
    }
    setLeavingClub(null);
  };

  const handleDeleteClub = async (clubName: string) => {
    if (!auth) return;

    setDeletingClub(clubName);
    setError(null);

    const result = await deleteClub(auth, clubName);
    if ("error" in result) {
      setError(result.error);
    } else {
      onClubUpdated();
    }
    setDeletingClub(null);
  };

  const handleRemoveMember = async (clubName: string, memberUsername: string) => {
    if (!auth) return;

    setRemovingMember(memberUsername);
    setError(null);

    const result = await removeMember(auth, clubName, memberUsername);
    if ("error" in result) {
      setError(result.error);
    } else {
      onClubUpdated();
    }
    setRemovingMember(null);
  };

  const handleSetRole = async (
    clubName: string,
    memberUsername: string,
    newRole: "admin" | "member",
  ) => {
    if (!auth) return;

    setChangingRole(memberUsername);
    setError(null);

    const result = await setMemberRole(auth, clubName, memberUsername, newRole);
    if ("error" in result) {
      setError(result.error);
    } else {
      onClubUpdated();
    }
    setChangingRole(null);
  };

  const isUserInClub = (club: ClubInfo) => {
    return currentUserClub?.name === club.name;
  };

  const getUserRoleInClub = (club: ClubInfo): ClubMemberInfo | undefined => {
    if (!auth) return undefined;
    return club.members.find((m) => m.username === auth.username);
  };

  const canModerate = (role: string | undefined) => {
    return role === "owner" || role === "admin";
  };

  return (
    <div className="clubsList">
      {error && <p className="error">{error}</p>}
      <div className="clubsList__items">
        {clubs.map((club) => {
          const isJoined = isUserInClub(club);
          const userRole = getUserRoleInClub(club);
          const isExpanded = expandedClub === club.name;

          return (
            <div key={club.name} className="clubCard">
              <div className="clubCard__header">
                <div className="clubCard__info">
                  <h3 className="clubCard__name">{club.name}</h3>
                  <p className="clubCard__description">{club.description}</p>
                  <span className="clubCard__memberCount">
                    {club.members.length} member{club.members.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="clubCard__actions">
                  {isJoined && !canModerate(userRole?.role) && (
                    <>
                      <span className="clubCard__memberBadge">Member</span>
                      <button
                        className="clubCard__leaveBtn"
                        onClick={() => handleLeaveClub(club.name)}
                        disabled={leavingClub === club.name}
                      >
                        {leavingClub === club.name ? "Leaving..." : "Leave"}
                      </button>
                    </>
                  )}
                  {isJoined && canModerate(userRole?.role) && userRole?.role !== "owner" && (
                    <>
                      <span
                        className={`clubCard__memberBadge clubCard__memberBadge--${userRole?.role}`}
                      >
                        Admin
                      </span>
                      <button
                        className="clubCard__leaveBtn"
                        onClick={() => handleLeaveClub(club.name)}
                        disabled={leavingClub === club.name}
                      >
                        {leavingClub === club.name ? "Leaving..." : "Leave"}
                      </button>
                    </>
                  )}
                  {isJoined && userRole?.role === "owner" && (
                    <>
                      <span
                        className={`clubCard__memberBadge clubCard__memberBadge--${userRole?.role}`}
                      >
                        Owner
                      </span>
                      <button
                        className="clubCard__deleteBtn"
                        onClick={() => handleDeleteClub(club.name)}
                        disabled={deletingClub === club.name}
                      >
                        {deletingClub === club.name ? "Deleting..." : "Delete"}
                      </button>
                    </>
                  )}
                  {!isJoined && (
                    <button
                      className="clubCard__joinBtn"
                      onClick={() => handleJoinClub(club.name)}
                      disabled={joiningClub === club.name}
                    >
                      {joiningClub === club.name ? "Joining..." : "Join"}
                    </button>
                  )}
                </div>
              </div>

              {isJoined && (
                <button
                  className="clubCard__expandBtn"
                  onClick={() => setExpandedClub(isExpanded ? null : club.name)}
                >
                  {isExpanded ? "Hide" : "Show"} Members
                </button>
              )}

              {isExpanded && (
                <div className="clubCard__members">
                  <h4>Members</h4>
                  <div className="membersList">
                    {club.members.map((member) => (
                      <div key={member.userId} className="memberItem">
                        <div className="memberInfo">
                          <span className="memberName">{member.username}</span>
                          <span className={`memberRole memberRole--${member.role}`}>
                            {member.role}
                          </span>
                          <span className="memberPoints">{member.points} pts</span>
                        </div>
                        {canModerate(userRole?.role) &&
                          member.username !== auth?.username &&
                          member.role !== "owner" && (
                            <div className="memberActions">
                              {member.role === "member" && (
                                <button
                                  className="promoteBtn"
                                  onClick={() => handleSetRole(club.name, member.username, "admin")}
                                  disabled={changingRole === member.username}
                                >
                                  {changingRole === member.username ? "..." : "Promote"}
                                </button>
                              )}
                              {member.role === "admin" && userRole?.role === "owner" && (
                                <button
                                  className="demoteBtn"
                                  onClick={() =>
                                    handleSetRole(club.name, member.username, "member")
                                  }
                                  disabled={changingRole === member.username}
                                >
                                  {changingRole === member.username ? "..." : "Demote"}
                                </button>
                              )}
                              <button
                                className="removeBtn"
                                onClick={() => handleRemoveMember(club.name, member.username)}
                                disabled={removingMember === member.username}
                              >
                                {removingMember === member.username ? "..." : "Remove"}
                              </button>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                  <ClubChatSection clubName={club.name} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
