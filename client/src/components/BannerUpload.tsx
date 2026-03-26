import FileInput from "./FileInput";

interface BannerUploadProps {
  onChange: (file: File) => void;
  imageUrl?: string; // Optional image URL for default banner
}

const DEFAULT_BANNER_PLACEHOLDER = "/path/to/placeholder/banner.jpg"; // Placeholder path for banner

export default function BannerUpload({ onChange, imageUrl }: BannerUploadProps) {
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
    <div className="banner-upload">
      {imageUrl ? (
        <img src={imageUrl} alt="Banner" className="banner-image" />
      ) : (
        <div className="image-placeholder banner-placeholder">
          <img src={DEFAULT_BANNER_PLACEHOLDER} alt="Banner Placeholder" />
        </div>
      )}
      <FileInput onChange={onChange} resizeFile={resizeFile} maxDim={512} />
    </div>
  );
}
