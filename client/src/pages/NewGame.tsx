import { Button } from "@react95/core";
import useNewGameForm from "../hooks/useNewGameForm.ts";
import { gameModes, gameNames } from "../util/consts.ts";

export default function NewGame() {
  const {
    gameType,
    handleGameTypeChange,
    gameMode,
    handleGameModeChange,
    myClub,
    opponentClub,
    setOpponentClub,
    otherClubs,
    err,
    handleSubmit,
  } = useNewGameForm();

  return (
    <form className="content spacedSection" onSubmit={handleSubmit}>
      <h2>Create new game</h2>
      <div>
        <select
          value={gameType}
          aria-label="Game Type selection"
          onChange={(e) => handleGameTypeChange(e)}
        >
          <option value="">— Select a game —</option>
          {Object.entries(gameNames).map(([key, name]) => (
            <option key={key} value={key}>
              {name}
            </option>
          ))}
        </select>
        &nbsp;&nbsp;&nbsp;
        <select
          value={gameMode}
          aria-label="Game Mode selection"
          onChange={(e) => handleGameModeChange(e)}
        >
          <option value="">— Select a game mode —</option>
          {Object.entries(gameModes).map(([key, name]) => (
            <option key={key} value={key}>
              {name}
            </option>
          ))}
        </select>
      </div>
      {gameMode === "club vs club" && (
        <div>
          <span>
            <strong>Your club:</strong>&nbsp;
            {myClub ?? <em>You are not in a club</em>}
          </span>
          &nbsp;&nbsp;&nbsp;vs&nbsp;&nbsp;&nbsp;
          <select
            value={opponentClub}
            aria-label="Opponent club selection"
            onChange={(e) => setOpponentClub(e.target.value)}
            disabled={!myClub}
          >
            <option value="">— Select opponent club —</option>
            {otherClubs.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      )}
      {err && <p className="error-message">{err}</p>}
      <div>
        <Button className="primary">Create New Game</Button>
      </div>
    </form>
  );
}
