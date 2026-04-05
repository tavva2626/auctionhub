import { getNetworkInfo } from '../utils/networkURL';

export default function NetworkAccessInfo() {
  const info = getNetworkInfo();

  return (
    <div style={{
      background: 'var(--card)',
      border: '2px solid var(--primary)',
      borderRadius: '12px',
      padding: '1.5rem',
      marginTop: '1.5rem',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '1rem'
      }}>
        <span style={{ fontSize: '1.5rem' }}>📱</span>
        <h3 style={{
          margin: 0,
          fontSize: '1.1rem',
          color: 'var(--text)',
          fontWeight: 600
        }}>
          Multi-Device Access
        </h3>
      </div>

      {/* Network Status */}
      <div style={{
        padding: '0.75rem 1rem',
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid #10b981',
        borderRadius: '8px',
        marginBottom: '1rem'
      }}>
        <p style={{
          margin: 0,
          fontSize: '0.9rem',
          color: '#059669',
          fontWeight: 500
        }}>
          ✅ HTTPS Network Accessible
        </p>
        <p style={{
          margin: '0.25rem 0 0',
          fontSize: '0.85rem',
          color: '#047857'
        }}>
          Securely accessible from other devices on your network via HTTPS
        </p>
      </div>

      {/* Network Details */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        {/* Hostname */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.8rem',
            color: 'var(--muted)',
            fontWeight: 600,
            marginBottom: '0.25rem',
            textTransform: 'uppercase'
          }}>
            Device
          </label>
          <code style={{
            display: 'block',
            background: 'var(--input-bg)',
            padding: '0.5rem 0.75rem',
            borderRadius: '6px',
            fontSize: '0.9rem',
            color: 'var(--text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontFamily: 'monospace'
          }}>
            {info.displayHostname}
          </code>
        </div>

        {/* Port */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.8rem',
            color: 'var(--muted)',
            fontWeight: 600,
            marginBottom: '0.25rem',
            textTransform: 'uppercase'
          }}>
            Port
          </label>
          <code style={{
            display: 'block',
            background: 'var(--input-bg)',
            padding: '0.5rem 0.75rem',
            borderRadius: '6px',
            fontSize: '0.9rem',
            color: 'var(--text)',
            fontFamily: 'monospace'
          }}>
            :{info.port}
          </code>
        </div>

        {/* Type */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.8rem',
            color: 'var(--muted)',
            fontWeight: 600,
            marginBottom: '0.25rem',
            textTransform: 'uppercase'
          }}>
            Environment
          </label>
          <code style={{
            display: 'block',
            background: 'var(--input-bg)',
            padding: '0.5rem 0.75rem',
            borderRadius: '6px',
            fontSize: '0.9rem',
            color: 'var(--text)',
            fontFamily: 'monospace'
          }}>
            {info.isProduction ? 'Production' : 'Development'}
          </code>
        </div>
      </div>

      {/* Access Instructions */}
      <div style={{
        background: 'var(--secondary)',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1rem'
      }}>
        <h4 style={{
          margin: '0 0 0.75rem',
          fontSize: '0.95rem',
          color: 'var(--text)',
          fontWeight: 600
        }}>
          📖 How to Join from Other Devices:
        </h4>
        
        <ol style={{
          margin: 0,
          paddingLeft: '1.5rem',
          color: 'var(--text)',
          fontSize: '0.9rem',
          lineHeight: '1.6'
        }}>
          <li style={{ marginBottom: '0.5rem' }}>
            Make sure all devices are on the <strong>same WiFi network</strong>
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            Open the auction link on another device:
            <br />
            <code style={{
              display: 'inline-block',
              background: 'var(--input-bg)',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              marginTop: '0.25rem',
              fontFamily: 'monospace',
              fontSize: '0.85rem'
            }}>
              https://{info.displayURL}
            </code>
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            Scan the QR code from the host to join instantly
          </li>
          <li>
            All devices will be in sync on the same auction
          </li>
        </ol>
      </div>

      {/* Features */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '0.75rem'
      }}>
        {[
          { icon: '💻', text: 'Computers' },
          { icon: '💻', text: 'Laptops' },
          { icon: '📱', text: 'Phones' },
          { icon: '📊', text: 'Tablets' }
        ].map((device, idx) => (
          <div
            key={idx}
            style={{
              padding: '0.75rem',
              background: 'var(--secondary)',
              borderRadius: '8px',
              textAlign: 'center',
              fontSize: '0.9rem',
              color: 'var(--text)'
            }}
          >
            <div style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>
              {device.icon}
            </div>
            {device.text}
          </div>
        ))}
      </div>

      {/* Production Note */}
      <div style={{
        marginTop: '1rem',
        paddingTop: '1rem',
        borderTop: '1px solid var(--border)',
        fontSize: '0.8rem',
        color: 'var(--muted)',
        textAlign: 'center'
      }}>
        🚀 Production: Deploy to a server and use your domain URL for global access
      </div>
    </div>
  );
}
