/* eslint no-console: "off" */

import express, { Router } from "express";
import { Server } from "socket.io";
import { z } from "zod";
import * as http from "node:http";
import * as chat from "./controllers/chat.controller.ts";
import * as game from "./controllers/game.controller.ts";
import * as user from "./controllers/user.controller.ts";
import * as thread from "./controllers/thread.controller.ts";
import * as friend from "./controllers/friend.controller.ts";
import * as club from "./controllers/club.controller.ts";
import * as clubChat from "./controllers/clubChat.controller.ts";
import { type GameServer } from "./types.ts";
import {
  handleSocketDisconnect,
  handleUserPresenceOnline,
  handleUserPresenceOffline,
  handleUserPresenceQuery,
} from "./services/presence.service.ts";
import authRouter from "./routes/auth.ts";

export const app = express();
export const httpServer = http.createServer(app);
const io: GameServer = new Server(httpServer);

app.use(express.json());

app.use(
  "/api",
  Router()
    .use(
      "/game",
      express
        .Router() //
        .post("/create", game.postCreate)
        .get("/list", game.getList)
        .get("/:id", game.getById),
    )
    .use(
      "/thread",
      express
        .Router() //
        .post("/create", thread.postCreate)
        .get("/list", thread.getList)
        .get("/:id", thread.getById)
        .post("/:id/comment", thread.postByIdComment)
        .post("/:id/upvote", thread.postByIdUpvote)
        .post("/:id/downvote", thread.postByIdDownvote),
    )
    .use(
      "/user",
      Router() // Any concrete routes here should be disallowed as usernames
        .post("/list", user.postList)
        .post("/login", user.postLogin)
        .post("/signup", user.postSignup)
        .get("/:username/preferences", user.getByUsernamePreferences)
        .post("/:username/preferences", user.postByUsernamePreferences)
        .post("/:username", user.postByUsername)
        .get("/:username", user.getByUsername),
    )
    .use(
      "/friend",
      Router()
        .post("/send", friend.postSendRequest)
        .post("/respond", friend.postRespondRequest)
        .post("/remove", friend.postRemoveFriend)
        .get("/list", friend.getList)
        .get("/pending", friend.getPending),
    )
    .use(
      "/club",
      Router()
        .post("/create", club.postCreate)
        .post("/join", club.postJoin)
        .post("/leave", club.postLeave)
        .post("/delete", club.postDelete)
        .post("/remove-member", club.postRemoveMember)
        .post("/set-member-role", club.postSetMemberRole)
        .get("/list", club.getList)
        .get("/:name", club.getByName),
    ),
);

app.use("/api/auth", authRouter);

io.on("connection", (socket) => {
  const socketId = socket.id;
  console.log(`CONN [${socketId}] connected`);

  socket.on("disconnect", () => {
    handleSocketDisconnect(io, socketId);
    console.log(`CONN [${socketId}] disconnected`);
  });

  socket.on("chatJoin", chat.socketJoin(socket, io));
  socket.on("chatLeave", chat.socketLeave(socket, io));
  socket.on("chatSendMessage", chat.socketSendMessage(socket, io));
  socket.on("clubChatJoin", clubChat.socketJoin(socket, io));
  socket.on("clubChatLeave", clubChat.socketLeave(socket, io));
  socket.on("clubChatSendMessage", clubChat.socketSendMessage(socket, io));

  socket.on("gameJoinAsPlayer", game.socketJoinAsPlayer(socket, io));
  socket.on("gameAddAI", game.socketAddAI(socket, io));
  socket.on("gameMakeMove", game.socketMakeMove(socket, io));
  socket.on("gameStart", game.socketStart(socket, io));
  socket.on("gameWatch", game.socketWatch(socket, io));
  socket.on("userPresenceOnline", handleUserPresenceOnline(io, socketId));
  socket.on("userPresenceOffline", handleUserPresenceOffline(io, socketId));
  socket.on("userPresenceQuery", handleUserPresenceQuery(io, socketId));

  socket.onAny((name, payload) => {
    const zPayload = z.object({ auth: z.object({ username: z.string() }), payload: z.any() });
    const checked = zPayload.safeParse(payload);

    if (checked.error) {
      console.log(`RECV error: ${checked.error.message}`);
    } else {
      console.log(
        `RECV [${socketId}] got ${name}${checked.data.auth.username} ${JSON.stringify(checked.data.payload)}`,
      );
    }
  });
  socket.onAnyOutgoing((name) => {
    console.log(`SEND [${socketId}] gets ${name}`);
  });
});
