import { Avatar } from "@react95/core";
import "./ProfileAvatar.css";

interface ProfileAvatarProps {
  imageUrl: string;
  width?: string;
  height?: string;
}

export default function ProfileAvatar({ imageUrl, width, height }: ProfileAvatarProps) {
  const hasImage = typeof imageUrl === "string" && imageUrl.trim().length > 0;
  return (
    <>
      {hasImage ? (
        <Avatar src={imageUrl} alt="Profile Avatar" className="" circle size="36px" />
      ) : (
        <Avatar alt="Profile Avatar" className="" circle size="36px">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="profile-avatar-placeholder"
            role="img"
            aria-hidden="true"
          >
            <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z" />
          </svg>
        </Avatar>
      )}
    </>
  );
}
