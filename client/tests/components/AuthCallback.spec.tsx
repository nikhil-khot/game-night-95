import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AuthCallback from "../../src/components/AuthCallback";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("AuthCallback", () => {
  beforeEach(() => {
    // Adjust test setup to ensure proper simulation of window.location.search
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ username: "testuser" }),
        }),
      ),
    );
    Object.defineProperty(window, "location", {
      writable: true,
      value: { search: "?code=mockCode" },
    });
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("handles successful authentication", async () => {
    const mockSetAuth = vi.fn();

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ username: "testuser" }),
    } as Response);

    render(
      <MemoryRouter initialEntries={["/auth/callback?code=mockCode"]}>
        <AuthCallback setAuth={mockSetAuth} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockSetAuth).toHaveBeenCalledWith({
        user: { username: "testuser" },
        pass: "google-oauth",
        reset: expect.any(Function),
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("handles failed authentication", async () => {
    const mockSetAuth = vi.fn();

    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Auth failed" }),
    } as Response);

    render(
      <MemoryRouter initialEntries={["/auth/callback?code=mockCode"]}>
        <AuthCallback setAuth={mockSetAuth} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalled();
    });

    expect(mockSetAuth).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("redirects to login when code is missing", async () => {
    const mockSetAuth = vi.fn();

    Object.defineProperty(window, "location", {
      writable: true,
      value: { search: "" },
    });

    render(
      <MemoryRouter initialEntries={["/auth/callback"]}>
        <AuthCallback setAuth={mockSetAuth} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });

    expect(fetch).not.toHaveBeenCalled();
    expect(mockSetAuth).not.toHaveBeenCalled();
  });
});
