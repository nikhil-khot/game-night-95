import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ApplyUserPreferences from "../../src/components/ApplyUserPreferences.tsx";

const { mockedGetUserPreferences, mockedApplyDisplayPreferences } = vi.hoisted(() => ({
  mockedGetUserPreferences: vi.fn(),
  mockedApplyDisplayPreferences: vi.fn(),
}));

vi.mock("../../src/hooks/useAuth.ts", () => ({
  default: () => ({ username: "user1" }),
}));

vi.mock("../../src/services/userService.ts", () => ({
  getUserPreferences: mockedGetUserPreferences,
}));

vi.mock("../../src/util/displayPreferences.ts", () => ({
  applyDisplayPreferences: mockedApplyDisplayPreferences,
}));

describe("ApplyUserPreferences", () => {
  beforeEach(() => {
    mockedGetUserPreferences.mockReset();
    mockedApplyDisplayPreferences.mockReset();
  });

  it("loads and applies saved preferences", async () => {
    mockedGetUserPreferences.mockResolvedValue({
      theme: "dark",
      fontSize: "small",
      updatedAt: new Date(),
    });

    render(<ApplyUserPreferences />);

    await waitFor(() => {
      expect(mockedGetUserPreferences).toHaveBeenCalledExactlyOnceWith("user1");
      expect(mockedApplyDisplayPreferences).toHaveBeenCalledExactlyOnceWith("dark", "small");
    });
  });

  it("does not apply preferences when API returns error", async () => {
    mockedGetUserPreferences.mockResolvedValue({ error: "no preferences" });

    render(<ApplyUserPreferences />);

    await waitFor(() => {
      expect(mockedGetUserPreferences).toHaveBeenCalledExactlyOnceWith("user1");
    });

    expect(mockedApplyDisplayPreferences).not.toHaveBeenCalled();
  });
});
