import { Button, Dropdown, Frame } from "@react95/core";
import useNewGameForm from "../hooks/useNewGameForm.ts";
import { gameModes, gameNames } from "../util/consts.ts";

export default function NewGame() {
  const {
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
    <div className="content">
      <Frame
        bgColor="$material"
        boxShadow="$out"
        padding="$4"
        className="outerFrame"
        style={{ width: "fit-content" }}
      >
        <Frame h="100%" boxShadow="$in" className="innerFrame">
          <div className="content">
            <form className="spacedSection" onSubmit={handleSubmit}>
              <h2>Create new game</h2>
              <div>
                <Dropdown
                  aria-label="Game Type selection"
                  onChange={(e) => handleGameTypeChange(e)}
                  options={[
                    "— Select a game —",
                    ...Object.entries(gameNames).map(([key, name]) => name),
                  ]}
                />
                &nbsp;&nbsp;&nbsp;
                <Dropdown
                  aria-label="Game Mode selection"
                  onChange={(e) => handleGameModeChange(e)}
                  options={[
                    "— Select a game mode —",
                    ...Object.entries(gameModes).map(([key, name]) => name),
                  ]}
                />
              </div>
              {gameMode === "club vs club" && (
                <div>
                  <span>
                    <strong>Your club:</strong>&nbsp;
                    {myClub ?? <em>You are not in a club</em>}
                  </span>
                  &nbsp;&nbsp;&nbsp;vs&nbsp;&nbsp;&nbsp;
                  <Dropdown
                    value={opponentClub}
                    aria-label="Opponent club selection"
                    onChange={(e) => setOpponentClub(e.target.value)}
                    disabled={!myClub}
                    options={["— Select opponent club —", ...otherClubs]}
                  />
                </div>
              )}
              {err && <p className="error-message">{err}</p>}
              <div>
                <Button className="primary">Create New Game</Button>
              </div>
            </form>
          </div>
        </Frame>
      </Frame>
    </div>
  );
}
