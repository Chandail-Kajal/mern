import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // Wait for context to read from localStorage before judging
  if (loading) {
    return <div style={{ color: '#fff', textAlign: 'center', marginTop: '20%' }}>Loading magic... ✨</div>;
  }

  if (!user) {
    // Force them back to your clean homepage if they aren't authenticated
    return <Navigate to="/" replace />;
  }

  return children;
}