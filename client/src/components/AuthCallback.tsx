import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { AuthContext } from "../contexts/LoginContext.ts";
import type { SafeUserInfo } from "@gamenite/shared";

interface AuthCallbackProps {
  setAuth: React.Dispatch<React.SetStateAction<AuthContext | null>>;
}

export default function AuthCallback({ setAuth }: AuthCallbackProps) {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleAuth() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (!code) {
        navigate("/login");
        return;
      }

      try {
        const res = await fetch("/api/auth/google/callback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Auth failed");
        }

        const user = (await res.json()) as SafeUserInfo;

        setAuth({
          user,
          pass: "google-oauth",
          reset: () => setAuth(null),
        });

        navigate("/");
      } catch {
        navigate("/login");
      }
    }

    void handleAuth();
  }, [navigate, setAuth]);

  return <div>Logging you in...</div>;
}
