import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaGoogle, FaFacebook, FaXTwitter } from 'react-icons/fa6';
import SocialAuthModal from './SocialAuthModal';

export default function SignUpModal({ isOpen, onClose, onSignUpSuccess }) {
  const { registerUser, socialLogin } = useAuth();
  const firebaseConfigured = Boolean(process.env.REACT_APP_FIREBASE_PROJECT_ID);
  const [step, setStep] = useState('email'); // 'email' or 'details'
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSocialAuthModal, setShowSocialAuthModal] = useState(false);
  const [selectedSocialPlatform, setSelectedSocialPlatform] = useState(null);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setStep('details');
  };

  const handleSignUpSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    (async () => {
      setIsLoading(true);
      try {
        const maybe = registerUser(username.trim(), email.trim(), password);
        const result = await Promise.resolve(maybe);
        if (result && result.success) {
          resetForm();
          onSignUpSuccess();
          onClose();
        } else {
          setError(result?.error || 'Sign up failed');
        }
      } catch (err) {
        setError(err?.message || 'Sign up failed');
      } finally {
        setIsLoading(false);
      }
    })();
  };

  const handleSocialSignUp = (platform) => {
    setError('');
    setSelectedSocialPlatform(platform);
    setShowSocialAuthModal(true);
  };

  const handleSocialAuthSuccess = (credentials) => {
    (async () => {
      setIsLoading(true);
      try {
        const maybe = socialLogin(credentials.platform, {
          username: credentials.username,
          email: credentials.email
        });
        const result = await Promise.resolve(maybe);
        if (result && result.success) {
          setShowSocialAuthModal(false);
          resetForm();
          onSignUpSuccess();
          onClose();
        } else {
          setError(result?.error || 'Social sign up failed. Please try again.');
        }
      } catch (err) {
        setError(err?.message || 'Social sign up failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    })();
  };

  const resetForm = () => {
    setStep('email');
    setEmail('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleBackClick = () => {
    if (step === 'details') {
      setStep('email');
      setError('');
    } else {
      onClose();
      resetForm();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      backdropFilter: 'blur(4px)'
    }}>
      <div className="card" style={{
        maxWidth: '450px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
        animation: 'slideUp 300ms ease'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border)'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '1.5rem',
            color: 'var(--text)'
          }}>
            Create Account
          </h2>
          <button
            onClick={() => {
              onClose();
              resetForm();
            }}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--muted)',
              padding: 0,
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {step === 'email' ? (
          // Email Step
          <>
            <p style={{
              margin: '0 0 1.5rem',
              color: 'var(--muted)',
              fontSize: '0.95rem'
            }}>
              Start by entering your email address
            </p>

            <form onSubmit={handleEmailSubmit}>
              <label>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  ✉️ Email Address
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
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
                Continue
              </button>
            </form>

            {/* Social Sign Up Options */}
            <div style={{
              marginTop: '1.5rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--border)'
            }}>
              <p style={{
                margin: '0 0 1rem',
                color: 'var(--muted)',
                fontSize: '0.85rem',
                textAlign: 'center'
              }}>
                Or sign up with
              </p>
              { !firebaseConfigured && (
                <div style={{ margin: '0 0 1rem', color: '#92400e', fontSize: '0.85rem', textAlign: 'center' }}>
                  Firebase not configured — Google sign-up will open a local fallback.
                </div>
              )}

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem'
              }}>
                {[
                  { name: 'Google', icon: FaGoogle, platform: 'google' },
                  { name: 'Facebook', icon: FaFacebook, platform: 'facebook' },
                  { name: 'X', icon: FaXTwitter, platform: 'x' }
                ].map(social => (
                  <button
                    key={social.platform}
                    type="button"
                    onClick={() => handleSocialSignUp(social.platform)}
                    disabled={isLoading}
                    style={{
                      padding: '0.75rem 1rem',
                      border: '1px solid var(--border)',
                      background: 'var(--card)',
                      color: 'var(--text)',
                      borderRadius: '8px',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      fontSize: '1.2rem',
                      fontWeight: 500,
                      transition: 'all 200ms ease',
                      opacity: isLoading ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                    onMouseEnter={(e) => !isLoading && (e.target.style.background = 'var(--secondary)')}
                    onMouseLeave={(e) => (e.target.style.background = 'var(--card)')}
                    title={`Sign up with ${social.name}`}
                  >
                    <social.icon />
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          // Details Step
          <>
            <p style={{
              margin: '0 0 1.5rem',
              color: 'var(--muted)',
              fontSize: '0.95rem'
            }}>
              Email: <strong style={{ color: 'var(--text)' }}>{email}</strong>
            </p>

            <form onSubmit={handleSignUpSubmit}>
              <label>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  👤 Username
                </span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username (3+ chars)"
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
                  placeholder="Create a strong password (6+ chars)"
                  disabled={isLoading}
                  style={{ opacity: isLoading ? 0.6 : 1 }}
                />
              </label>

              <label>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🔐 Confirm Password
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  disabled={isLoading}
                  style={{ opacity: isLoading ? 0.6 : 1 }}
                />
              </label>

              {error && <div className="form-error">{error}</div>}

              <div style={{
                display: 'flex',
                gap: '1rem',
                marginTop: '1.5rem'
              }}>
                <button
                  type="button"
                  onClick={handleBackClick}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                    color: 'var(--text)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    transition: 'all 200ms ease'
                  }}
                  onMouseEnter={(e) => (e.target.style.background = 'var(--secondary)')}
                  onMouseLeave={(e) => (e.target.style.background = 'var(--card)')}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="primary"
                  style={{
                    flex: 1,
                    opacity: isLoading ? 0.8 : 1,
                    pointerEvents: isLoading ? 'none' : 'auto'
                  }}
                >
                  {isLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>

            <p style={{
              margin: '1rem 0 0',
              color: 'var(--muted)',
              fontSize: '0.75rem',
              textAlign: 'center'
            }}>
              🔒 Your password is securely hashed and stored locally
            </p>
          </>
        )}

        <style>{`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>

      {/* Social Auth Modal */}
      <SocialAuthModal
        isOpen={showSocialAuthModal}
        platform={selectedSocialPlatform}
        onClose={() => {
          setShowSocialAuthModal(false);
          setSelectedSocialPlatform(null);
        }}
        onSuccess={handleSocialAuthSuccess}
      />
    </div>
  );
}
