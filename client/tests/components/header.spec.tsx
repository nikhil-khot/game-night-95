import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Header from "../../src/components/Header.tsx";
import { LoginContext } from "../../src/contexts/LoginContext.ts";
import type { GameSocket } from "../../src/util/types.ts";

const mockedUseNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const mod = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...mod, useNavigate: () => mockedUseNavigate };
});
const mockedReset = vi.fn();

describe("Header component", () => {
  beforeEach(() => {
    mockedUseNavigate.mockReset();
    mockedReset.mockReset();
  });

  it("displays the display name, not the username", () => {
    render(
      <LoginContext
        value={{
          user: {
            userId: "id1",
            username: "username",
            display: "displayname",
            createdAt: new Date("01-02-2025"),
            bio: "",
          },
          pass: "pwd",
          socket: {} as GameSocket,
          reset: mockedReset,
        }}
      >
        <Header />
      </LoginContext>,
    );

    expect(screen.getByText(/displayname/)).not.toBeNull();
  });

  it("pressing the Close button causes a state reset and navigation", () => {
    render(
      <LoginContext
        value={{
          user: {
            userId: "id2",
            username: "username123",
            display: "displayname",
            createdAt: new Date("01-02-2025"),
            bio: "",
          },
          pass: "pwd",
          socket: { emit: vi.fn() } as unknown as GameSocket,
          reset: mockedReset,
        }}
      >
        <Header />
      </LoginContext>,
    );

    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(mockedReset).toHaveBeenCalledOnce();
    expect(mockedUseNavigate).toHaveBeenCalledExactlyOnceWith("/login");
  });
});
