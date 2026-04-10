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
      }),
    ).toStrictEqual({
      success: true,
      data: {
        fontSize: "large",
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
      zUserPreferencesUpdateRequest.safeParse({ bannerImageUrl: { overlayOpacity: 1.1 } }),
    ).toMatchObject({ success: false });
  });
});
