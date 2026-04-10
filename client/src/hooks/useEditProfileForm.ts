import { type SubmitEvent, useState } from "react";
import useLoginContext from "./useLoginContext.ts";
import useAuth from "./useAuth.ts";
import { updateUser, updateUserPreferences } from "../services/userService.ts";
import type { UserUpdateRequest } from "@gamenite/shared";

/**
 * Custom hook to manage profile form logic
 * @returns an object containing
 *  - Form values `display`, `password`, and `confirm`
 *  - Form setters `setDisplay`, `setPassword`, and `setConfirm`
 *  - Possibly-null error message `err`
 *  - Submission handler `handleSubmit`
 */
export default function useEditProfileForm() {
  const { user, reset } = useLoginContext();
  const [display, setDisplay] = useState(user.display);
  const [bio, setBio] = useState(user.bio ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [err, setErr] = useState<null | string>(null);
  const auth = useAuth();

  /**
   * Handles submission of the form
   */
  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const hasProfilePictureUpdate = profilePictureUrl !== "";
    const hasBannerImageUpdate = bannerImageUrl !== "";

    if (
      user.display === display &&
      user.bio === bio &&
      password === confirm &&
      password === "" &&
      !hasProfilePictureUpdate &&
      !hasBannerImageUpdate
    ) {
      setErr("No changes to submit");
      return;
    }

    if (display.trim() !== display) {
      setErr("Display names can't begin or end with whitespace");
      return;
    }

    if (display.trim() === "") {
      setErr("Please enter a display name");
      return;
    }

    if (bio.length > 500) {
      setErr("Bio must be 500 characters or fewer");
      return;
    }

    if (password.trim() !== password) {
      setErr("Passwords can't begin or end with whitespace");
      return;
    }

    if (password !== confirm) {
      setErr("Passwords don't match");
      return;
    }

    if (hasProfilePictureUpdate) {
      const prefsResponse = await updateUserPreferences(auth, {
        profilePictureUrl,
      });
      if ("error" in prefsResponse) {
        setErr(prefsResponse.error);
        return;
      }
    }

    if (hasBannerImageUpdate) {
      const prefsResponse = await updateUserPreferences(auth, {
        bannerImageUrl,
      });
      if ("error" in prefsResponse) {
        setErr(prefsResponse.error);
        return;
      }
    }

    const updates: UserUpdateRequest = {};
    if (display !== user.display) updates.display = display;
    if (bio !== user.bio) updates.bio = bio;
    if (password !== "") updates.password = password;

    if (Object.keys(updates).length > 0) {
      const response = await updateUser(auth, updates);
      if ("error" in response) {
        setErr(response.error);
        return;
      }
    }

    // We need to do this — or do something else that resets the login context
    reset();
  };

  return {
    display,
    setDisplay,
    bio,
    setBio,
    password,
    setPassword,
    confirm,
    setConfirm,
    profilePictureUrl,
    setProfilePictureUrl,
    bannerImageUrl,
    setBannerImageUrl,
    err,
    handleSubmit,
  };
}
