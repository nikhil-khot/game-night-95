interface ImageUploadProps {
  onChange: (file: File) => void;
}

export default function ImageUpload({ onChange }: ImageUploadProps) {
  async function resizeFile(file: File, maxDim = 512): Promise<File> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        let newWidth = width;
        let newHeight = height;
        if (width > height) {
          if (width > maxDim) {
            newWidth = maxDim;
            newHeight = Math.round((height * maxDim) / width);
          }
        } else {
          if (height > maxDim) {
            newHeight = maxDim;
            newWidth = Math.round((width * maxDim) / height);
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.drawImage(img, 0, 0, newWidth, newHeight);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, { type: blob.type });
              resolve(resizedFile);
            } else {
              // Fallback to original file
              resolve(file);
            }
            URL.revokeObjectURL(url);
          },
          "image/jpeg",
          0.85,
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };
      img.src = url;
    });
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={async (event) => {
          if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const resized = await resizeFile(file, 512);
            onChange(resized);
          }
        }}
      />
    </div>
  );
}
