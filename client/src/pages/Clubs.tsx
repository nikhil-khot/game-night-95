import { useState, useEffect, useCallback } from "react";
import useAuth from "../hooks/useAuth.ts";
import { createClub, listClubs } from "../services/clubService.ts";
import type { ClubInfo } from "@gamenite/shared";
import ClubsList from "../components/ClubsList.tsx";
import { Button, Frame, Input, Tab, Tabs, TextArea } from "@react95/core";
import "./Clubs.css";
import ClubMemberList from "../components/ClubMemberList.tsx";
import ClubChatSection from "../components/ClubChatSection.tsx";
import ClubLeaderboard from "../components/ClubLeaderboard.tsx";

/**
 * Component to manage clubs: create new clubs and view all clubs
 */
export default function Clubs() {
  const auth = useAuth();
  const [clubs, setClubs] = useState<ClubInfo[]>([]);
  const [currentUserClub, setCurrentUserClub] = useState<ClubInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [clubName, setClubName] = useState("");
  const [clubDescription, setClubDescription] = useState("");
  const [creatingClub, setCreatingClub] = useState(false);

  const loadClubs = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await listClubs();
    if ("error" in result) {
      setError(result.error);
      setClubs([]);
    } else {
      setClubs(result as unknown as ClubInfo[]);
      // Find current user's club
      if (auth) {
        const userClub = (result as unknown as ClubInfo[]).find((club) =>
          club.members.some((m) => m.username === auth.username),
        );
        setCurrentUserClub(userClub || null);
      }
    }
    setLoading(false);
  }, [auth]);

  // Load clubs on mount
  useEffect(() => {
    // eslint-disable-next-line
    loadClubs();
  }, [loadClubs]);

  const handleCreateClub = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!clubName.trim() || !clubDescription.trim() || !auth) {
      setError("Please fill in all fields");
      return;
    }

    setCreatingClub(true);
    setError(null);

    const result = await createClub(auth, clubName.trim(), clubDescription.trim());
    if ("error" in result) {
      setError(result.error);
    } else {
      setClubName("");
      setClubDescription("");
      setShowCreateForm(false);
      // Reload clubs
      await loadClubs();
    }
    setCreatingClub(false);
  };

  if (!auth) {
    return <div className="clubPanel__noAuth">Please log in to manage clubs</div>;
  }

  if (loading) {
    return <div className="clubPanel__loading">Loading clubs...</div>;
  }

  return (
    <div className="clubPanel content">
      <div className="clubPanel__header">
        <Frame
          bgColor="$material"
          boxShadow="$out"
          padding="$4"
          className="outerFrame"
          style={{ width: "fit-content" }}
        >
          <Frame h="100%" boxShadow="$in" className="innerFrame">
            <div className="content">
              <h2>Clubs</h2>
            </div>
          </Frame>
        </Frame>
        {!currentUserClub && !showCreateForm && (
          <Frame
            bgColor="$material"
            boxShadow="$out"
            padding="$4"
            className="outerFrame"
            style={{ width: "fit-content" }}
          >
            <Frame h="100%" boxShadow="$in" className="innerFrame">
              <div className="" style={{ padding: "0.2rem" }}>
                <Button className="clubPanel__createBtn" onClick={() => setShowCreateForm(true)}>
                  Create Club
                </Button>
              </div>
            </Frame>
          </Frame>
        )}
      </div>

      {showCreateForm && (
        <Frame bgColor="$material" boxShadow="$out" padding="$4" className="outerFrame">
          <Frame h="100%" boxShadow="$in" className="innerFrame">
            <div className="content">
              <div className="createClubForm">
                <h3>Create a New Club</h3>
                <form onSubmit={handleCreateClub}>
                  <div className="formGroup">
                    <label htmlFor="clubName">Club Name</label>
                    <Input
                      id="clubName"
                      type="text"
                      placeholder="Enter club name..."
                      value={clubName}
                      onChange={(e) => setClubName(e.target.value)}
                      disabled={creatingClub}
                      className="inputField"
                    />
                  </div>
                  <div className="formGroup">
                    <label htmlFor="clubDescription">Description</label>
                    <TextArea
                      id="clubDescription"
                      placeholder="Enter club description..."
                      value={clubDescription}
                      onChange={(e) => setClubDescription(e.target.value)}
                      disabled={creatingClub}
                      className="inputField"
                      rows={3}
                    />
                  </div>
                  <div className="formActions">
                    {error && <p style={{ color: "red", fontSize: "0.95rem" }}>{error}</p>}
                    <Button
                      type="submit"
                      disabled={creatingClub || !clubName.trim() || !clubDescription.trim()}
                      className="submitBtn"
                    >
                      {creatingClub ? "Creating..." : "Create Club"}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        setClubName("");
                        setClubDescription("");
                        setError(null);
                      }}
                      className="cancelBtn"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </Frame>
        </Frame>
      )}

      <div className="clubsWorkspace">
        <Frame bgColor="$material" boxShadow="$out" padding="$4" className="outerFrame">
          <Frame h="100%" boxShadow="$in" className="innerFrame">
            <div className="content">
              <div className="clubsListSection">
                {clubs.length > 0 ? (
                  <ClubsList
                    clubs={clubs}
                    currentUserClub={currentUserClub}
                    expanded={false}
                    onClubJoined={loadClubs}
                    onClubUpdated={loadClubs}
                  />
                ) : (
                  <div className="noClubs">No clubs available yet.</div>
                )}
              </div>
            </div>
          </Frame>
        </Frame>
        <div>
          {currentUserClub && (
            <Tabs>
              <Tab title="Club Information" className="tab">
                <Frame
                  h="100%"
                  boxShadow="$in"
                  className="innerFrame"
                  style={{ minHeight: "30rem" }}
                >
                  <div className="content">
                    <ClubsList
                      clubs={[currentUserClub]}
                      currentUserClub={currentUserClub}
                      expanded={true}
                      onClubJoined={loadClubs}
                      onClubUpdated={loadClubs}
                    />
                  </div>
                </Frame>
              </Tab>
              <Tab title="Club Members" className="tab">
                <Frame
                  h="100%"
                  boxShadow="$in"
                  className="innerFrame"
                  style={{ minHeight: "30rem" }}
                >
                  <ClubMemberList
                    club={currentUserClub}
                    onClubJoined={loadClubs}
                    onClubUpdated={loadClubs}
                  />
                </Frame>
              </Tab>
              <Tab title="Club Chat" className="tab">
                <Frame
                  h="30rem"
                  boxShadow="$in"
                  className="innerFrame"
                  style={{ minHeight: "30rem" }}
                >
                  <ClubChatSection clubName={currentUserClub.name} />
                </Frame>
              </Tab>
              <Tab title="Club Leaderboard" className="tab">
                <Frame
                  h="30rem"
                  boxShadow="$in"
                  className="innerFrame"
                  style={{ minHeight: "30rem" }}
                >
                  <ClubLeaderboard members={currentUserClub.members} />
                </Frame>
              </Tab>
            </Tabs>
          )}
          {!currentUserClub && (
            <Tabs>
              <Tab title="Club Information" className="tab">
                <Frame h="30rem" boxShadow="$in" className="innerFrame">
                  <div className="content">
                    <div
                      className=""
                      style={{ color: "#999", padding: "1rem", fontStyle: "italic" }}
                    >
                      <h3>You are not in a club! Join one for more info!</h3>
                    </div>
                  </div>
                </Frame>
              </Tab>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
