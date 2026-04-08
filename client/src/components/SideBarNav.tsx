import "./SideBarNav.css";
import { useState } from "react";
import { NavLink, type NavLinkRenderProps } from "react-router-dom";
import useAuth from "../hooks/useAuth.ts";
import { List } from "@react95/core";

/**
 * The SideBarNav component contains the primary naviagation menu. It
 * highlights the currently selected page and triggers navigation when the
 * menu items are clicked.
 */
export default function SideBarNav() {
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const { username } = useAuth();

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

  const navClass = ({ isActive }: NavLinkRenderProps) =>
    `menu_button ${isActive ? "menu_selected" : ""}`;

  return (
    <List className="">
      <List.Item>
        <NavLink to="/" className={navClass}>
          Home
        </NavLink>
      </List.Item>
      <List.Divider />
      <List.Item>
        <NavLink to="/games" className={navClass}>
          Games
        </NavLink>
      </List.Item>
      <List.Divider />
      <List.Item>
        <NavLink to="/forum" className={navClass}>
          Forum
        </NavLink>
      </List.Item>
      <List.Divider />
      <List.Item>
        <NavLink to="/leaderboard" className={navClass}>
          Leaderboard
        </NavLink>
      </List.Item>
      <List.Divider />
      <List.Item>
        <NavLink to="/friends" className={navClass}>
          Friends
        </NavLink>
      </List.Item>
      <List.Divider />
      <List.Item>
        <NavLink to="/clubs" className={navClass}>
          Clubs
        </NavLink>
      </List.Item>
      <List.Divider />
      <List.Item>
        <NavLink to="/preferences" className={navClass}>
          Preferences
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
          Profile
        </NavLink>
      </List.Item>
      <List.Divider />
    </List>
  );
}
