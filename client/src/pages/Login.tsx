import useLoginForm from "../hooks/useLoginForm.ts";
import "./Login.css";
import { useState } from "react";
import { type AuthContext } from "../contexts/LoginContext.ts";
import { Button, Checkbox, Frame, Input } from "@react95/core";

interface LoginProps {
  setAuth: (s: AuthContext | null) => void;
}

/**
 * Renders a login form with username and password inputs, password visibility toggle,
 * and error handling.
 */
export default function Login({ setAuth }: LoginProps) {
  const { mode, username, password, confirm, err, handleInputChange, handleSubmit, toggleMode } =
    useLoginForm(setAuth);
  const [showPassword, setShowPassword] = useState(false);

  function handleGoogleLogin() {
    window.location.href = "/api/auth/google";
  }

  return (
    <div className="container">
      <h1>GameNite95!</h1>
      <Frame
        bgColor="$material"
        boxShadow="$out"
        padding="$4"
        className="outerFrame"
        style={{ width: "fit-content" }}
      >
        <Frame h="100%" boxShadow="$in" className="innerFrame">
          <form className="login" onSubmit={(e) => handleSubmit(e)}>
            <h2>Log into GameNite95!</h2>

            <Input
              type="text"
              value={username}
              onChange={(event) => handleInputChange(event, "username")}
              placeholder="Username"
              aria-label="Username"
              className="widefill"
            />

            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => handleInputChange(event, "password")}
              placeholder="Password"
              aria-label="Password"
              className="widefill"
            />

            {mode === "signup" && (
              <Input
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(event) => handleInputChange(event, "confirm")}
                placeholder="Confirm Password"
                aria-label="Confirm Password"
                className="widefill"
              />
            )}

            <div className="labeled-section">
              <Checkbox
                type="checkbox"
                id="showPasswordToggle"
                checked={showPassword}
                onChange={() => setShowPassword((prevShowPassword) => !prevShowPassword)}
              />
              <label htmlFor="showPasswordToggle">Show Password</label>
            </div>

            {err && <p className="error-message centered">{err}</p>}

            <Button type="submit" className=" primary">
              {mode === "signup" ? "Sign Up" : "Log In"}
            </Button>

            {mode === "login" && (
              <>
                <div className="intertext">or</div>
                <Button type="button" className=" secondary" onClick={handleGoogleLogin}>
                  Sign in with Google
                </Button>
              </>
            )}

            <div className="intertext">or</div>

            <Button type="button" className="secondary" onClick={toggleMode}>
              {mode === "signup" ? "Use Existing Account" : "Create New Account"}
            </Button>
          </form>
        </Frame>
      </Frame>
      <Frame
        bgColor="$material"
        boxShadow="$out"
        padding="$4"
        className="outerFrame"
        style={{ width: "fit-content", height: "fit-content" }}
      >
        <Frame h="100%" boxShadow="$in" className="innerFrame">
          <div className="smallAndGray" style={{ padding: "0.1rem" }}>
            GameNite stores passwords in cleartext; reusing passwords here is a catastrophically bad
            idea
          </div>
        </Frame>
      </Frame>
    </div>
  );
}
