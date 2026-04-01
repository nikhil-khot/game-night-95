/* eslint no-console: "off" */

import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./pages/Login.tsx";
import type { AuthContext } from "./contexts/LoginContext.ts";
import Layout from "./components/Layout.tsx";
import Home from "./pages/Home.tsx";
import ThreadList from "./pages/ThreadList.tsx";
import Profile from "./pages/Profile.tsx";
import { io } from "socket.io-client";
import type { GameSocket } from "./util/types.ts";
import LoggedInRoute from "./components/LoggedInRoute.tsx";
import NewGame from "./pages/NewGame.tsx";
import Game from "./pages/Game.tsx";
import GameList from "./pages/GameList.tsx";
import ThreadPage from "./pages/ThreadPage.tsx";
import { ErrorBoundary } from "react-error-boundary";
import fallback from "./fallback.tsx";
import NewThread from "./pages/NewThread.tsx";
import TimeContextKeeper from "./components/UpdatingTimeContext.tsx";
import Preferences from "./pages/Preferences.tsx";
import ApplyUserPreferences from "./components/ApplyUserPreferences.tsx";
import { resetDisplayPreferences } from "./util/displayPreferences.ts";
import ViewProfile from "./pages/ViewProfile.tsx";
import Friends from "./pages/Friends.tsx";
import Leaderboard from "./pages/Leaderboard.tsx";
import AuthCallback from "./components/AuthCallback.tsx";

/** If `true`, all incoming socket messages will be logged */
const DEBUG_SOCKETS = false;

/**
 * Websocket connection for the app. It would be natural to define this in a
 * useEffect hook, but the React docts advise against this.
 * https://react.dev/learn/you-might-not-need-an-effect#initializing-the-application
 * */
let socket: GameSocket | null = null;
if (typeof window !== "undefined") {
  socket = io();
  if (DEBUG_SOCKETS) {
    socket.onAny((tag, payload) => {
      console.log(`from socket got ${tag}(${JSON.stringify(payload)})`);
    });
  }
}

function NoSuchRoute() {
  const { pathname } = useLocation();
  return `No page found for route '${pathname}'`;
}

export default function App() {
  const [auth, setAuth] = useState<AuthContext | null>(null);

  useEffect(() => {
    if (auth === null) {
      resetDisplayPreferences();
    }
  }, [auth]);

  return (
    socket && (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login setAuth={(auth) => setAuth(auth)} />} />
          <Route path="/auth/callback" element={<AuthCallback setAuth={setAuth} />} />
          <Route
            element={
              <LoggedInRoute auth={auth} socket={socket}>
                <TimeContextKeeper updateFrequency={20 * 1000}>
                  <>
                    <ApplyUserPreferences />
                    <ErrorBoundary fallbackRender={fallback}>
                      <Layout />
                    </ErrorBoundary>
                  </>
                </TimeContextKeeper>
              </LoggedInRoute>
            }
          >
            <Route path="/" element={<Home />} />
            <Route path="/forum" element={<ThreadList />} />
            <Route path="/forum/post/new" element={<NewThread />} />
            <Route path="/forum/post/:threadId" element={<ThreadPage />} />
            <Route path="/games" element={<GameList />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/game/new" element={<NewGame />} />
            <Route path="/game/:gameId" element={<Game />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/profile/view/:username" element={<ViewProfile />} />
            <Route path="/preferences" element={<Preferences />} />
            <Route path="/*" element={<NoSuchRoute />} />
          </Route>
        </Routes>
      </BrowserRouter>
    )
  );
}
