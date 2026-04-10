import { useState } from "react";
import type { ClubInfo, ClubMemberInfo } from "@gamenite/shared";
import useAuth from "../hooks/useAuth.ts";
import { joinClub, leaveClub, deleteClub } from "../services/clubService.ts";
import "./ClubsList.css";
import { Button } from "@react95/core";

interface ClubsListProps {
  clubs: ClubInfo[];
  currentUserClub: ClubInfo | null;
  expanded: boolean;
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
  expanded,
  onClubJoined,
  onClubUpdated,
}: ClubsListProps) {
  const auth = useAuth();
  const [joiningClub, setJoiningClub] = useState<string | null>(null);
  const [leavingClub, setLeavingClub] = useState<string | null>(null);
  const [deletingClub, setDeletingClub] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

          return (
            <div key={club.name} className="clubCard">
              <div className="clubCard__header">
                <div className="clubCard__info">
                  <h3 className="clubCard__name" style={{ maxWidth: expanded ? "30rem" : "10rem" }}>
                    {club.name}
                  </h3>
                  <p
                    className="clubCard__description"
                    style={{ maxWidth: expanded ? "30rem" : "10rem" }}
                  >
                    {club.description}
                  </p>
                  <span className="clubCard__memberCount ">
                    {club.members.length} member{club.members.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="clubCard__actions">
                  {isJoined && !canModerate(userRole?.role) && (
                    <>
                      <span className="clubCard__memberBadge">Member</span>
                    </>
                  )}
                  {isJoined && canModerate(userRole?.role) && userRole?.role !== "owner" && (
                    <span
                      className={`clubCard__memberBadge clubCard__memberBadge--${userRole?.role}`}
                    >
                      Admin
                    </span>
                  )}
                  {isJoined && userRole?.role === "owner" && (
                    <span
                      className={`clubCard__memberBadge clubCard__memberBadge--${userRole?.role}`}
                    >
                      Owner
                    </span>
                  )}
                  {isJoined ? (
                    userRole?.role === "owner" ? (
                      <Button
                        className="clubCard__deleteBtn"
                        onClick={() => handleDeleteClub(club.name)}
                        disabled={deletingClub === club.name}
                      >
                        {deletingClub === club.name ? "Deleting..." : "Delete"}
                      </Button>
                    ) : (
                      <Button
                        className="clubCard__leaveBtn"
                        onClick={() => handleLeaveClub(club.name)}
                        disabled={leavingClub === club.name}
                      >
                        {leavingClub === club.name ? "Leaving..." : "Leave"}
                      </Button>
                    )
                  ) : (
                    <Button
                      className="clubCard__joinBtn"
                      onClick={() => handleJoinClub(club.name)}
                      disabled={joiningClub === club.name}
                    >
                      {joiningClub === club.name ? "Joining..." : "Join"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
