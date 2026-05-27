import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Avatar from './Avatar';
import api from '../utils/api';

const TEXT_EFFECTS = [
  { id: 'none', label: 'Normal' },
  { id: 'gradient', label: '🎨 Gradient' },
  { id: 'glow', label: '✨ Glow' },
  { id: 'shadow', label: '🌑 Shadow' },
  { id: 'rainbow', label: '🌈 Rainbow' },
  { id: 'wave', label: '🌊 Wave' },
];

const BG_COLORS = [
  '', 
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #fa709a, #fee140)',
  'linear-gradient(135deg, #a18cd1, #fbc2eb)',
  '#1a1a2e',
  '#0d1b2a',
];

export default function CreatePost({ onPostCreated }) {
  const { user } = useAuth();
  const toast = useToast();
  const fileRef = useRef();

  const [content, setContent] = useState('');
  const [effect, setEffect] = useState('none');
  const [bgColor, setBgColor] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImage(null);
    setPreview('');
    fileRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !image) return;
    setLoading(true);

    const formData = new FormData();
    if (content) formData.append('content', content);
    formData.append('textEffect', effect);
    if (bgColor) formData.append('bgColor', bgColor);
    if (image) formData.append('image', image);

    try {
      const { data } = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onPostCreated?.(data);
      setContent('');
      setEffect('none');
      setBgColor('');
      setImage(null);
      setPreview('');
      setExpanded(false);
      toast('Post shared! ✨');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to create post', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Avatar user={user} size={42} />
        <div style={{ flex: 1 }}>
          {bgColor ? (
            <div
              onClick={() => setExpanded(true)}
              style={{
                background: bgColor, borderRadius: 12, padding: '20px 16px',
                minHeight: 80, cursor: 'text', position: 'relative'
              }}
            >
              <textarea
                className="input"
                style={{
                  background: 'transparent', border: 'none', boxShadow: 'none',
                  padding: 0, fontSize: 18, fontWeight: 600,
                  color: 'white', textAlign: 'center', resize: 'none', minHeight: 60
                }}
                placeholder="What's on your mind? ✨"
                value={content}
                onChange={e => setContent(e.target.value)}
                onFocus={() => setExpanded(true)}
              />
            </div>
          ) : (
            <textarea
              className="input"
              style={{ minHeight: expanded ? 100 : 48, transition: 'min-height 0.2s', resize: 'none' }}
              placeholder="What's on your mind? ✨"
              value={content}
              onChange={e => setContent(e.target.value)}
              onFocus={() => setExpanded(true)}
            />
          )}

          {/* Image preview */}
          {preview && (
            <div style={{ position: 'relative', display: 'inline-block', marginTop: 8 }}>
              <img src={preview} alt="" style={{ maxHeight: 200, borderRadius: 10, display: 'block' }} />
              <button
                onClick={removeImage}
                style={{
                  position: 'absolute', top: 6, right: 6,
                  background: 'rgba(0,0,0,0.7)', border: 'none', color: 'white',
                  borderRadius: 6, cursor: 'pointer', padding: '2px 6px', fontSize: 13
                }}
              >✕</button>
            </div>
          )}

          {/* Effects toolbar */}
          {expanded && (
            <div style={{ marginTop: 12 }}>
              {/* Text effects */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {TEXT_EFFECTS.map(e => (
                  <button
                    key={e.id}
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setEffect(e.id)}
                    style={{
                      fontSize: 12,
                      borderColor: effect === e.id ? 'var(--primary)' : 'var(--border)',
                      color: effect === e.id ? 'var(--primary-light)' : 'var(--text-muted)'
                    }}
                  >{e.label}</button>
                ))}
              </div>

              {/* Background colors */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>BG:</span>
                {BG_COLORS.map((color, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setBgColor(color)}
                    style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: color || 'transparent',
                      border: bgColor === color ? '2px solid var(--primary)' : '2px solid var(--border)',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                    title={color || 'No background'}
                  />
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileRef}
                    onChange={handleImage}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => fileRef.current.click()}
                  >📷 Photo</button>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setExpanded(false)}
                  >Cancel</button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleSubmit}
                    disabled={loading || (!content.trim() && !image)}
                  >
                    {loading ? '...' : '✨ Share'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
