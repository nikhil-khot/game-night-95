import { describe, it, expect, vi } from "vitest";
import { loginWithGoogle } from "../../src/services/userService";

describe("loginWithGoogle", () => {
  it("should return SafeUserInfo when the API call is successful", async () => {
    const mockResponse = { id: "123", username: "testuser" };
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(mockResponse),
    });

    const result = await loginWithGoogle("mockCode");
    expect(result).toEqual(mockResponse);
  });

  it("should return ErrorMsg when the API call fails", async () => {
    const mockError = { error: "Invalid code" };
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(mockError),
    });

    const result = await loginWithGoogle("invalidCode");
    expect(result).toEqual(mockError);
  });
});