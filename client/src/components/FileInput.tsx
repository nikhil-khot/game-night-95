import React from "react";
import "../components/FileInput.css"; // Assuming a CSS file for styling

interface FileInputProps {
  onChange: (file: File) => void;
  resizeFile: (file: File, maxDim: number) => Promise<File>;
  maxDim: number;
}

export default function FileInput({ onChange, resizeFile, maxDim }: FileInputProps) {
  return (
    <label className="file-input-label">
      <span className="file-input-text">Upload File</span>
      <input
        type="file"
        accept="image/*"
        className="file-input"
        onChange={async (event) => {
          if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const resized = await resizeFile(file, maxDim);
            onChange(resized);
          }
        }}
      />
    </label>
  );
}