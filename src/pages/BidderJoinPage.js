import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { addBidder, getAuctionById, generateAuctionId } from '../utils/auctionStorage';
import { usePageTitle } from '../hooks/usePageTitle';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function BidderJoinPage() {
  usePageTitle('Bidder - Join Auction');
  const navigate = useNavigate();
  const query = useQuery();
  const [auctionId, setAuctionId] = useState(query.get('auctionId') || '');
  const [password, setPassword] = useState(query.get('password') || '');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [auction, setAuction] = useState(null);

  useEffect(() => {
    if (!auctionId) return;
    setAuction(getAuctionById(auctionId));
  }, [auctionId]);

  const handleJoin = (event) => {
    event.preventDefault();
    setError('');

    if (!auctionId.trim() || !password.trim() || !name.trim()) {
      setError('Please provide auction ID, password, and your name.');
      return;
    }

    const found = getAuctionById(auctionId.trim());
    if (!found) {
      setError('No auction found with that ID.');
      return;
    }

    if (found.password !== password.trim()) {
      setError('Incorrect password for this auction.');
      return;
    }

    const currentBidders = found.bidders || [];
    if (found.maxBidders > 0 && currentBidders.length >= found.maxBidders) {
      setError('This auction has reached its maximum number of bidders.');
      return;
    }

    const bidderId = generateAuctionId();

    addBidder(found.id, {
      id: bidderId,
      name: name.trim(),
      joinedAt: Date.now(),
    });

    localStorage.setItem(
      'auctionApp.currentBidder',
      JSON.stringify({ auctionId: found.id, bidderId, name: name.trim() })
    );

    // Also store in sessionStorage so each tab has its own bidder identity
    sessionStorage.setItem(
      'auctionApp.currentBidder',
      JSON.stringify({ auctionId: found.id, bidderId, name: name.trim() })
    );

    navigate(`/auction/${found.id}`);
  };

  return (
    <main className="page join-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text)' }}>Join as Bidder</h1>
        <button 
          className="secondary" 
          onClick={() => navigate('/home')}
          style={{ whiteSpace: 'nowrap' }}
        >
          ← Back to Home
        </button>
      </div>

      <div className="card">
        <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
          Enter the auction ID and password provided by the host to join the auction.
        </p>

        <form onSubmit={handleJoin}>
          <label>
            💼 Auction ID
            <input value={auctionId} onChange={(e) => setAuctionId(e.target.value)} placeholder="Enter auction ID" />
          </label>

          <label>
            🔐 Auction Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter auction password"
            />
          </label>

          <label>
            👤 Your Name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" />
          </label>

          {auction && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '10px'
            }}>
              <h3 style={{ margin: '0 0 0.75rem', color: 'var(--text)' }}>📋 About This Auction</h3>
              <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: 'var(--text)' }}>
                {auction.title}
              </p>
              <p style={{ margin: '0 0 0.5rem', color: 'var(--text)' }}>
                Base price: <strong>${auction.basePrice || 0}</strong>
              </p>
              <p style={{ margin: '0', color: 'var(--muted)', fontSize: '0.9rem' }}>
                {auction.description}
              </p>
            </div>
          )}

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="primary" style={{ width: '100%', marginTop: '1.5rem' }}>
            Join Auction
          </button>
        </form>
      </div>
    </main>
  );
}
