import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';

export default function LoginPage() {
  usePageTitle('Login');
  const [activeTab, setActiveTab] = useState('signin');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, loginUser, registerUser, socialLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/home';

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSignIn = async (event) => {
    event.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both email/username and password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginUser(username.trim(), password);
      if (result && result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result?.error || 'Sign in failed.');
      }
    } catch (err) {
      setError(err?.message || 'Sign in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (event) => {
    event.preventDefault();
    setError('');

    if (!username.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await registerUser(username.trim(), email.trim(), password);
      if (result && result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result?.error || 'Sign up failed.');
      }
    } catch (err) {
      setError(err?.message || 'Sign up failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (platform) => {
    setError('');
    setIsLoading(true);
    try {
      const result = await socialLogin(platform);
      if (result && result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result?.error || `${platform} login failed.`);
      }
    } catch (err) {
      setError(err?.message || `${platform} login failed.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="page login-page" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '2rem' 
    }}>
      <div className="card" style={{ 
        maxWidth: '450px', 
        width: '100%', 
        padding: '2.5rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        borderRadius: '24px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            margin: '0 0 0.5rem',
            fontSize: '2.2rem',
            background: 'linear-gradient(135deg, var(--primary), #60a5fa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Auction Hub
          </h1>
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            {activeTab === 'signin' ? 'Welcome back! Please sign in.' : 'Create an account to get started.'}
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', background: 'var(--background)', borderRadius: '12px', padding: '0.25rem', marginBottom: '2rem' }}>
          {['signin', 'signup'].map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setError(''); }}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: 'none',
                background: activeTab === tab ? 'var(--card)' : 'transparent',
                color: activeTab === tab ? 'var(--text)' : 'var(--muted)',
                borderRadius: '8px',
                fontWeight: activeTab === tab ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: activeTab === tab ? '0 2px 10px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              {tab === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Form fields */}
        {activeTab === 'signin' ? (
          <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>
                Email Address
              </label>
              <input
                type="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="name@example.com"
                disabled={isLoading}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)' }}
              />
            </div>
            {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.5rem', textAlign: 'center' }}>{error}</div>}
            <button type="submit" className="primary" disabled={isLoading} style={{ width: '100%', marginTop: '0.5rem', padding: '0.875rem', borderRadius: '10px', fontWeight: 600 }}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>
                Display Name
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="John Doe"
                disabled={isLoading}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                disabled={isLoading}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                disabled={isLoading}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)' }}
              />
            </div>
            {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.5rem', textAlign: 'center' }}>{error}</div>}
            <button type="submit" className="primary" disabled={isLoading} style={{ width: '100%', marginTop: '0.5rem', padding: '0.875rem', borderRadius: '10px', fontWeight: 600 }}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        <div style={{ display: 'flex', alignItems: 'center', margin: '2rem 0', color: 'var(--muted)' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ padding: '0 1rem', fontSize: '0.85rem' }}>or continue with</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              width: '100%',
              padding: '0.875rem',
              background: '#ffffff',
              color: '#3c4043',
              border: '1px solid #dadce0',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: 500,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
              fontFamily: 'Roboto, sans-serif'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#f8f9fa'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = '#ffffff'; }}
          >
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block', width: '20px', height: '20px' }}>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </svg>
            Continue with Google
          </button>
          
          <button
            onClick={() => handleSocialLogin('facebook')}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              width: '100%',
              padding: '0.875rem',
              background: '#1877F2',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: 500,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#166fe5'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = '#1877F2'; }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" style={{ width: '20px', height: '20px', fill: 'currentColor' }}>
              <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"/>
            </svg>
            Continue with Facebook
          </button>
          
          <button
            onClick={() => handleSocialLogin('x')}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              width: '100%',
              padding: '0.875rem',
              background: '#000000',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: 500,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#1a1a1a'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = '#000000'; }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style={{ width: '18px', height: '18px', fill: 'currentColor' }}>
              <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"/>
            </svg>
            Continue with X
          </button>
        </div>
      </div>
    </main>
  );
}
