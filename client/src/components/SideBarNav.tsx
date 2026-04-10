import "./SideBarNav.css";
import { useEffect, useState } from "react";
import { NavLink, type NavLinkRenderProps, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth.ts";
import useLoginContext from "../hooks/useLoginContext.ts";
import { usePendingRequests } from "../hooks/useFriendList.ts";
import { List } from "@react95/core";
import {
  Computer3,
  MediaVideo,
  Mailnews15,
  Wab321019,
  Inetcpl1302,
  Mshtml32542,
  Internat151,
  User,
} from "@react95/icons";

/**
 * The SideBarNav component contains the primary naviagation menu. It
 * highlights the currently selected page and triggers navigation when the
 * menu items are clicked.
 */
export default function SideBarNav() {
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [friendBadgeDismissed, setFriendBadgeDismissed] = useState(false);
  const [clubNotificationCount, setClubNotificationCount] = useState(0);

  const auth = useAuth();
  const { socket } = useLoginContext();
  const { pathname } = useLocation();

  const username = auth.username;

  const pendingRequests = usePendingRequests(username);
  const friendNotificationCount = "message" in pendingRequests ? 0 : pendingRequests.length;

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

  useEffect(() => {
    const handleNewClubMessage = (payload: { chatId: string }) => {
      if (!payload.chatId.startsWith("club:")) return;
      if (pathname === "/clubs") return; // don't count while already viewing clubs
      setClubNotificationCount((count) => count + 1);
    };

    socket.on("clubChatNewMessage", handleNewClubMessage);

    return () => {
      socket.off("clubChatNewMessage", handleNewClubMessage);
    };
  }, [socket, pathname]);

  const navClass = ({ isActive }: NavLinkRenderProps) =>
    `menu_button ${isActive ? "menu_selected" : ""}`;

  return (
    <List className="sideBarNav">
      <List.Item>
        <NavLink to="/" className={navClass}>
          <span className="menu_icon" aria-hidden="true">
            <Computer3 variant="16x16_4" />
          </span>
          <span className="menu_label">Home</span>
        </NavLink>
      </List.Item>
      <List.Divider />
      <List.Item>
        <NavLink to="/games" className={navClass}>
          <span className="menu_icon" aria-hidden="true">
            <MediaVideo variant="16x16_4" />
          </span>
          <span className="menu_label">Games</span>
        </NavLink>
      </List.Item>
      <List.Divider />
      <List.Item>
        <NavLink to="/forum" className={navClass}>
          <span className="menu_icon" aria-hidden="true">
            <Mailnews15 variant="16x16_4" />
          </span>
          <span className="menu_label">Forum</span>
        </NavLink>
      </List.Item>
      <List.Divider />
      <List.Item>
        <NavLink to="/leaderboard" className={navClass}>
          <span className="menu_icon" aria-hidden="true">
            <Inetcpl1302 />
          </span>
          <span className="menu_label">Leaderboard</span>
        </NavLink>
      </List.Item>
      <List.Divider />
      <List.Item>
        <NavLink to="/friends" className={navClass} onClick={() => setFriendBadgeDismissed(true)}>
          <span className="menu_icon" aria-hidden="true">
            <Wab321019 />
          </span>
          <span className="menu_label">
            Friends
            {friendNotificationCount > 0 && !friendBadgeDismissed && (
              <span className="menu_badge">{friendNotificationCount}</span>
            )}
          </span>
        </NavLink>
      </List.Item>
      <List.Divider />
      <List.Item>
        <NavLink to="/clubs" className={navClass} onClick={() => setClubNotificationCount(0)}>
          <span className="menu_icon" aria-hidden="true">
            <Mshtml32542 variant="16x16_4" />
          </span>
          <span className="menu_label">
            Clubs
            {clubNotificationCount > 0 && (
              <span className="menu_badge">{clubNotificationCount}</span>
            )}
          </span>
        </NavLink>
      </List.Item>
      <List.Divider />
      <List.Item>
        <NavLink to="/preferences" className={navClass}>
          <span className="menu_icon" aria-hidden="true">
            <Internat151 variant="16x16_4" />
          </span>
          <span className="menu_label">Preferences</span>
        </NavLink>
      </List.Item>
      <List.Divider />
      <List.Item>
        <NavLink
          to={`/profile/${username}`}
          id="menu_user"
          className={navClass}
          onClick={toggleOptions}
        >
          <span className="menu_icon" aria-hidden="true">
            <User variant="16x16_4" />
          </span>
          <span className="menu_label">Profile</span>
        </NavLink>
      </List.Item>
      <List.Divider />
    </List>
  );
}
