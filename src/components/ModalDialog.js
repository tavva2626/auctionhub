import React from 'react';

export default function ModalDialog({ 
  isOpen, 
  title, 
  message, 
  type = 'confirm', // 'confirm', 'prompt', or 'alert'
  defaultValue = '',
  onConfirm, 
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}) {
  const [inputValue, setInputValue] = React.useState(defaultValue);

  React.useEffect(() => {
    setInputValue(defaultValue);
  }, [defaultValue, isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (type === 'prompt') {
      onConfirm(inputValue);
    } else {
      onConfirm(true);
    }
  };

  const handleCancel = () => {
    if (type === 'prompt') {
      onCancel(null);
    } else {
      onCancel(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 5000,
    }}>
      <div style={{
        backgroundColor: 'var(--card)',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '400px',
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--border)',
      }}>
        <h2 style={{
          margin: '0 0 1rem',
          color: 'var(--text)',
          fontSize: '1.25rem',
        }}>
          {title}
        </h2>

        <p style={{
          margin: '0 0 1.5rem',
          color: 'var(--muted)',
          lineHeight: '1.5',
        }}>
          {message}
        </p>

        {type === 'prompt' && (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card)',
              color: 'var(--text)',
              marginBottom: '1.5rem',
              fontSize: '1rem',
              boxSizing: 'border-box',
            }}
            autoFocus
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleConfirm();
            }}
          />
        )}

        <div style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={handleCancel}
            style={{
              background: 'var(--secondary)',
              color: 'var(--primary)',
              border: '1px solid var(--primary)',
              borderRadius: '8px',
              padding: '0.75rem 1.25rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.95rem',
              transition: 'all 200ms ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(59, 130, 246, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'var(--secondary)';
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            style={{
              background: 'linear-gradient(135deg, var(--primary), #60a5fa)',
              color: 'var(--primary-contrast)',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 1.25rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.95rem',
              transition: 'all 200ms ease',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.target.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
