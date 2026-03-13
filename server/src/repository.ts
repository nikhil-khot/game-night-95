import { createRepo } from "./keyv.ts";
import type {
  AuthRecord,
  ChatRecord,
  CommentRecord,
  GameRecord,
  MessageRecord,
  ThreadRecord,
  UserRecord,
  UserPreferencesRecord,
  FriendRecord,
  ClubRecord,
} from "./models.ts";

export const AuthRepo = createRepo<AuthRecord>("auth");
export const ChatRepo = createRepo<ChatRecord>("chat");
export const CommentRepo = createRepo<CommentRecord>("comment");
export const GameRepo = createRepo<GameRecord>("game");
export const MessageRepo = createRepo<MessageRecord>("message");
export const ThreadRepo = createRepo<ThreadRecord>("thread");
export const UserRepo = createRepo<UserRecord>("user");
export const UserPreferencesRepo = createRepo<UserPreferencesRecord>("user-preferences");
export const FriendRepo = createRepo<FriendRecord>("friend");
export const ClubRepo = createRepo<ClubRecord>("club");
