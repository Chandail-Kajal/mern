import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AvatarUpload from './AvatarUpload'; // Import our new dropdown avatar

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isPageActive = (path) => location.pathname === path;

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '14px 32px',
      background: 'rgba(20, 16, 35, 0.75)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Cute Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/feed')}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, boxShadow: '0 4px 12px rgba(124,58,237,0.3)'
        }}>✨</div>
        <span style={{
          fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700,
          background: 'linear-gradient(135deg, #fff, #a78bfa)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>Lumina</span>
      </div>

      {/* Actions Hub Layout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/feed')}
            style={{
              background: isPageActive('/feed') ? 'rgba(255,255,255,0.06)' : 'transparent',
              border: 'none',
              color: isPageActive('/feed') ? '#c4b5fd' : '#94a3b8',
              padding: '8px 14px',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            🏠 Feed
          </button>

          <button
            onClick={() => navigate('/chat')}
            style={{
              background: isPageActive('/chat') ? 'rgba(124, 58, 237, 0.12)' : 'transparent',
              border: 'none',
              color: isPageActive('/chat') ? '#ec4899' : '#94a3b8',
              padding: '8px 14px',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease'
            }}
          >
            💬 Messages
          </button>
        </div>

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />

        {/* Profile Info & Interactive Dropdown Picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* REPLACED WITH THE CUTE AVATAR UPLOADER */}
          <AvatarUpload />
          
          <span style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 500, marginRight: 8 }}>
            {user?.name}
          </span>
        </div>

        {/* Cute & Professional Logout Button */}
        <button 
          onClick={handleLogout}
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            padding: '8px 16px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.boxShadow = '0 0 12px rgba(239, 68, 68, 0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span>Logout</span>
          <span style={{ fontSize: 14 }}>👋</span>
        </button>

      </div>
    </nav>
  );
}