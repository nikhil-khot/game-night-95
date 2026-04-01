import useThreadList from "../hooks/useThreadList.ts";
import ThreadSummaryView from "../components/ThreadSummaryView.tsx";
import { useNavigate } from "react-router-dom";
import useGameList from "../hooks/useGameList.ts";
import GameSummaryView from "../components/GameSummaryView.tsx";

export default function Home() {
  const { threadOrMessage, setThreadInList } = useThreadList(4);
  const gameList = useGameList(4);
  const navigate = useNavigate();

  return (
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
