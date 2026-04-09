import "./Game.css";
import { useParams } from "react-router-dom";
import { getGameById } from "../services/gameService.ts";
import { useEffect, useState } from "react";
import type { GameInfo } from "@gamenite/shared";
import ChatPanel from "../components/ChatPanel.tsx";
import GamePanel from "../components/GamePanel.tsx";
import { Frame } from "@react95/core";

export default function Game() {
  const { gameId } = useParams();
  const [game, setGame] = useState<GameInfo | null>(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      // non-nullish assertion is ok here given that Game is only called in a
      // route with `:gameId`
      const game = await getGameById(gameId!);
      if (ignore || "error" in game) return;
      setGame(game);
    })();
    return () => {
      ignore = true;
    };
  }, [gameId]);

  return (
    game && (
      <>
        <div className="gameContainer">
          <Frame
            h="96%"
            w="99%"
            bgColor="$material"
            boxShadow="$out"
            padding="$4"
            margin="1%"
            className="outerFrame"
          >
            <Frame h="100%" boxShadow="$in" className="innerFrame">
              <GamePanel {...game} />
            </Frame>
          </Frame>
          <Frame
            h="96%"
            w="98%"
            bgColor="$material"
            boxShadow="$out"
            padding="$4"
            margin="1%"
            className="outerFrame"
          >
            <Frame h="100%" boxShadow="$in" className="innerFrame">
              <ChatPanel chatId={game.chat} />
            </Frame>
          </Frame>
        </div>
      </>
    )
  );
}
