import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';

export default function AvatarUpload() {
  const { user, login } = useAuth(); // login updates the context user state globally
  const toast = useToast();
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Close dropdown if user clicks outside of it
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle local device image upload selection
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Optional client-side check to make sure it's an image
    if (!file.type.startsWith('image/')) {
      return toast('Please select a cute image file format 📸', 'error');
    }

    const formData = new FormData();
    formData.append('avatar', file); // Matches your backend multer config key

    setUploading(true);
    setShowMenu(false);
    try {
      // Hits your update profile backend endpoint
      const { data } = await api.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Update global context so the whole app updates instantly!
      login(data); 
      toast('Your cute profile picture has been updated! ✨🌸');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to upload profile picture', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Extract first letter of name for placeholder fallback
  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : 'L';
  
  // Safe image path checking
  const avatarUrl = user?.avatar ? `http://localhost:5000${user.avatar}` : null;

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Hidden File Input for local file picker selection */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        style={{ display: 'none' }} 
      />

      {/* Main Avatar Click Target Trigger */}
      <div 
        onClick={() => !uploading && setShowMenu(!showMenu)}
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          fontWeight: 'bold',
          color: '#fff',
          cursor: uploading ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 15px rgba(236,72,153,0.3)',
          transition: 'transform 0.2s ease, border 0.2s ease',
          overflow: 'hidden',
          border: '2px solid rgba(255,255,255,0.2)',
          userSelect: 'none'
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.06)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        {uploading ? (
          <span style={{ fontSize: 12 }}>⏳</span>
        ) : avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span>{firstLetter}</span>
        )}
      </div>

      {/* Aesthetic Dropdown Interactive Options */}
      {showMenu && (
        <div style={{
          position: 'absolute',
          top: '52px',
          right: 0,
          background: 'rgba(25, 20, 40, 0.9)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          width: '180px',
          padding: '6px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
          zIndex: 200,
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          {/* Option 1: Add Profile Picture */}
          <button
            onClick={() => fileInputRef.current.click()}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#e2e8f0',
              padding: '10px 12px',
              borderRadius: '10px',
              textAlign: 'left',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(167, 139, 250, 0.15)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <span>✨</span> Add Profile Picture
          </button>

          {/* Option 2: Edit Options */}
          <button
            onClick={() => {
              setShowMenu(false);
              // Directs to your profile setup view page
              window.location.href = '/profile'; 
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#e2e8f0',
              padding: '10px 12px',
              borderRadius: '10px',
              textAlign: 'left',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(236, 72, 153, 0.15)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <span>✏️</span> Edit Profile
          </button>
        </div>
      )}
    </div>
  );
}