import useThreadList from "../hooks/useThreadList.ts";
import ThreadSummaryView from "../components/ThreadSummaryView.tsx";
import { useNavigate } from "react-router-dom";
import useGameList from "../hooks/useGameList.ts";
import GameSummaryView from "../components/GameSummaryView.tsx";
import useAuth from "../hooks/useAuth.ts";
import { useEffect, useState } from "react";
import { getInvitedGames } from "../services/inviteService.ts";

export default function Home() {
  const { threadOrMessage, setThreadInList } = useThreadList(4);
  const gameList = useGameList(4);
  const navigate = useNavigate();
  const auth = useAuth();
  const [invitedGames, setInvitedGames] = useState<any[] | null>(null);
  useEffect(() => {
    (async () => {
      const games = await getInvitedGames(auth);
      setInvitedGames(games);
    })();
  }, [auth]);

  return (
    <div className="content">
      {invitedGames && invitedGames.length > 0 && (
        <div className="spacedSection">
          <h2>Invited Games</h2>
          <div id="invitedGameList" className="dottedList">
            {invitedGames.map((game) => (
              <GameSummaryView {...game} key={game.gameId.toString()} />
            ))}
          </div>
        </div>
      )}
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
          <button className="primary narrow" onClick={() => navigate("/game/new")}>
            Create New Game
          </button>
        </div>
      </div>
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
          <button className="primary narrow" onClick={() => navigate("/forum/post/new")}>
            Create New Post
          </button>
        </div>
      </div>
    </div>
  );
}
