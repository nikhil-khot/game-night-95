import { useState } from "react";
import type { ClubInfo } from "@gamenite/shared";
import useAuth from "../hooks/useAuth.ts";
import { removeMember, setMemberRole } from "../services/clubService.ts";
import "./ClubMemberList.css";
import { Button } from "@react95/core";

interface ClubsListProps {
  club: ClubInfo;
  onClubJoined: () => void;
  onClubUpdated: () => void;
}

/**
 * Component to display a list of clubs with the ability to join them
 * and manage members if the user is an owner or admin
 */
export default function ClubMemberList({ club, onClubJoined, onClubUpdated }: ClubsListProps) {
  const auth = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [changingRole, setChangingRole] = useState<string | null>(null);

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

  const userRole = auth ? club.members.find((m) => m.username === auth.username) : undefined;

  const canModerate = (role: string | undefined) => {
    return role === "owner" || role === "admin";
  };

  return (
    <div className="">
      {error && <p className="error">{error}</p>}
      <div className="clubCard__members">
        <h4>Members</h4>
        <div className="membersList">
          {club.members.map((member) => (
            <div key={member.userId} className="memberItem">
              <div className="memberInfo">
                <div className="memberAvatar">
                  <span className="memberStatusDot" />
                </div>
                <div className="memberText">
                  <span className="memberName">{member.username}</span>
                  <span className="memberStatusMessage">
                    {member.statusMessage && member.statusMessage.trim() !== ""
                      ? `"${member.statusMessage}"`
                      : '"No status set"'}
                  </span>
                </div>
                <span className={`memberRole memberRole--${member.role}`}>{member.role}</span>
              </div>
              {canModerate(userRole?.role) &&
                member.username !== auth?.username &&
                member.role !== "owner" && (
                  <div className="memberActions">
                    {member.role === "member" && (
                      <Button
                        className="promoteBtn"
                        onClick={() => handleSetRole(club.name, member.username, "admin")}
                        disabled={changingRole === member.username}
                      >
                        {changingRole === member.username ? "..." : "Promote"}
                      </Button>
                    )}
                    {member.role === "admin" && userRole?.role === "owner" && (
                      <Button
                        className="demoteBtn"
                        onClick={() => handleSetRole(club.name, member.username, "member")}
                        disabled={changingRole === member.username}
                      >
                        {changingRole === member.username ? "..." : "Demote"}
                      </Button>
                    )}
                    <Button
                      className="removeBtn"
                      onClick={() => handleRemoveMember(club.name, member.username)}
                      disabled={removingMember === member.username}
                    >
                      {removingMember === member.username ? "..." : "Remove"}
                    </Button>
                  </div>
                )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
