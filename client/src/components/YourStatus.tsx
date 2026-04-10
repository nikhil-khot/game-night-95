import { useEffect, useState } from "react";
import type { ClubInfo } from "@gamenite/shared";
import useAuth from "../hooks/useAuth.ts";
import { setMemberStatus } from "../services/clubService.ts";
import { Button, TextArea } from "@react95/core";
import "./YourStatus.css";

interface YourStatusProps {
  club: ClubInfo;
  onStatusUpdated: () => void;
}

export default function YourStatus({ club, onStatusUpdated }: YourStatusProps) {
  const auth = useAuth();
  const [statusMessage, setStatusMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const member = auth ? club.members.find((m) => m.username === auth.username) : undefined;
  const currentStatus = member?.statusMessage ?? "";

  useEffect(() => {
    setStatusMessage(currentStatus);
  }, [currentStatus]);

  if (!auth) return null;

  const handleSave = async () => {
    if (!auth) return;

    setSaving(true);
    setError(null);

    const trimmed = statusMessage.trim();
    const result = await setMemberStatus(auth, club.name, trimmed);
    if ("error" in result) {
      setError(result.error);
    } else {
      onStatusUpdated();
    }
    setSaving(false);
  };

  return (
    <div className="yourStatus">
      <h3 className="yourStatus__title">Your Status</h3>
      <div className="yourStatus__current">
        <span className="yourStatus__label">Current status:</span>
        <span className="yourStatus__value">
          {currentStatus && currentStatus.trim() !== "" ? `"${currentStatus}"` : "No status set"}
        </span>
      </div>
      <div className="yourStatus__editor">
        <label htmlFor="clubStatus" className="yourStatus__label">
          Set a new status message
        </label>
        <TextArea
          id="clubStatus"
          rows={2}
          maxLength={140}
          value={statusMessage}
          className="yourStatus__textarea"
          onChange={(e) => setStatusMessage(e.target.value)}
          disabled={saving}
        />
      </div>
      {error && <p className="yourStatus__error">{error}</p>}
      <div className="yourStatus__actions">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Update Status"}
        </Button>
      </div>
    </div>
  );
}
