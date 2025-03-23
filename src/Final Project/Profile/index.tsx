import { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams, Link } from "react-router-dom";
import "./index.css"; // Update to new CSS file for styling changes
import * as client from "./client";
import { findProfileById } from "./client";
import { JsxElement } from "typescript";
import * as followClient from "../Follows/client";

function Profile() {
  const [profile, setProfile] = useState({
    _id: "",
    profilePicture: null,
    username: "",
    displayName: "",
    bio: "",
    dob: "",
    experience: "",
    yearsOfExperience: 0,
  });
  const [sessionProfile, setSessionProfile] = useState<client.User>();
  const navigate = useNavigate();
  const { param } = useParams();
  console.log("Route userId:", param);
  const [isEditing, setIsEditing] = useState(false);
  const [profilePic, setProfilePic] = useState("");
  const defaultProfilePicUrl = "../images/default.jpeg";
  const [isFollowed, setIsFollowed] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState(0);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [followProfile, setFollowProfile] = useState<followClient.Follows>();

  const handleIsFollowed = async () => {
    if (!followProfile || !sessionProfile) {
      console.error("No follow profile available");
      return;
    }
    console.log("Current target follow document:", followProfile);
  
    // Update followers array for the target user's follow doc
    const updatedFollowers = isFollowed
      ? followProfile.followers.filter(follower => follower !== sessionProfile._id)
      : [...(followProfile.followers || []), sessionProfile._id];
  
    try {
      // Prepare updated follow document for the target user
      const updatedFollow: followClient.Follows = {
        ...followProfile,
        followers: updatedFollowers
      };
      await followClient.updateFollow(followProfile._id, updatedFollow);
  
      // Now update the session user's follow document.
      // Remember, findFollowsByUserId returns an array – get the first element.
      const sessionFollowsArr = await followClient.findFollowsByUserId(sessionProfile._id);
      if (sessionFollowsArr.length > 0) {
        const sessionFollowDoc = sessionFollowsArr[0];
        const updatedFollowing = isFollowed
          ? sessionFollowDoc.followings.filter(
              (following: string) => following !== followProfile.user
            )
          : [...(sessionFollowDoc.followings || []), followProfile.user];
        const updatedSessionFollowProfile: followClient.Follows = {
          ...sessionFollowDoc,
          followings: updatedFollowing
        };
        await followClient.updateFollow(updatedSessionFollowProfile._id, updatedSessionFollowProfile);
      } else {
        console.warn("No follow document found for the session user");
      }
  
      // Update local state
      setFollowProfile(updatedFollow);
      setIsFollowed(!isFollowed);
      fetchFollows();
    } catch (error) {
      console.error("Failed to update follow status:", error);
    }
  };

  const handleIsEditing = async () => {
    setIsEditing(false);
  };

  const handleProfileEdit = async () => {
    try {
      const response = await client.findUserById(param);
      const newProfile = {
        ...profile,
        username: username ? username : response.username,
        displayName: displayName ? displayName : response.displayName,
        bio: bio ? bio : response.bio,
        yearsOfExperience: yearsOfExperience
          ? yearsOfExperience
          : response.yearsOfExperience,
      };
      const update = await client.updateUser(newProfile);

      if (profilePicture !== null) {
        await client.uploadProfilePicture(response._id, profilePicture);
        console.log("profile picture uploaded", profilePicture);
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
    setIsEditing(false);
    setProfilePicture(null);
    fetchProfile();
  };

  async function fetchFollows() {
    try {
      const response = await followClient.findFollowsByUserId(param as string);
        const followData = response[0];
        setFollowProfile(followData);
        // console.log("Follows response:", followData);
        setFollowerCount(followData.followers.length === null ? 0 : followData.followers.length);
        setIsFollowed(followData.followers.includes(sessionProfile?._id));
        // console.log("isFollowed", sessionProfile?._id, followData.followers.includes(sessionProfile?._id));
    } catch (error) {
      console.error("Failed to fetch follows:", error);
    }
  }

  async function fetchProfile() {
    try {
      const userResponse = await client.profile();
      if (userResponse) {
        setSessionProfile(userResponse);
      }
      const response = await client.findUserById(param);
      const formattedDOB = response.dob
        ? new Date(response.dob).toISOString().slice(0, 10)
        : "";
      setProfile({
        ...response,
        dob: formattedDOB,
      });
      setProfilePicture(response.profilePicture);
      setUsername(response.username);
      setDisplayName(response.displayName);
      setBio(response.bio);
      setYearsOfExperience(response.yearsOfExperience);
      if (response.profilePicture) {
        const url = `${process.env.REACT_APP_BACKEND_URL}/${response.profilePicture}`;
        const correctedUrl = url.replace(/\\/g, "/");
        setProfilePic(correctedUrl);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  }

  useEffect(() => {
    if (sessionProfile && followProfile) {
      setIsFollowed(followProfile.followers.includes(sessionProfile._id));
    }
  }, [sessionProfile, followProfile]);

  useEffect(() => {
    fetchProfile();
    fetchFollows();
  }, []);
  useEffect(() => {
    const getSessionProfile = async () => {
      // Function to fetch session profile from the backend or cache
      const profile = await client.profile();
      setSessionProfile(profile);
    };
  
    if (!sessionProfile) {
      getSessionProfile();
    }
  
    if (param && sessionProfile) {
      fetchProfile();
      fetchFollows();
    }
  }, [param]);
  

  return (
    <>
      <Link to="/Home/Community" className="header-logo">
        <h1 className="logo-text text-gradient">Senzu 🦇</h1>
      </Link>
      <div className="profile-container">
        <div className="profile-banner"></div>
        <div className="profile-banner"></div>
        <div className="profile-banner"></div>
        <div className="profile-picture">
          <img
            src={profilePic ? profilePic : defaultProfilePicUrl}
            alt="Profile"
            className="profile-image"
          />
        </div>
        <div className="profile-details">
          {isEditing ? (
            <>
              <form>
                <div className="form-group">
                  <label htmlFor="profile-display-name">
                    <b>DISPLAY NAME</b>
                  </label>
                  <br />
                  <input
                    type="text"
                    className="form-control"
                    id="profile-display-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="profile-user-name">
                    <b>USERNAME</b>
                  </label>
                  <br />
                  <input
                    type="text"
                    className="form-control"
                    id="profile-user-name"
                    value={username}
                    placeholder={profile.username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="profile-bio">
                    <b>BIO</b>
                  </label>{" "}
                  <br />
                  <input
                    type="text"
                    className="form-control"
                    id="profile-bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="profile-yoe">
                    <b>YEARS OF EXPERIENCE IN THE GYM </b>
                  </label>
                  <br />
                  <input
                    type="number"
                    className="form-control"
                    id="profile-yoe"
                    value={yearsOfExperience}
                    defaultValue={0}
                    onChange={(e) =>
                      setYearsOfExperience(Number(e.target.value))
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="profile-picture">
                    <b>PROFILE PICTURE</b>
                  </label>
                  <br />
                  <input
                    type="file"
                    className="form-control"
                    id="profile-picture"
                    accept="image/*"
                    onChange={(e) => {
                      setProfilePicture(
                        e.target.files && e.target.files[0]
                          ? e.target.files[0]
                          : null
                      );
                    }}
                  />
                </div>
                <button
                  onClick={handleProfileEdit}
                  type="button"
                  className="edit-button post-button"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  type="button"
                  className="edit-button post-button"
                >
                  Cancel
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="display-name">{profile.displayName}</h1>
              <div className="username">@{profile.username}</div>
              <div className="description">{profile.bio}</div>
              <div className="details">
                <span className="dob">Born on {profile.dob}</span> <br />
                <span className="experience">
                  {profile.yearsOfExperience} years grinding at the gym
                  </span>
                  <div className="follower-info">
                  {sessionProfile && sessionProfile._id !== profile._id && (
                      <button onClick={handleIsFollowed} className="follow-button post-button">
                        {isFollowed ? "Unfollow" : "Follow"}
                      </button>
                    )}
                  {sessionProfile &&
                    (sessionProfile._id === profile._id ||
                      sessionProfile.role === "ADMIN") && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="edit-button post-button"
                      >
                        Edit
                      </button>
                    )}
                  <span className="follower-count">
                    {followerCount} {followerCount === 1 ? "Follower" : "Followers"}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
export default Profile;
