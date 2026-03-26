import { UserPreferencesRepo } from "../../src/repository";
import { describe, it, expect, beforeEach } from "vitest";

const mockUserId = "test-user";
const mockPreferences = {
  userId: mockUserId,
  theme: "dark",
  fontSize: "medium",
  profilePictureUrl: "https://example.com/profile.jpg",
  banner: "https://example.com/banner.jpg",
  updatedAt: new Date().toISOString(),
};

describe("UserPreferencesRepo", () => {
  beforeEach(async () => {
    // Clear the repository before each test
    await UserPreferencesRepo.set(mockUserId, mockPreferences);
  });

  it("should save and retrieve user preferences correctly", async () => {
    const savedPreferences = await UserPreferencesRepo.find(mockUserId);
    expect(savedPreferences).toEqual(mockPreferences);
  });

  it("should update the banner field correctly", async () => {
    const updatedBanner = "https://example.com/new-banner.jpg";
    await UserPreferencesRepo.set(mockUserId, {
      ...mockPreferences,
      banner: updatedBanner,
    });

    const updatedPreferences = await UserPreferencesRepo.find(mockUserId);
    expect(updatedPreferences?.banner).toBe(updatedBanner);
  });

  it("should handle empty banner field correctly", async () => {
    await UserPreferencesRepo.set(mockUserId, {
      ...mockPreferences,
      banner: "",
    });

    const updatedPreferences = await UserPreferencesRepo.find(mockUserId);
    expect(updatedPreferences?.banner).toBe("");
  });
});
