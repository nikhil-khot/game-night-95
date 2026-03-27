import express from "express";
import type { Request, Response } from "express";
import { createUser, populateSafeUserInfo } from "../services/user.service.ts";
import { getUserByUsername } from "../services/auth.service.ts";

const router = express.Router();

type GoogleUser = {
  id: string;
  email: string;
  name: string;
};

router.get("/google", (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID ?? "";

  if (!clientId) {
    res.status(500).send("Missing GOOGLE_CLIENT_ID");
    return;
  }

  const redirectUri =
    process.env.NODE_ENV === "production"
      ? "https://spring26-project-group-110-1.onrender.com/auth/callback"
      : "http://localhost:4530/auth/callback";

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("redirect_uri", redirectUri);
  params.append("response_type", "code");
  params.append("scope", "openid email profile");

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

router.post("/google/callback", async (req: Request, res: Response) => {
  const { code } = req.body as { code?: unknown };

  if (typeof code !== "string" || code.trim() === "") {
    res.status(400).json({ error: "Code is required" });
    return;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";

  if (!clientId || !clientSecret) {
    res.status(500).json({ error: "Missing Google OAuth environment variables" });
    return;
  }

  const redirectUri =
    process.env.NODE_ENV === "production"
      ? "https://spring26-project-group-110-1.onrender.com/auth/callback"
      : "http://localhost:4530/auth/callback";

  const params = new URLSearchParams();
  params.append("code", code);
  params.append("client_id", clientId);
  params.append("client_secret", clientSecret);
  params.append("redirect_uri", redirectUri);
  params.append("grant_type", "authorization_code");

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    const rawTokenData = (await tokenRes.json()) as Record<string, unknown>;
    const accessToken = rawTokenData["access_token"];

    if (typeof accessToken !== "string") {
      throw new Error("Google token response did not include a valid access token");
    }

    const headers = new Headers();
    headers.append("Authorization", `Bearer ${accessToken}`);

    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers,
    });

    if (!userRes.ok) {
      const errorText = await userRes.text();
      throw new Error(`User fetch failed: ${errorText}`);
    }

    const googleUser = (await userRes.json()) as GoogleUser;
    const username = googleUser.id;

    const existingAuth = await getUserByUsername(username);

    if (existingAuth !== null) {
      const existingUser = await populateSafeUserInfo(existingAuth.userId);
      res.json(existingUser);
      return;
    }

    const createdUser = await createUser(username, "google-oauth", new Date());

    if ("error" in createdUser) {
      res.status(500).json(createdUser);
      return;
    }

    res.json(createdUser);
  } catch (err) {
    res.status(500).json({
      error: "Auth failed",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

export default router;
