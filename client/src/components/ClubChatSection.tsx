import MessageCreation from "./MessageCreation.tsx";
import MessageList from "./MessageList.tsx";
import useSocketsForClubChat from "../hooks/useSocketsForClubChat.ts";
import "./ClubChatSection.css";

interface ClubChatSectionProps {
  clubName: string;
}

export default function ClubChatSection({ clubName }: ClubChatSectionProps) {
  const { messages, handleMessageCreation } = useSocketsForClubChat(clubName);

  if (!messages) {
    return <div className="clubChatSection__loading">Loading club chat...</div>;
  }

  return (
    <div className="clubChatSection">
      <h4>Club Chat</h4>
      <MessageList messages={messages} />
      <MessageCreation handleMessageCreation={handleMessageCreation} />
    </div>
  );
}
