import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';

export default function Login({ switchToRegister }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);
  
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) return toast('All fields required', 'error');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { identifier, password });
      login(data);
      toast(`Welcome back, ${data.name}! 🎉`);
      navigate('/feed');
    } catch (err) {
      toast(err.response?.data?.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!recoveryEmail) return toast('Please enter your email address', 'error');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: recoveryEmail });
      toast('A sparkling reset link has been sent to your email! 💌');
      setIsForgotMode(false);
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to send recovery email', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (isForgotMode) {
    return (
      <div className="card" style={{ padding: 36, background: 'rgba(20, 16, 35, 0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, backdropFilter: 'blur(16px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🔮</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, color: '#f3f4f6' }}>Recover Password</h1>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>Enter your email to receive a recovery link</p>
        </div>

        <form onSubmit={handleForgotSubmit}>
          <div className="input-group" style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', color: '#cbd5e1', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Registered Email</label>
            <input
              className="input"
              type="email"
              placeholder="your-email@example.com"
              value={recoveryEmail}
              onChange={e => setRecoveryEmail(e.target.value)}
              autoFocus
              style={{ width: '100%', padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
            />
          </div>

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px', fontSize: 15, fontWeight: 600, borderRadius: 14,
              background: 'linear-gradient(135deg, #a78bfa, #ec4899)', color: '#fff', border: 'none',
              cursor: 'pointer', boxShadow: '0 4px 20px rgba(167,139,250,0.25)'
            }}
          >
            {loading ? 'Sending Magic Link...' : 'Send Reset Link 💌'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13 }}>
          <span onClick={() => setIsForgotMode(false)} style={{ color: '#a78bfa', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
            Back to Sign In
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 36, background: 'rgba(20, 16, 35, 0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, backdropFilter: 'blur(16px)' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>✨</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, color: '#f3f4f6' }}>Welcome back</h1>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>Sign in to your account</p>
      </div>

      <form onSubmit={handleLoginSubmit}>
        <div className="input-group" style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', color: '#cbd5e1', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Email or Mobile Number</label>
          <input
            className="input"
            type="text"
            placeholder="email@example.com or +91..."
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            autoFocus
            style={{ width: '100%', padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
          />
        </div>
        <div className="input-group" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 500 }}>Password</label>
            <span 
              onClick={() => setIsForgotMode(true)} 
              style={{ color: '#a78bfa', fontSize: 12, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Forgot Password?
            </span>
          </div>
          <input
            className="input"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
          />
        </div>

        <button
          className="btn btn-primary"
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '14px', fontSize: 15, fontWeight: 600, borderRadius: 14,
            background: 'linear-gradient(135deg, #a78bfa, #ec4899)', color: '#fff', border: 'none',
            cursor: 'pointer', boxShadow: '0 4px 20px rgba(167,139,250,0.25)', marginTop: 12
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: 20, color: '#94a3b8', fontSize: 13 }}>
        Don't have an account?{' '}
        <span onClick={switchToRegister} style={{ color: '#a78bfa', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
          Sign up
        </span>
      </div>
    </div>
  );
}