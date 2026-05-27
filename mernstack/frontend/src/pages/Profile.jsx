import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/Avatar';
import api from '../utils/api';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const fileRef = useRef();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [preview, setPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('bio', bio);
    if (avatarFile) formData.append('avatar', avatarFile);

    try {
      const { data } = await api.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateUser(data);
      setAvatarFile(null);
      setPreview('');
      toast('Profile updated! 🎉');
    } catch (err) {
      toast(err.response?.data?.message || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 580, margin: '0 auto', padding: '80px 20px 40px' }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Edit Profile</h2>

      <div className="card" style={{ padding: 32 }}>
        {/* Avatar section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileRef.current.click()}>
            <Avatar
              user={preview ? { ...user, avatar: preview } : user}
              size={100}
            />
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid var(--bg-card)', fontSize: 14
            }}>📷</div>
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileRef}
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>
            Click to upload profile picture
          </p>
          {avatarFile && (
            <p style={{ color: 'var(--success)', fontSize: 13, marginTop: 4 }}>
              ✓ {avatarFile.name} selected
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSave}>
          <div className="input-group">
            <label>Full Name</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          </div>

          <div className="input-group">
            <label>Email</label>
            <input className="input" value={user?.email || ''} disabled style={{ opacity: 0.5 }} />
          </div>

          {user?.mobile && (
            <div className="input-group">
              <label>Mobile</label>
              <input className="input" value={user.mobile} disabled style={{ opacity: 0.5 }} />
            </div>
          )}

          <div className="input-group">
            <label>Bio</label>
            <textarea
              className="input"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell people about yourself..."
              maxLength={200}
            />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>{bio.length}/200</span>
          </div>

          <button
            className="btn btn-primary"
            type="submit"
            disabled={saving}
            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 15 }}
          >
            {saving ? 'Saving...' : 'Save Changes ✨'}
          </button>
        </form>
      </div>
    </div>
  );
}
