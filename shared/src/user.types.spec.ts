import { describe, expect, it } from "vitest";
import { zUserPreferencesUpdateRequest } from "./user.types.ts";

describe("zUserPreferencesUpdateRequest", () => {
  it("accepts valid updates", () => {
    expect(zUserPreferencesUpdateRequest.safeParse({ theme: "dark" })).toStrictEqual({
      success: true,
      data: { theme: "dark" },
    });

    expect(
      zUserPreferencesUpdateRequest.safeParse({
        fontSize: "large",
        banner: {
          imageUrl: "https://example.com/banner.png",
          position: "bottom",
          overlayOpacity: 0.5,
        },
      }),
    ).toStrictEqual({
      success: true,
      data: {
        fontSize: "large",
        banner: {
          imageUrl: "https://example.com/banner.png",
          position: "bottom",
          overlayOpacity: 0.5,
        },
      },
    });
  });

  it("rejects invalid updates", () => {
    expect(zUserPreferencesUpdateRequest.safeParse({ theme: "system" })).toMatchObject({
      success: false,
    });
    expect(zUserPreferencesUpdateRequest.safeParse({ fontSize: "huge" })).toMatchObject({
      success: false,
    });
    expect(
      zUserPreferencesUpdateRequest.safeParse({ banner: { overlayOpacity: 1.1 } }),
    ).toMatchObject({ success: false });
  });
});
