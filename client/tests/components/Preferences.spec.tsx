import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Preferences from "../../src/pages/Preferences.tsx";

const { mockedGetUserPreferences, mockedUpdateUserPreferences, mockedApplyDisplayPreferences } =
  vi.hoisted(() => ({
    mockedGetUserPreferences: vi.fn(),
    mockedUpdateUserPreferences: vi.fn(),
    mockedApplyDisplayPreferences: vi.fn(),
  }));

vi.mock("../../src/hooks/useAuth.ts", () => ({
  default: () => ({ username: "user1", password: "pwd1111" }),
}));

vi.mock("../../src/services/userService.ts", () => ({
  getUserPreferences: mockedGetUserPreferences,
  updateUserPreferences: mockedUpdateUserPreferences,
}));

vi.mock("../../src/util/displayPreferences.ts", () => ({
  applyDisplayPreferences: mockedApplyDisplayPreferences,
}));

describe("Preferences page", () => {
  beforeEach(() => {
    mockedGetUserPreferences.mockReset();
    mockedUpdateUserPreferences.mockReset();
    mockedApplyDisplayPreferences.mockReset();
  });

  it("loads and displays saved preferences", async () => {
    mockedGetUserPreferences.mockResolvedValue({
      theme: "dark",
      fontSize: "large",
      updatedAt: new Date(),
    });

    render(<Preferences />);

    expect(mockedGetUserPreferences).toHaveBeenCalledExactlyOnceWith("user1");

    await waitFor(() => {
      expect(screen.getByLabelText(/Theme/i)).toHaveProperty("value", "dark");
      expect(screen.getByLabelText(/Font Size/i)).toHaveProperty("value", "large");
    });

    expect(mockedApplyDisplayPreferences).toHaveBeenCalledWith("dark", "large");
  });

  it("saves updated preferences", async () => {
    mockedGetUserPreferences.mockResolvedValue({ error: "ignored" });
    mockedUpdateUserPreferences.mockResolvedValue({
      theme: "dark",
      fontSize: "small",
      updatedAt: new Date(),
    });

    render(<Preferences />);

    fireEvent.change(screen.getByLabelText(/Theme/i), { target: { value: "dark" } });
    fireEvent.change(screen.getByLabelText(/Font Size/i), { target: { value: "small" } });
    fireEvent.click(screen.getByText(/Save Preferences/i));

    await waitFor(() => {
      expect(mockedUpdateUserPreferences).toHaveBeenCalledExactlyOnceWith(
        { username: "user1", password: "pwd1111" },
        { theme: "dark", fontSize: "small" },
      );
    });

    expect(screen.getByText(/Preferences saved\./i)).not.toBeNull();
    expect(mockedApplyDisplayPreferences).toHaveBeenCalledWith("dark", "small");
  });

  it("shows an error when save fails", async () => {
    mockedGetUserPreferences.mockResolvedValue({ error: "ignored" });
    mockedUpdateUserPreferences.mockResolvedValue({ error: "nope" });

    render(<Preferences />);
    fireEvent.click(screen.getByText(/Save Preferences/i));

    await waitFor(() => {
      expect(screen.getByText(/Could not save preferences\./i)).not.toBeNull();
    });
  });
});
