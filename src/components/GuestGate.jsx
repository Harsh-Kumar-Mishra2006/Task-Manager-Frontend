// components/GuestGate.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function GuestGate({ children, message = 'Create an account to write tasks and save documents.' }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading…</div>;

  if (!isAuthenticated) {
    return (
      <div
        style={{
          position: 'relative',
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            background: 'white',
            padding: '32px 40px',
            borderRadius: 12,
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            textAlign: 'center',
            maxWidth: 420,
          }}
        >
          <h2 style={{ marginTop: 0 }}>🔒 Account required</h2>
          <p style={{ color: '#555' }}>{message}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
            <Link
              to="/signup"
              style={{
                background: '#2563eb',
                color: 'white',
                padding: '10px 20px',
                borderRadius: 6,
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Create Account
            </Link>
            <Link
              to="/login"
              style={{
                padding: '10px 20px',
                borderRadius: 6,
                border: '1px solid #ddd',
                textDecoration: 'none',
                color: '#333',
              }}
            >
              Log In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}