import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';

export default function LoginPage() {
  usePageTitle('Login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/home', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    // Simulate a small delay for better UX
    setTimeout(() => {
      login(username.trim());
      navigate('/home');
      setIsLoading(false);
    }, 400);
  };

  return (
    <main className="page login-page">
      <div style={{ maxWidth: '450px', margin: '0 auto', marginTop: '2rem' }}>
        {/* Hero Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2.5rem',
          paddingBottom: '1.5rem',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <h1 style={{
            margin: '0 0 0.5rem',
            fontSize: '2.2rem',
            background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Auction Hub
          </h1>
          <p style={{
            margin: '0.5rem 0 0',
            color: 'var(--muted)',
            fontSize: '0.95rem'
          }}>
            Join exciting auctions and bid with confidence
          </p>
        </div>

        {/* Login Card */}
        <div className="card">
          <h2 style={{
            margin: '0 0 0.5rem',
            fontSize: '1.5rem',
            color: 'var(--text)'
          }}>
            Welcome Back
          </h2>
          <p style={{
            margin: '0 0 1.5rem',
            color: 'var(--muted)',
            fontSize: '0.95rem'
          }}>
            Sign in to your account to get started
          </p>

          <form onSubmit={handleSubmit}>
            <label>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                👤 Username
              </span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoFocus
                disabled={isLoading}
                style={{ opacity: isLoading ? 0.6 : 1 }}
              />
            </label>

            <label>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🔐 Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isLoading}
                style={{ opacity: isLoading ? 0.6 : 1 }}
              />
            </label>

            {error && <div className="form-error">{error}</div>}

            <button 
              type="submit" 
              className="primary"
              style={{
                width: '100%',
                marginTop: '1.5rem',
                opacity: isLoading ? 0.8 : 1,
                pointerEvents: isLoading ? 'none' : 'auto'
              }}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #e5e7eb',
            fontSize: '0.85rem',
            color: 'var(--muted)',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0' }}>
              🔒 Your data is securely stored on your device
            </p>
            <p style={{ margin: '0.5rem 0 0' }}>
              Demo account available - just enter any username and password
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
