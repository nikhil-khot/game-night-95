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
 * Private friend chat socket hook.
 */
export default function useSocketsForFriendChat(chatId: string) {
  const auth = useAuth();
  const { user, socket } = useLoginContext();
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);

  useEffect(() => {
    if (!chatId) return;

    const handleChatJoined = (chat: ChatInfo) => {
      if (chat.chatId !== chatId) return;
      socket.off("friendChatJoined", handleChatJoined);

      setMessages([
        ...chat.messages,
        { messageId: `meta${Math.random()}`, meta: "entered", user, dateTime: new Date() },
      ]);

      socket.on("friendChatNewMessage", handleNewMessage);
      socket.on("friendChatUserJoined", handleUserJoined);
      socket.on("friendChatUserLeft", handleUserLeft);
    };

    const handleNewMessage = (payload: ChatNewMessagePayload) => {
      if (payload.chatId !== chatId) return;
      setMessages((oldMessages) => {
        if (!oldMessages) return null;
        return [...oldMessages, payload.message];
      });
    };

    const handleUserJoined = (payload: ChatUserJoinedPayload) => {
      if (payload.chatId !== chatId) return;
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
      if (payload.chatId !== chatId) return;
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

    socket.emit("friendChatJoin", { auth, payload: chatId });
    socket.on("friendChatJoined", handleChatJoined);

    return () => {
      socket.off("friendChatNewMessage", handleNewMessage);
      socket.off("friendChatUserJoined", handleUserJoined);
      socket.off("friendChatUserLeft", handleUserLeft);
      socket.off("friendChatJoined", handleChatJoined);
      socket.emit("friendChatLeave", { auth, payload: chatId });
    };
  }, [socket, auth, chatId, user]);

  function handleMessageCreation(text: string) {
    socket.emit("friendChatSendMessage", { auth, payload: { chatId, text } });
  }

  return { messages, handleMessageCreation };
}
