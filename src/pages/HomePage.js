import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <main className="page home-page">
      <header className="page-header">
        <div>
          <h1>Welcome, {user?.username || 'Guest'}</h1>
          <p>Select your role to continue.</p>
        </div>
        <button className="secondary" onClick={logout}>
          Logout
        </button>
      </header>

      <section className="card role-selection">
        <Link to="/host/create" className="big-button">
          Auction Host
        </Link>
        <Link to="/bid/join" className="big-button">
          Bidder
        </Link>
      </section>

      <section className="info-card">
        <h2>How it works</h2>
        <ul>
          <li>
            As a host, create an auction with a password. Then share the link or QR code with bidders.
          </li>
          <li>
            Bidders join using the auction link and password, then place bids once the host starts the timer.
          </li>
          <li>
            When the auction ends, the host can declare a winner and review details.
          </li>
        </ul>
      </section>
    </main>
  );
}
