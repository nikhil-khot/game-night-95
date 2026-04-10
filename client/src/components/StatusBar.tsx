import "./StatusBar.css";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

function formatTime(date: Date): string {
  // Match classic Windows-style clock: h:mm AM/PM
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function useClock(): string {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  return useMemo(() => formatTime(now), [now]);
}

function usePageTitle(): string {
  const { pathname } = useLocation();

  const section = useMemo(() => {
    if (pathname.startsWith("/games")) return "Games";
    if (pathname.startsWith("/forum")) return "Forum";
    if (pathname.startsWith("/leaderboard")) return "Leaderboard";
    if (pathname.startsWith("/friends")) return "Friends";
    if (pathname.startsWith("/clubs")) return "Clubs";
    if (pathname.startsWith("/preferences")) return "Preferences";
    if (pathname.startsWith("/profile")) return "Profile";
    if (pathname.startsWith("/game")) return "Game";
    return "Home";
  }, [pathname]);

  return `${section} \\ GameNite95!`;
}

export default function StatusBar() {
  const time = useClock();
  const title = usePageTitle();

  return (
    <div className="statusBar">
      <div className="statusBar-left">
        <div className="statusBar-window">
          <span className="statusBar-windowTitle">{title}</span>
        </div>
      </div>
      <div className="statusBar-right">
        <div className="statusBar-tray">
          <div className="statusBar-trayIcon" aria-hidden="true" />
          <div className="statusBar-trayIcon statusBar-trayIcon--bars" aria-hidden="true" />
          <div className="statusBar-trayDivider" />
          <div className="statusBar-clock" aria-label="Current time">
            {time}
          </div>
        </div>
      </div>
    </div>
  );
}
