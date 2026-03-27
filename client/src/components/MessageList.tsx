import "./MessageList.css";
import useLoginContext from "../hooks/useLoginContext.ts";
import type { ChatMessage } from "../util/types.ts";
import { useEffect, useRef, useState } from "react";
import useTimeSince from "../hooks/useTimeSince.ts";
import UserLink from "./UserLink.tsx";
import useFetchUserPreferences from "../hooks/useFetchUserPreferences.ts";
import ProfileAvatar from "./ProfileAvatar.tsx";
import { getUserPreferences } from "../services/userService.ts";
import type { MessageInfo } from "@gamenite/shared";

interface MessageListProps {
  messages: ChatMessage[];
}

function isMessageInfo(message: ChatMessage): message is MessageInfo {
  return !("meta" in message);
}

export default function MessageList({ messages }: MessageListProps) {
  const { user } = useLoginContext();
  const chatWindowRef = useRef<HTMLDivElement | null>(null);
  const userUrl = useFetchUserPreferences(user.username);
  const [otherUserUrls, setOtherUserUrls] = useState<Record<string, string>>({});

  const timeSince = useTimeSince();
  useEffect(() => {
    async function fetchOtherUserUrls() {
      const urls: Record<string, string> = {};
      for (const message of messages) {
        if (isMessageInfo(message)) {
          // Narrow the type to MessageInfo
          if (
            message.createdBy.username !== user.username &&
            !(message.createdBy.username in urls)
          ) {
            const response = await getUserPreferences(message.createdBy.username);
            if (response && typeof response === "object" && "profilePictureUrl" in response) {
              urls[message.createdBy.username] = response.profilePictureUrl || "";
            }
          }
        }
      }
      setOtherUserUrls(urls);
    }

    fetchOtherUserUrls();
  }, [messages, user.username]);

  useEffect(() => {
    if (!chatWindowRef.current) return;
    chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
  }, [messages]);

  return (
    <div className="chatWindow" ref={chatWindowRef}>
      <div className="chatScroller">
        {messages.map((message) => {
          if ("meta" in message) {
            if (message.meta === "move") {
              return (
                <div key={message.messageId} className="chatMoveLog">
                  <UserLink user={message.user} />
                  {message.moveDescription}
                </div>
              );
            }
            return (
              <div key={message.messageId} className="chatMeta">
                <UserLink user={message.user} /> {message.meta}
                {" chat "}
                {timeSince(message.dateTime)}
              </div>
            );
          }

          // Messages sent by the current user
          if (user.username === message.createdBy.username) {
            return (
              <div key={message.messageId} className="chatMe">
                <div className="chatContentWrapper">
                  <div className="chatContent">{message.text}</div>
                  <ProfileAvatar imageUrl={userUrl || ""} />
                </div>
                <div className="chatSender">{timeSince(message.createdAt)}</div>
              </div>
            );
          }

          // Messages sent by others
          return (
            <div key={message.messageId} className="chatOther">
              <div className="chatContentWrapper">
                <ProfileAvatar imageUrl={otherUserUrls[message.createdBy.username] || ""} />
                <div className="chatContent">{message.text}</div>
              </div>
              <div className="chatSender">
                <UserLink user={message.createdBy} /> {timeSince(message.createdAt)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
