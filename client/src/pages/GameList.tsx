import { useNavigate } from "react-router-dom";
import GameSummaryView from "../components/GameSummaryView.tsx";
import useGameList from "../hooks/useGameList.ts";
import { Button, Frame } from "@react95/core";

export default function GameList() {
  const gameList = useGameList();
  const navigate = useNavigate();

  return (
    <div className="content">
      <Frame bgColor="$material" boxShadow="$out" padding="$4" className="outerFrame">
        <Frame h="100%" boxShadow="$in" className="innerFrame">
          <div className="content">
            <div className="spacedSection">
              <h2>All games</h2>
              <div>
                <Button className="primary" onClick={() => navigate("/game/new")}>
                  Create New Game
                </Button>
              </div>
              <>
                {"message" in gameList ? (
                  gameList.message
                ) : (
                  <div className="dottedList">
                    {gameList.map((game) => (
                      <GameSummaryView {...game} key={game.gameId.toString()} />
                    ))}
                  </div>
                )}
              </>
            </div>
          </div>
        </Frame>
      </Frame>
    </div>
  );
}
