import request from "supertest";
import express from "express";
import authRouter from "../../src/routes/auth.ts"; // Added .ts extension to resolve import issue
import nock from "nock";

describe("Auth Routes", () => {
  const app = express();
  app.use(express.json());
  app.use("/auth", authRouter);

  it("should redirect to Google OAuth URL on /google", async () => {
    process.env.GOOGLE_CLIENT_ID = "mock-client-id";
    process.env.MODE = "development";

    const response = await request(app).get("/auth/google");

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain("https://accounts.google.com/o/oauth2/v2/auth");
  });

  it("should return 400 if code is missing in /google/callback", async () => {
    const response = await request(app).post("/auth/google/callback").send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Code is required" });
  });

  it("should return 500 if Google OAuth environment variables are missing", async () => {
    process.env.GOOGLE_CLIENT_ID = "";
    process.env.GOOGLE_CLIENT_SECRET = "";

    const response = await request(app)
      .post("/auth/google/callback")
      .send({ code: "mock-code" });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Missing Google OAuth environment variables" });
  });

  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = "mock-client-id";
    process.env.GOOGLE_CLIENT_SECRET = "mock-client-secret";
    process.env.MODE = "development";
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it("should handle successful token exchange and user creation", async () => {
    nock("https://oauth2.googleapis.com")
      .post("/token")
      .reply(200, { access_token: "mock-access-token" });

    nock("https://www.googleapis.com")
      .get("/oauth2/v2/userinfo")
      .reply(200, { id: "mock-id", email: "mock@example.com", name: "Mock User" });

    const response = await request(app)
      .post("/auth/google/callback")
      .send({ code: "mock-code" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id", "mock-id");
  });

  it("should handle token exchange failure", async () => {
    nock("https://oauth2.googleapis.com")
      .post("/token")
      .reply(400, { error: "invalid_grant" });

    const response = await request(app)
      .post("/auth/google/callback")
      .send({ code: "mock-code" });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: "Auth failed",
      message: expect.stringContaining("Token exchange failed"),
    });
  });

  it("should handle user fetch failure", async () => {
    nock("https://oauth2.googleapis.com")
      .post("/token")
      .reply(200, { access_token: "mock-access-token" });

    nock("https://www.googleapis.com")
      .get("/oauth2/v2/userinfo")
      .reply(400, { error: "invalid_request" });

    const response = await request(app)
      .post("/auth/google/callback")
      .send({ code: "mock-code" });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: "Auth failed",
      message: expect.stringContaining("User fetch failed"),
    });
  });
});