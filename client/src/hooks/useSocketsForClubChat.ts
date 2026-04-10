import { useEffect, useState } from "react";
import type {
  ChatInfo,
  ChatNewMessagePayload,
  ChatUserJoinedPayload,
  ChatUserLeftPayload,
} from "@gamenite/shared";
import type { ChatMessage } from "../util/types.ts";
import useLoginContext from "./useLoginContext.ts";
import useAuth from "./useAuth.ts";

/**
 * Club chat socket hook mirroring game chat behavior.
 */
export default function useSocketsForClubChat(clubName: string) {
  const auth = useAuth();
  const { user, socket } = useLoginContext();
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const expectedChatId = `club:${clubName}`;

  useEffect(() => {
    const handleChatJoined = (chat: ChatInfo) => {
      socket.off("clubChatJoined", handleChatJoined);

      setMessages([
        ...chat.messages,
        { messageId: `meta${Math.random()}`, meta: "entered", user, dateTime: new Date() },
      ]);

      socket.on("clubChatNewMessage", handleNewMessage);
      socket.on("clubChatUserJoined", handleUserJoined);
      socket.on("clubChatUserLeft", handleUserLeft);
    };

    const handleNewMessage = (payload: ChatNewMessagePayload) => {
      if (payload.chatId !== expectedChatId) return;
      setMessages((oldMessages) => {
        if (!oldMessages) return null;
        return [...oldMessages, payload.message];
      });
    };

    const handleUserJoined = (payload: ChatUserJoinedPayload) => {
      if (payload.chatId !== expectedChatId) return;
      setMessages((oldMessages) => {
        if (!oldMessages) return null;
        return [
          ...oldMessages,
          {
            messageId: `meta${Math.random()}`,
            meta: "entered",
            user: payload.user,
            dateTime: new Date(),
          },
        ];
      });
    };

    const handleUserLeft = (payload: ChatUserLeftPayload) => {
      if (payload.chatId !== expectedChatId) return;
      setMessages((oldMessages) => {
        if (!oldMessages) return null;
        return [
          ...oldMessages,
          {
            messageId: `meta${Math.random()}`,
            meta: "left",
            user: payload.user,
            dateTime: new Date(),
          },
        ];
      });
    };

    socket.emit("clubChatJoin", { auth, payload: clubName });
    socket.on("clubChatJoined", handleChatJoined);

    return () => {
      socket.off("clubChatNewMessage", handleNewMessage);
      socket.off("clubChatUserJoined", handleUserJoined);
      socket.off("clubChatUserLeft", handleUserLeft);
      socket.off("clubChatJoined", handleChatJoined);
      // Intentionally do not emit "clubChatLeave" here so the socket
      // remains subscribed for global notifications (e.g., sidebar badge).
    };
  }, [socket, auth, clubName, user, expectedChatId]);

  function handleMessageCreation(text: string) {
    socket.emit("clubChatSendMessage", { auth, payload: { clubName, text } });
  }

  return { messages, handleMessageCreation };
}
