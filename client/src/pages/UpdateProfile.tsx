import { useState } from "react";
import useLoginContext from "../hooks/useLoginContext";
import useTimeSince from "../hooks/useTimeSince";
import useEditProfileForm from "../hooks/useEditProfileForm";
import ImageUpload from "../components/ImageUpload";
import ProfileAvatar from "../components/ProfileAvatar";
import BannerAvatar from "../components/BannerAvatar";
import { useNavigate } from "react-router-dom";

export default function UpdateProfile() {
  const { user } = useLoginContext();
  const navigate = useNavigate();
  const timeSince = useTimeSince();
  const [showPass, setShowPass] = useState(false);
  const [uploadedImageName, setUploadedImageName] = useState<string>("");
  const [bannerImageName, setBannerImageName] = useState<string>("");
  const {
    display,
    setDisplay,
    password,
    setPassword,
    confirm,
    setConfirm,
    profilePictureUrl,
    setProfilePictureUrl,
    bannerImageUrl,
    setBannerImageUrl,
    err,
    handleSubmit,
  } = useEditProfileForm();

  const handleProfileImageChange = (file: File) => {
    setUploadedImageName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProfilePictureUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBannerImageChange = (file: File) => {
    setBannerImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setBannerImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <form className="content spacedSection" onSubmit={handleSubmit}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Profile</h2>
      </div>
      <div>
        <h3>General information</h3>
        <ul>
          <li>Username: {user.username}</li>
          <li>Account created {timeSince(user.createdAt)}</li>
        </ul>
      </div>
      <hr />
      <div className="spacedSection">
        <h3>Display name</h3>
        <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem" }}>
          <input
            className="widefill notTooWide"
            value={display}
            onChange={(e) => setDisplay(e.target.value)}
          />
          <button
            className="secondary narrow"
            onClick={(e) => {
              e.preventDefault(); // Don't submit form
              setDisplay(user.display);
            }}
          >
            Reset
          </button>
        </div>
      </div>
      <hr />
      <div className="spacedSection">
        <h3>Reset password</h3>
        <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem" }}>
          <input
            type={showPass ? "input" : "password"}
            className="widefill notTooWide"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="secondary narrow"
            onClick={(e) => {
              e.preventDefault(); // Don't submit form
              setPassword("");
              setConfirm("");
            }}
          >
            Reset
          </button>
          <button
            className="secondary narrow"
            aria-label="Toggle show password"
            onClick={(e) => {
              e.preventDefault(); // Don't submit form
              setShowPass((v) => !v);
            }}
          >
            {showPass ? "Hide" : "Reveal"}
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem" }}>
          <input
            type={showPass ? "input" : "password"}
            className="widefill notTooWide"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
      </div>
      <div className="spacedSection">
        <h3>Upload profile image</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <ProfileAvatar imageUrl={profilePictureUrl} />
          <div>
            <ImageUpload onChange={handleProfileImageChange} />
            {uploadedImageName && <div className="smallAndGray">Selected: {uploadedImageName}</div>}
          </div>
        </div>
        <h3>Upload Banner Image</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <BannerAvatar imageUrl={bannerImageUrl} />
          <div>
            <ImageUpload onChange={handleBannerImageChange} />
            {bannerImageName && <div className="smallAndGray">Selected: {bannerImageName}</div>}
          </div>
        </div>
      </div>
      <hr />
      {err && <p className="error-message">{err}</p>}
      <div>
        <button className="primary narrow">Submit</button>
      </div>
      <div>
        <button
          className="secondary narrow"
          onClick={(e) => {
            e.preventDefault(); // Prevent form submission
            navigate(`/profile/view/${user.username}`); // Navigate using React Router
          }}
        >
          View Profile
        </button>
      </div>
      <div className="smallAndGray">After updating your profile, you will be logged out</div>
    </form>
  );
}
