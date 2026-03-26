import React from "react";

interface BannerAvatarProps {
  imageUrl?: string;
  width?: number;
  height?: number;
}

const DEFAULT_SIZE = 100; // Default size for the square avatar

export default function BannerAvatar({ imageUrl, width = DEFAULT_SIZE, height = DEFAULT_SIZE }: BannerAvatarProps) {
  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        borderRadius: "8px", // Slightly rounded corners for banners
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f0f0f0", // Placeholder background color
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Banner Avatar"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div style={{ color: "#aaa", fontSize: "0.8rem" }}>No Image</div>
      )}
    </div>
  );
}