import MessageCreation from "./MessageCreation.tsx";
import MessageList from "./MessageList.tsx";
import useSocketsForFriendChat from "../hooks/useSocketsForFriendChat.ts";
import "./FriendChatSection.css";

interface FriendChatSectionProps {
  friendUsername: string;
  chatId: string;
}

export default function FriendChatSection({ friendUsername, chatId }: FriendChatSectionProps) {
  const { messages, handleMessageCreation } = useSocketsForFriendChat(chatId);

  if (!messages) {
    return <div className="friendChatSection__loading">Loading private chat...</div>;
  }

  return (
    <div className="friendChatSection">
      <h3>Private Chat with {friendUsername}</h3>
      <MessageList messages={messages} />
      <MessageCreation handleMessageCreation={handleMessageCreation} />
    </div>
  );
}
