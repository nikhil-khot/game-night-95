import useThreadList from "../hooks/useThreadList.ts";
import ThreadSummaryView from "../components/ThreadSummaryView.tsx";
import { useNavigate } from "react-router-dom";
import useGameList from "../hooks/useGameList.ts";
import GameSummaryView from "../components/GameSummaryView.tsx";
import { Button, Frame } from "@react95/core";
import useAuth from "../hooks/useAuth.ts";
import { useEffect, useState } from "react";
import type { GameInfo } from "@gamenite/shared";
import { getInvitedGames } from "../services/inviteService.ts";

export default function Home() {
  const { threadOrMessage, setThreadInList } = useThreadList(4);
  const gameList = useGameList(4);
  const navigate = useNavigate();
  const auth = useAuth();
  const [invitedGames, setInvitedGames] = useState<GameInfo[] | null>(null);
  useEffect(() => {
    (async () => {
      const games = await getInvitedGames(auth);
      setInvitedGames(games);
    })();
  }, [auth]);

  return (
    <div className="content">
      {invitedGames && invitedGames.length > 0 && (
        <Frame bgColor="$material" boxShadow="$out" padding="$4" className="outerFrame">
          <Frame h="100%" boxShadow="$in" className="innerFrame">
            <div className="content">
              <div className="spacedSection">
                <h2>Invited Games</h2>
                <div id="invitedGameList" className="dottedList">
                  {invitedGames.map((game) => (
                    <GameSummaryView {...game} key={game.gameId.toString()} />
                  ))}
                </div>
              </div>
            </div>
          </Frame>
        </Frame>
      )}
      <Frame bgColor="$material" boxShadow="$out" padding="$4" className="outerFrame">
        <Frame h="100%" boxShadow="$in" className="innerFrame">
          <div className="content">
            <div className="spacedSection">
              <h2>Recent games</h2>
              {"message" in gameList ? (
                <div>{gameList.message}</div>
              ) : (
                <div id="gameList" className="dottedList">
                  {gameList.map((game) => (
                    <GameSummaryView {...game} key={game.gameId.toString()} />
                  ))}
                </div>
              )}
              <div>
                <Button className="primary" onClick={() => navigate("/game/new")}>
                  Create New Game
                </Button>
              </div>
            </div>
          </div>
        </Frame>
      </Frame>
      <Frame bgColor="$material" boxShadow="$out" padding="$4" className="outerFrame">
        <Frame h="100%" boxShadow="$in" className="innerFrame">
          <div className="content">
            <div className="spacedSection">
              <h2>Recent forum posts</h2>
              {"message" in threadOrMessage ? (
                <div>{threadOrMessage.message}</div>
              ) : (
                <div id="threadList" role="list" className="dottedList">
                  {threadOrMessage.threads.map((thread) => (
                    <ThreadSummaryView
                      summary={thread}
                      setThreadInList={setThreadInList}
                      key={thread.threadId.toString()}
                    />
                  ))}
                </div>
              )}
              <div>
                <Button className="primary" onClick={() => navigate("/forum/post/new")}>
                  Create New Post
                </Button>
              </div>
            </div>
          </div>
        </Frame>
      </Frame>
    </div>
  );
}
