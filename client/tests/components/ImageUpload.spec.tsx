import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import ImageUpload from "../../src/components/ImageUpload";

// Small helper to create a fake image file (PNG) with given dimensions via canvas
function createFakeImageFile(size = 2_000_000, name = "test.png") {
  const blob = new Blob([new Uint8Array(size)], { type: "image/png" });
  return Promise.resolve(new File([blob], name, { type: "image/png" }));
}

describe("ImageUpload", () => {
  it("resizes large images and calls onChange with a File", async () => {
    const onChange = vi.fn();
    // Mock Image loading and canvas methods used by the resizing code
    // Allow using the global `Image` property name (PascalCase) here
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const win = window as unknown as { Image?: typeof Image };
    const originalImage = win.Image;

    class MockImage {
      width = 2000;
      height = 1200;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_s: string) {
        // call onload asynchronously to mimic browser
        setTimeout(() => this.onload && this.onload());
      }
    }

    win.Image = MockImage as unknown as typeof Image;

    // Provide minimal canvas methods used by the component
    // Assign via `any` to avoid TypeScript overload mismatch on `getContext`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (HTMLCanvasElement.prototype as any).getContext = function () {
      const ctx = {
        drawImage: (..._args: unknown[]) => {},
      } as unknown as CanvasRenderingContext2D;
      return ctx;
    };

    HTMLCanvasElement.prototype.toBlob = function (cb: (b: Blob | null) => void): void {
      cb(new Blob([new Uint8Array(1000)], { type: "image/jpeg" }));
    };

    const { container } = render(<ImageUpload onChange={onChange} />);
    const input = container.querySelector("input[type=file]") as HTMLInputElement;

    // Create large fake image
    const largeFile = await createFakeImageFile(2_000_000, "large.png");

    // Fire change event
    const fileList = {
      0: largeFile,
      length: 1,
      item: (i: number) => (i === 0 ? largeFile : null),
    } as unknown as FileList;

    fireEvent.change(input, {
      target: { files: fileList },
    });

    await waitFor(() => expect(onChange).toHaveBeenCalled());

    const calledFile = onChange.mock.calls[0][0] as File;
    expect(calledFile).toBeInstanceOf(File);
    expect(calledFile.name).toBe("large.png");
    // Resized file should be smaller than original blob size
    expect(calledFile.size).toBeLessThan(largeFile.size);

    // restore mocks
    win.Image = originalImage;
  });
});
