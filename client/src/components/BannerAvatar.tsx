import React from "react";

interface BannerAvatarProps {
  imageUrl?: string;
  width?: string;
  height?: string;
}

export default function BannerAvatar({ imageUrl, width, height }: BannerAvatarProps) {
  return (
    <div
      style={{
        position: "absolute", // Ensure it doesn't affect layout
        top: 0,
        left: 0,
        width: width || "36px",
        height: height || "36px",
        //        borderRadius: "8px", // Slightly rounded corners for banners
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
