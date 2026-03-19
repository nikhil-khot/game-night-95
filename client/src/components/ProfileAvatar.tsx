export default function ProfileAvatar({ imageUrl }: { imageUrl: string }) {
  const hasImage = imageUrl.trim().length > 0;

  return (
    <div
      style={{
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        overflow: "hidden",
        flexShrink: 0,
        backgroundColor: "#e5e7eb",
      }}
    >
      {hasImage ? (
        <img
          src={imageUrl}
          alt="Profile Avatar"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          style={{ width: "100%", height: "100%", display: "block", fill: "#9ca3af" }}
        >
          <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
        </svg>
      )}
    </div>
  );
}
