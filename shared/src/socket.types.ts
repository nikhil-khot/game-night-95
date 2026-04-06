import {
  type ChatInfo,
  type ChatMoveLogPayload,
  type ChatNewMessagePayload,
  type ChatUserJoinedPayload,
  type ChatUserLeftPayload,
} from "./chat.types.ts";
import { type NewClubMessagePayload } from "./club.types.ts";
import { type NewMessagePayload } from "./message.types.ts";
import { type WithAuth } from "./auth.types.ts";
import { type GameMakeMovePayload, type GamePlayInfo, type TaggedGameView } from "./game.types.ts";
import { type SafeUserInfo } from "./user.types.ts";

/**
 * The Socket.io interface for client to server communication
 */
export interface ClientToServerEvents {
  chatJoin: (payload: WithAuth<string>) => void;
  chatLeave: (payload: WithAuth<string>) => void;
  chatSendMessage: (payload: WithAuth<NewMessagePayload>) => void;
  friendChatJoin: (payload: WithAuth<string>) => void;
  friendChatLeave: (payload: WithAuth<string>) => void;
  friendChatSendMessage: (payload: WithAuth<NewMessagePayload>) => void;
  clubChatJoin: (payload: WithAuth<string>) => void;
  clubChatLeave: (payload: WithAuth<string>) => void;
  clubChatSendMessage: (payload: WithAuth<NewClubMessagePayload>) => void;
  gameJoinAsPlayer: (payload: WithAuth<string>) => void;
  gameAddAI: (payload: WithAuth<{ gameId: string; aiType: string }>) => void;
  gameMakeMove: (payload: WithAuth<GameMakeMovePayload>) => void;
  gameStart: (payload: WithAuth<string>) => void;
  gameWatch: (payload: WithAuth<string>) => void;
}

/**
 * The Socket.io interface for server to client information
 */
export interface ServerToClientEvents {
  chatJoined: (payload: ChatInfo) => void;
  chatMoveLog: (payload: ChatMoveLogPayload) => void;
  chatNewMessage: (payload: ChatNewMessagePayload) => void;
  chatUserJoined: (payload: ChatUserJoinedPayload) => void;
  chatUserLeft: (payload: ChatUserLeftPayload) => void;
  friendChatJoined: (payload: ChatInfo) => void;
  friendChatNewMessage: (payload: ChatNewMessagePayload) => void;
  friendChatUserJoined: (payload: ChatUserJoinedPayload) => void;
  friendChatUserLeft: (payload: ChatUserLeftPayload) => void;
  clubChatJoined: (payload: ChatInfo) => void;
  clubChatNewMessage: (payload: ChatNewMessagePayload) => void;
  clubChatUserJoined: (payload: ChatUserJoinedPayload) => void;
  clubChatUserLeft: (payload: ChatUserLeftPayload) => void;
  gamePlayersUpdated: (payload: SafeUserInfo[]) => void;
  gameStateUpdated: (payload: TaggedGameView & { forPlayer: boolean }) => void;
  gameWatched: (payload: GamePlayInfo) => void;
}
