import { UserPreferencesRepo } from "../../src/repository.js";
import { describe, it, expect, beforeEach } from "vitest";
import type { UserPreferencesRecord } from "../../src/models.js";

const MOCK_USER_ID = "test-user";
const mockPreferences: UserPreferencesRecord = {
  userId: MOCK_USER_ID,
  theme: "dark",
  fontSize: "medium",
  profilePictureUrl: "https://example.com/profile.jpg",
  bannerImageUrl: "https://example.com/banner.jpg",
  updatedAt: new Date().toISOString(),
};

describe("UserPreferencesRepo", () => {
  beforeEach(async () => {
    // Clear the repository before each test
    await UserPreferencesRepo.set(MOCK_USER_ID, mockPreferences);
  });

  it("should save and retrieve user preferences correctly", async () => {
    const savedPreferences = await UserPreferencesRepo.find(MOCK_USER_ID);
    expect(savedPreferences).toEqual(mockPreferences);
  });

  it("should update the bannerImageUrl field correctly", async () => {
    const updatedBanner = "https://example.com/new-banner.jpg";
    await UserPreferencesRepo.set(MOCK_USER_ID, {
      ...mockPreferences,
      bannerImageUrl: updatedBanner, // Updated property name
    });

    const updatedPreferences = await UserPreferencesRepo.find(MOCK_USER_ID);
    expect(updatedPreferences?.bannerImageUrl).toBe(updatedBanner); // Updated property name
  });

  it("should handle empty bannerImageUrl field correctly", async () => {
    await UserPreferencesRepo.set(MOCK_USER_ID, {
      ...mockPreferences,
      bannerImageUrl: "", // Updated property name
    });

    const updatedPreferences = await UserPreferencesRepo.find(MOCK_USER_ID);
    expect(updatedPreferences?.bannerImageUrl).toBe(""); // Updated property name
  });
});
