import { useState, useEffect, useCallback } from "react";
import useAuth from "../hooks/useAuth.ts";
import { createClub, listClubs } from "../services/clubService.ts";
import ClubsList from "./ClubsList.tsx";
import type { ClubInfo } from "@gamenite/shared";
import "./ClubPanel.css";

/**
 * Component to manage clubs: create new clubs and view all clubs
 */
export default function ClubPanel() {
  const auth = useAuth();
  const [clubs, setClubs] = useState<ClubInfo[]>([]);
  const [currentUserClub, setCurrentUserClub] = useState<ClubInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName.trim() || !clubDescription.trim() || !auth) {
      setError("Please fill in all fields");
      return;
    }

    setCreatingClub(true);
    setError(null);
    setSuccess(null);

    const result = await createClub(auth, clubName.trim(), clubDescription.trim());
    if ("error" in result) {
      setError(result.error);
    } else {
      setSuccess(`Club "${clubName}" created successfully!`);
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
    <div className="clubPanel">
      <div className="clubPanel__header">
        <h2>Clubs</h2>
        {!currentUserClub && !showCreateForm && (
          <button className="clubPanel__createBtn" onClick={() => setShowCreateForm(true)}>
            Create Club
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="createClubForm">
          <h3>Create a New Club</h3>
          <form onSubmit={handleCreateClub}>
            <div className="formGroup">
              <label htmlFor="clubName">Club Name</label>
              <input
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
              <textarea
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
              <button
                type="submit"
                disabled={creatingClub || !clubName.trim() || !clubDescription.trim()}
                className="submitBtn"
              >
                {creatingClub ? "Creating..." : "Create Club"}
              </button>
              <button
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
              </button>
            </div>
          </form>
        </div>
      )}

      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      {currentUserClub && (
        <div className="currentClubSection">
          <h3>Your Club: {currentUserClub.name}</h3>
          <p>{currentUserClub.description}</p>
        </div>
      )}

      <div className="clubsListSection">
        {clubs.length > 0 ? (
          <ClubsList
            clubs={clubs}
            currentUserClub={currentUserClub}
            onClubJoined={loadClubs}
            onClubUpdated={loadClubs}
          />
        ) : (
          <div className="noClubs">No clubs available yet.</div>
        )}
      </div>
    </div>
  );
}
