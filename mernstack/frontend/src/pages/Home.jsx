import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Login from './Login';
import Register from './Register';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'

  // If user is already authenticated, send them to the main feed
  useEffect(() => {
    if (user) {
      navigate('/feed');
    }
  }, [user, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#0b0813', // Soft dark mystic background
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Plus Jakarta Sans, sans-serif'
    }}>
      {/* Aesthetic Background Ambient Blobs */}
      <div style={{
        position: 'absolute', top: '10%', left: '-5%', width: 500, height: 500,
        borderRadius: '50%', background: 'rgba(124,58,237,0.12)', filter: 'blur(100px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '5%', right: '-5%', width: 450, height: 450,
        borderRadius: '50%', background: 'rgba(236,72,153,0.1)', filter: 'blur(100px)',
        pointerEvents: 'none'
      }} />

      {/* --- CUTE & PROFESSIONAL NAVBAR --- */}
     

      {/* --- FORM CONTAINER --- */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 20px', zIndex: 1
      }}>
        <div className="fade-in" style={{ width: '100%', maxWidth: 440 }}>
          {authMode === 'login' ? (
            <Login switchToRegister={() => setAuthMode('register')} />
          ) : (
            <Register switchToLogin={() => setAuthMode('login')} />
          )}
        </div>
      </div>
    </div>
  );
}