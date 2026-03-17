import useNewGameForm from "../hooks/useNewGameForm.ts";
import { gameModes, gameNames } from "../util/consts.ts";

export default function NewGame() {
  const { gameType, handleGameTypeChange, gameMode, handleGameModeChange, err, handleSubmit } =
    useNewGameForm();

  return (
    <form className="content spacedSection" onSubmit={handleSubmit}>
      <h2>Create new game</h2>
      <div>
        <select
          value={gameType}
          aria-label="Game selection"
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
          aria-label="Game selection"
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
      {err && <p className="error-message">{err}</p>}
      <div>
        <button className="primary narrow">Create New Game</button>
      </div>
    </form>
  );
}
