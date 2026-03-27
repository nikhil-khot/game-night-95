import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "../../src/services/api.ts";
import {
  createClub,
  joinClub,
  leaveClub,
  deleteClub,
  removeMember,
  setMemberRole,
  getClub,
  listClubs,
} from "../../src/services/clubService.ts";

vi.mock("axios");
vi.mock("../../src/services/api.ts", () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
  exceptionToErrorMsg: vi.fn((error) => ({ error: error.message || "Unknown error" })),
}));

const mockedApi = vi.mocked(api, true);

const auth = { username: "user1", password: "pwd123" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("clubService", () => {
  it("creates, joins, leaves, and deletes club", async () => {
    mockedApi.post.mockResolvedValueOnce({
      data: { name: "Alpha", description: "Test", members: [], createdAt: "" },
    });
    const created = await createClub(auth, "Alpha", "Test");
    expect(created).toEqual({ name: "Alpha", description: "Test", members: [], createdAt: "" });
    expect(mockedApi.post).toHaveBeenCalledWith("/api/club/create", {
      auth,
      payload: { name: "Alpha", description: "Test" },
    });

    mockedApi.post.mockResolvedValueOnce({ data: { name: "Alpha", members: [], createdAt: "" } });
    const joined = await joinClub(auth, "Alpha");
    expect(joined).toEqual({ name: "Alpha", members: [], createdAt: "" });
    expect(mockedApi.post).toHaveBeenCalledWith("/api/club/join", {
      auth,
      payload: { clubName: "Alpha" },
    });

    mockedApi.post.mockResolvedValueOnce({ data: { name: "Alpha", members: [], createdAt: "" } });
    const left = await leaveClub(auth, "Alpha");
    expect(left).toEqual({ name: "Alpha", members: [], createdAt: "" });
    expect(mockedApi.post).toHaveBeenCalledWith("/api/club/leave", {
      auth,
      payload: { clubName: "Alpha" },
    });

    mockedApi.post.mockResolvedValueOnce({ data: { success: true } });
    const deleted = await deleteClub(auth, "Alpha");
    expect(deleted).toEqual({ success: true });
    expect(mockedApi.post).toHaveBeenCalledWith("/api/club/delete", {
      auth,
      payload: { clubName: "Alpha" },
    });
  });

  it("handles removeMember and setMemberRole", async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { name: "Alpha", members: [] } });
    const removed = await removeMember(auth, "Alpha", "user2");
    expect(removed).toEqual({ name: "Alpha", members: [] });
    expect(mockedApi.post).toHaveBeenCalledWith("/api/club/remove-member", {
      auth,
      payload: { clubName: "Alpha", targetUsername: "user2" },
    });

    mockedApi.post.mockResolvedValueOnce({ data: { name: "Alpha", members: [] } });
    const role = await setMemberRole(auth, "Alpha", "user2", "admin");
    expect(role).toEqual({ name: "Alpha", members: [] });
    expect(mockedApi.post).toHaveBeenCalledWith("/api/club/set-member-role", {
      auth,
      payload: { clubName: "Alpha", targetUsername: "user2", newRole: "admin" },
    });
  });

  it("handles getClub and listClubs", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { name: "Alpha", members: [], createdAt: "" } });
    const club = await getClub("Alpha");
    expect(club).toEqual({ name: "Alpha", members: [], createdAt: "" });
    expect(mockedApi.get).toHaveBeenCalledWith("/api/club/Alpha");

    mockedApi.get.mockResolvedValueOnce({ data: [{ name: "Alpha", members: [], createdAt: "" }] });
    const clubs = await listClubs();
    expect(clubs).toEqual([{ name: "Alpha", members: [], createdAt: "" }]);
    expect(mockedApi.get).toHaveBeenCalledWith("/api/club/list");
  });

  it("converts network error to error message", async () => {
    mockedApi.post.mockRejectedValueOnce(new Error("Network is down"));
    const result = await createClub(auth, "Alpha", "Test");
    expect(result).toEqual({ error: "Network is down" });
  });
});
