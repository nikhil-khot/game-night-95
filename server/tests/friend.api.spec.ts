import { describe, expect, it } from "vitest";
import supertest, { type Response } from "supertest";
import { app } from "../src/app.ts";

let response: Response;

const auth1 = { username: "user1", password: "pwd1111" };
const auth2 = { username: "user2", password: "pwd2222" };
const authInvalid = { username: "user1", password: "wrong" };

describe("Friend controller API", () => {
  it("should reject poorly-formed send request payload", async () => {
    response = await supertest(app)
      .post("/api/friend/send")
      .send({ auth: auth1, payload: { bad: 1 } });
    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({ error: "Poorly-formed request" });
  });

  it("should reject invalid auth on send request", async () => {
    response = await supertest(app)
      .post("/api/friend/send")
      .send({ auth: authInvalid, payload: { toUsername: "user2" } });
    expect(response.status).toBe(403);
    expect(response.body).toStrictEqual({ error: "Invalid credentials" });
  });

  it("should send friend request, list pending, respond, then list friends", async () => {
    response = await supertest(app)
      .post("/api/friend/send")
      .send({ auth: auth1, payload: { toUsername: "user2" } });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      fromUserId: expect.any(String),
      toUserId: expect.any(String),
      status: "pending",
    });

    response = await supertest(app).get("/api/friend/pending").query({ username: "user2" });
    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { username: "user1", display: expect.any(String), createdAt: expect.any(String) },
    ]);

    response = await supertest(app)
      .post("/api/friend/respond")
      .send({ auth: auth2, payload: { fromUsername: "user1", response: "accepted" } });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: "accepted" });

    response = await supertest(app).get("/api/friend/list").query({ username: "user1" });
    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { username: "user2", display: expect.any(String), createdAt: expect.any(String) },
    ]);

    response = await supertest(app)
      .post("/api/friend/remove")
      .send({ auth: auth1, payload: { targetUsername: "user2" } });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({ success: true });

    response = await supertest(app).get("/api/friend/list").query({ username: "user1" });
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("handles missing query parameters on pending", async () => {
    response = await supertest(app).get("/api/friend/pending").query({});
    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({ error: "Missing or invalid username parameter" });
  });

  it("returns not found for both converted number and unknown username", async () => {
    response = await supertest(app).get("/api/friend/list").query({ username: 123 });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({ error: "User 123 not found" });

    response = await supertest(app).get("/api/friend/list").query({ username: "ghost" });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({ error: "User ghost not found" });
  });

  it("handles responded request for non-existent request and invalid respond payload", async () => {
    response = await supertest(app)
      .post("/api/friend/respond")
      .send({ auth: auth2, payload: { fromUsername: "user1", response: "declined" } });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({ error: "No friend request found between these users" });

    response = await supertest(app)
      .post("/api/friend/respond")
      .send({ auth: auth2, payload: { bad: true } });
    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({ error: "Poorly-formed request" });
  });
});
