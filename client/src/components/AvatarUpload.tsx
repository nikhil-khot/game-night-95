import FileInput from "./FileInput";

interface AvatarUploadProps {
  onChange: (file: File) => void;
  imageUrl?: string; // Optional image URL for default avatar
}

const DEFAULT_AVATAR_PLACEHOLDER = "/path/to/placeholder/avatar.jpg"; // Placeholder path for avatar

export default function AvatarUpload({ onChange, imageUrl }: AvatarUploadProps) {
  async function resizeFile(file: File, maxDim = 128): Promise<File> {
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
    <div className="avatar-upload">
      {imageUrl ? (
        <img src={imageUrl} alt="Avatar" className="avatar-image" />
      ) : (
        <div className="image-placeholder avatar-placeholder">
          <img src={DEFAULT_AVATAR_PLACEHOLDER} alt="Avatar Placeholder" />
        </div>
      )}
      <FileInput onChange={onChange} resizeFile={resizeFile} maxDim={128} />
    </div>
  );
}
