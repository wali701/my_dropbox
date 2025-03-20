import React, { useState, useEffect } from "react";
import { list, uploadData, getUrl, remove } from "@aws-amplify/storage";
import { updateUserAttributes, getCurrentUser, signOut } from "@aws-amplify/auth";
import { Link, Routes, Route, useNavigate } from "react-router-dom";
import "./DropboxClone.css";

// Navbar Component
const Navbar = ({ handleSignOut }) => (
  <nav className="navbar">
    <div className="left-section">
      <h1 className="logo">Dropbox Clone</h1>
      <button className="signout-button" onClick={handleSignOut}>Sign Out</button>
    </div>
    <div className="nav-links">
      <Link to="/" className="nav-link">Home</Link>
      <Link to="/upload" className="nav-link">Upload</Link>
      <Link to="/profile" className="nav-link">Profile</Link>
    </div>
  </nav>
);

// Home Component - List Files and Folders
const Home = () => {
  const [files, setFiles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    const result = await list("");
    setFiles(result.items);
  };

  // 📌 Function to preview file by opening it in a new tab
  const previewFile = async (fileKey) => {
    try {
      const url = await getUrl({ key: fileKey });
      window.open(url.url, "_blank"); // Opens file in a new tab
    } catch (error) {
      alert("Error opening file!");
      console.error("Preview error:", error);
    }
  };

  // 📌 Function to copy shareable link
  const copyShareableLink = async (fileKey) => {
    try {
      const url = await getUrl({ key: fileKey, expiresIn: 3600 });
      navigator.clipboard.writeText(url.url);
      alert("Shareable Link copied to clipboard!");
    } catch (error) {
      alert("Error generating shareable link!");
      console.error("Share error:", error);
    }
  };

  const deleteFile = async (fileKey) => {
    await remove({ key: fileKey });
    fetchFiles();
  };

  return (
    <div className="home-container">
      <h2>Home - File List</h2>
      <button className="profile-button" onClick={() => navigate("/profile")}>Edit Profile</button>
      <ul className="file-list">
        {files.map((file) => (
          <li key={file.key} className="file-item">
            {file.key}
            <button className="preview-button" onClick={() => previewFile(file.key)}>Preview</button> {/* 🔥 Opens file in new tab */}
            <button className="share-button" onClick={() => copyShareableLink(file.key)}>Copy Link</button>
            <button className="delete-button" onClick={() => deleteFile(file.key)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Upload Component - Upload Files & Create Folders
const Upload = () => {
  const [folderName, setFolderName] = useState("");

  const uploadFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const path = folderName ? `${folderName}/${file.name}` : file.name;

    try {
      await uploadData({ key: path, data: file });
      alert("File uploaded successfully!");
    } catch (error) {
      alert("Upload failed!");
      console.error("Upload error:", error);
    }
  };

  const createFolder = async () => {
    if (!folderName) return;
    await uploadData({ key: `${folderName}/.keep`, data: "", options: { contentType: "text/plain" } });
    alert("Folder created!");
  };

  return (
    <div className="upload-container">
      <h2>Upload Files</h2>
      <input
        className="folder-input"
        type="text"
        placeholder="Enter Folder Name"
        value={folderName}
        onChange={(e) => setFolderName(e.target.value)}
      />
      <button className="folder-button" onClick={createFolder}>Create Folder</button>
      <input className="file-input" type="file" onChange={uploadFile} />
    </div>
  );
};

// Profile Component - Edit Profile
const Profile = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const user = await getCurrentUser();
      setUsername(user.username);
      setEmail(user.signInDetails?.loginId || "");
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const saveProfile = async () => {
    try {
      await updateUserAttributes({ userAttributes: { email } });
      alert("Profile updated successfully!");
    } catch (error) {
      alert("Error updating profile!");
      console.error("Update error:", error);
    }
  };

  return (
    <div className="profile-container">
      <h2>Edit Profile</h2>
      <label>Username:</label>
      <input className="profile-input" type="text" value={username} readOnly />
      <label>Email:</label>
      <input
        className="profile-input"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button className="save-button" onClick={saveProfile}>Update Profile</button>
    </div>
  );
};

// Main DropboxClone Component
const DropboxClone = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div>
      <Navbar handleSignOut={handleSignOut} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </div>
  );
};

export default DropboxClone;
