import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import ProfileAvatar from "../../client/src/components/ProfileAvatar";

describe("ProfileAvatar", () => {
  it("renders fallback SVG when no URL provided", () => {
    const { container } = render(<ProfileAvatar imageUrl={""} />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
  });

  it("renders img when URL provided", () => {
    const { container } = render(<ProfileAvatar imageUrl={"http://example.com/a.png"} />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img!.getAttribute("src")).toBe("http://example.com/a.png");
  });
});
