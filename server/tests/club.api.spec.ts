import { describe, expect, it } from "vitest";
import supertest from "supertest";
import { app } from "../src/app.ts";

const auth1 = { username: "user1", password: "pwd1111" };
const auth2 = { username: "user2", password: "pwd2222" };
const authInvalid = { username: "user1", password: "wrong" };

describe("Club controller API", () => {
  it("should validate payloads and auth", async () => {
    let res = await supertest(app)
      .post("/api/club/create")
      .send({ auth: auth1, payload: { bad: "x" } });
    expect(res.status).toBe(400);
    expect(res.body).toStrictEqual({ error: "Poorly-formed request" });

    res = await supertest(app)
      .post("/api/club/create")
      .send({ auth: authInvalid, payload: { name: "Alpha", description: "x" } });
    expect(res.status).toBe(403);
    expect(res.body).toStrictEqual({ error: "Invalid credentials" });
  });

  it("should allow create, join, leave, delete club flow", async () => {
    let res = await supertest(app)
      .post("/api/club/create")
      .send({ auth: auth1, payload: { name: "Alpha", description: "First club" } });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: "Alpha", members: [{ role: "owner" }] });

    res = await supertest(app)
      .post("/api/club/join")
      .send({ auth: auth2, payload: { clubName: "Alpha" } });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: "Alpha", members: expect.any(Array) });

    res = await supertest(app)
      .post("/api/club/leave")
      .send({ auth: auth2, payload: { clubName: "Alpha" } });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: "Alpha", members: [{ role: "owner" }] });

    res = await supertest(app)
      .post("/api/club/delete")
      .send({ auth: auth2, payload: { clubName: "Alpha" } });
    expect(res.status).toBe(200);
    expect(res.body).toStrictEqual({ error: "Only the owner can delete the club" });

    res = await supertest(app)
      .post("/api/club/delete")
      .send({ auth: auth1, payload: { clubName: "Alpha" } });
    expect(res.status).toBe(200);
    expect(res.body).toStrictEqual({ success: true });

    res = await supertest(app).get("/api/club/list");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("handles club not found on join/leave/delete", async () => {
    let res = await supertest(app)
      .post("/api/club/join")
      .send({ auth: auth1, payload: { clubName: "Nope" } });
    expect(res.status).toBe(200);
    expect(res.body).toStrictEqual({ error: 'Club "Nope" not found' });

    res = await supertest(app)
      .post("/api/club/leave")
      .send({ auth: auth1, payload: { clubName: "Nope" } });
    expect(res.status).toBe(200);
    expect(res.body).toStrictEqual({ error: 'Club "Nope" not found' });

    res = await supertest(app)
      .post("/api/club/delete")
      .send({ auth: auth1, payload: { clubName: "Nope" } });
    expect(res.status).toBe(200);
    expect(res.body).toStrictEqual({ error: 'Club "Nope" not found' });
  });
});
