import { useState } from 'react';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';

export default function ConnectButton({ targetUserId, initialIsConnected, onConnectionChange }) {
  const [isConnected, setIsConnected] = useState(initialIsConnected);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleConnect = async (e) => {
    e.preventDefault(); // Prevent clicking the button from triggering card clicks
    e.stopPropagation();
    
    setLoading(true);
    try {
      // Hits the backend endpoint we created earlier
      const { data } = await api.post(`/users/${targetUserId}/connect`);
      
      setIsConnected(data.connected);
      toast(data.message);
      
      // Notify parent component to update the UI if necessary
      if (onConnectionChange) {
        onConnectionChange(targetUserId, data.connected);
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Could not update connection status', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      style={{
        background: isConnected 
          ? 'rgba(255, 255, 255, 0.06)' 
          : 'linear-gradient(135deg, #a78bfa, #ec4899)',
        color: isConnected ? '#a78bfa' : '#fff',
        border: isConnected ? '1px solid rgba(167, 139, 250, 0.3)' : 'none',
        padding: '8px 16px',
        borderRadius: '12px',
        fontWeight: 600,
        fontSize: '13px',
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        boxShadow: isConnected ? 'none' : '0 4px 12px rgba(236, 72, 153, 0.2)',
        transition: 'all 0.2s ease',
        userSelect: 'none'
      }}
      onMouseOver={(e) => {
        if (!isConnected && !loading) e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseOut={(e) => {
        if (!isConnected && !loading) e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <span>{loading ? '⏳' : isConnected ? '💌' : '✨'}</span>
      <span>{loading ? 'Connecting...' : isConnected ? 'Connected' : 'Connect'}</span>
    </button>
  );
}