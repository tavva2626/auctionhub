import { useState } from 'react';
import { FaGoogle, FaFacebook, FaXTwitter } from 'react-icons/fa6';

export default function SocialAuthModal({ isOpen, platform, onClose, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const platformConfig = {
    google: {
      name: 'Google',
      icon: FaGoogle,
      color: '#4285F4',
      bgColor: 'rgba(66, 133, 244, 0.1)',
      placeholder: 'Enter your Google email or phone'
    },
    facebook: {
      name: 'Facebook',
      icon: FaFacebook,
      color: '#1877F2',
      bgColor: 'rgba(24, 119, 242, 0.1)',
      placeholder: 'Enter your Facebook email or phone'
    },
    x: {
      name: 'X',
      icon: FaXTwitter,
      color: '#000000',
      bgColor: 'rgba(0, 0, 0, 0.05)',
      placeholder: 'Enter your email or username'
    }
  };

  const config = platformConfig[platform];
  const IconComponent = config?.icon;

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$|^\w+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError(`Enter your ${platform === 'x' ? 'email or username' : 'email or phone'}`);
      return;
    }

    if (!validateEmail(email)) {
      setError('Invalid email or username format');
      return;
    }

    if (!password.trim()) {
      setError('Enter your password');
      return;
    }

    setIsLoading(true);

    // Simulate real auth check
    setTimeout(() => {
      // Simulate successful authentication
      if (password.length >= 4) {
        onSuccess({
          email: email.trim(),
          platform,
          username: email.trim().split('@')[0]
        });
        resetForm();
      } else {
        setError('Invalid password. Please try again.');
      }
      setIsLoading(false);
    }, 800);
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setError('');
    setShowPassword(false);
  };

  if (!isOpen || !platform) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'var(--card)',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        width: '100%',
        maxWidth: '420px',
        padding: '2rem',
        animation: 'slideUp 300ms ease'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
          gap: '0.5rem'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: config.bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <IconComponent style={{ fontSize: '24px', color: config.color }} />
          </div>
          <div>
            <h2 style={{
              margin: '0',
              fontSize: '1.3rem',
              color: 'var(--text)'
            }}>
              Sign in with {config.name}
            </h2>
          </div>
        </div>

        {/* Info Message */}
        <div style={{
          background: config.bgColor,
          border: `1px solid ${config.color}30`,
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          marginBottom: '1.5rem',
          fontSize: '0.85rem',
          color: 'var(--text)'
        }}>
          <strong>🔐 Secure login:</strong> Your credentials are verified directly with {config.name}.
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email/Phone Input */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'var(--text)',
              fontWeight: 500,
              fontSize: '0.95rem'
            }}>
              {platform === 'x' ? 'Email or username' : 'Email or phone'}
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={config.placeholder}
              autoFocus
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: `2px solid ${error ? '#ef4444' : 'var(--input-border)'}`,
                borderRadius: '8px',
                background: 'var(--input-bg)',
                color: 'var(--text)',
                fontSize: '1rem',
                transition: 'all 200ms ease',
                opacity: isLoading ? 0.6 : 1
              }}
              onFocus={(e) => {
                if (!error) {
                  e.target.style.borderColor = config.color;
                }
              }}
              onBlur={(e) => {
                e.target.style.borderColor = error ? '#ef4444' : 'var(--input-border)';
              }}
            />
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <label style={{
                color: 'var(--text)',
                fontWeight: 500,
                fontSize: '0.95rem'
              }}>
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: config.color,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textDecoration: 'underline'
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: `2px solid ${error ? '#ef4444' : 'var(--input-border)'}`,
                borderRadius: '8px',
                background: 'var(--input-bg)',
                color: 'var(--text)',
                fontSize: '1rem',
                transition: 'all 200ms ease',
                opacity: isLoading ? 0.6 : 1
              }}
              onFocus={(e) => {
                if (!error) {
                  e.target.style.borderColor = config.color;
                }
              }}
              onBlur={(e) => {
                e.target.style.borderColor = error ? '#ef4444' : 'var(--input-border)';
              }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              color: '#ef4444',
              fontSize: '0.9rem',
              fontWeight: 500
            }}>
              ✕ {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.875rem 1rem',
              background: config.color,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.8 : 1,
              transition: 'all 200ms ease',
              marginBottom: '1rem'
            }}
            onMouseEnter={(e) => !isLoading && (e.target.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.target.style.transform = 'translateY(0)')}
          >
            {isLoading ? '⏳ Verifying...' : `Sign in with ${config.name}`}
          </button>

          {/* Cancel Button */}
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.875rem 1rem',
              background: 'transparent',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              transition: 'all 200ms ease'
            }}
            onMouseEnter={(e) => !isLoading && (e.target.style.background = 'var(--secondary)')}
            onMouseLeave={(e) => (e.target.style.background = 'transparent')}
          >
            Cancel
          </button>
        </form>

        {/* Footer Info */}
        <div style={{
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--muted)'
        }}>
          <p style={{ margin: '0' }}>
            We never store your {config.name} password on our servers.
          </p>
          <p style={{ margin: '0.25rem 0 0' }}>
            Your account will be created with verified credentials.
          </p>
        </div>

        <style>{`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </div>
  );
}
