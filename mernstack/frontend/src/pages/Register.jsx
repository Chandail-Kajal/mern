import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';

export default function Register({ switchToLogin }) {
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '' });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.password || (!form.email && !form.mobile)) {
      return toast('Name, password, and email or mobile are required', 'error');
    }
    if (form.password.length < 6) return toast('Password must be at least 6 characters', 'error');
    
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      
      // Flash a distinct celebratory success message!
      toast(`Account created successfully, ${form.name}! Please sign in. ✨`);
      
      // Send them to the login screen on the homepage
      switchToLogin();
    } catch (err) {
      toast(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: 36, background: 'rgba(20, 16, 35, 0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, backdropFilter: 'blur(16px)' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>🌟</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, color: '#f3f4f6' }}>Create account</h1>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>Join Lumina today</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="input-group" style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', color: '#cbd5e1', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Full Name *</label>
          <input className="input" name="name" placeholder="Your cute name" value={form.name} onChange={onChange} autoFocus style={{ width: '100%', padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
        </div>
        
        <div className="input-group" style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', color: '#cbd5e1', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Email Address</label>
          <input className="input" name="email" type="email" placeholder="email@example.com" value={form.email} onChange={onChange} style={{ width: '100%', padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
        </div>
        
        <div style={{ textAlign: 'center', fontSize: 11, color: '#64748b', margin: '4px 0 12px', fontWeight: 600 }}>OR</div>
        
        <div className="input-group" style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', color: '#cbd5e1', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Mobile Number</label>
          <input className="input" name="mobile" type="tel" placeholder="+91 9876543210" value={form.mobile} onChange={onChange} style={{ width: '100%', padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
        </div>
        
        <div className="input-group" style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', color: '#cbd5e1', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Password *</label>
          <input className="input" name="password" type="password" placeholder="Min. 6 characters" value={form.password} onChange={onChange} style={{ width: '100%', padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
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
          {loading ? 'Creating account...' : 'Create Account ✨'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: 20, color: '#94a3b8', fontSize: 13 }}>
        Already have an account?{' '}
        <span onClick={switchToLogin} style={{ color: '#a78bfa', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
          Sign in
        </span>
      </div>
    </div>
  );
}