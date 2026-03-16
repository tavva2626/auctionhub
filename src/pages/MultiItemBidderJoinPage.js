import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getMultiItemAuctionById, generateAuctionId } from '../utils/auctionStorage';
import { usePageTitle } from '../hooks/usePageTitle';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function MultiItemBidderJoinPage() {
  usePageTitle('Bidder - Join Multi-Item Auction');
  const navigate = useNavigate();
  const query = useQuery();
  const [auctionId, setAuctionId] = useState(query.get('auctionId') || '');
  const [password, setPassword] = useState(query.get('password') || '');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [auction, setAuction] = useState(null);

  useEffect(() => {
    if (!auctionId) return;
    setAuction(getMultiItemAuctionById(auctionId));
  }, [auctionId]);

  const handleJoin = (event) => {
    event.preventDefault();
    setError('');

    if (!auctionId.trim() || !password.trim() || !name.trim()) {
      setError('Please provide auction ID, password, and your name.');
      return;
    }

    const found = getMultiItemAuctionById(auctionId.trim());
    if (!found) {
      setError('No auction found with that ID.');
      return;
    }

    if (found.password !== password.trim()) {
      setError('Incorrect password for this auction.');
      return;
    }

    // Check total bidder count across all items
    const totalBidders = new Set();
    (found.items || []).forEach((item) => {
      (item.bidders || []).forEach((b) => {
        totalBidders.add(b.id);
      });
    });

    if (found.maxBidders > 0 && totalBidders.size >= found.maxBidders) {
      setError('This auction has reached its maximum number of bidders.');
      return;
    }

    const bidderId = generateAuctionId();
    const bidderInfo = { auctionId: found.id, bidderId, name: name.trim() };

    localStorage.setItem('auctionApp.currentMultiBidder', JSON.stringify(bidderInfo));
    sessionStorage.setItem('auctionApp.currentMultiBidder', JSON.stringify(bidderInfo));

    navigate(`/multi-auction/${found.id}`);
  };

  return (
    <main className="page">
      <div style={{ maxWidth: '600px', margin: '0 auto', marginTop: '2rem' }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem',
          paddingBottom: '1.5rem',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <h1 style={{
            margin: '0 0 0.5rem',
            fontSize: '2rem',
            background: 'linear-gradient(135deg, #ec4899, #f472b6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Join Multi-Item Auction
          </h1>
          <p style={{ margin: '0.5rem 0 0', color: 'var(--muted)', fontSize: '0.95rem' }}>
            Bid on multiple items in one auction session
          </p>
        </div>

        <div className="card">
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
                <h3 style={{ margin: '0 0 0.75rem', color: 'var(--text)' }}>📋 Auction Details</h3>
                <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: 'var(--text)' }}>
                  {auction.name}
                </p>
                <p style={{ margin: '0 0 0.25rem', color: 'var(--text)', fontSize: '0.9rem' }}>
                  <strong>Items:</strong> {auction.items?.length || 0} item(s)
                </p>
                <p style={{ margin: '0', color: 'var(--text)', fontSize: '0.9rem' }}>
                  <strong>Max Bidders:</strong> {auction.maxBidders}
                </p>
              </div>
            )}

            {error && <div className="form-error">{error}</div>}

            <button type="submit" className="primary" style={{ width: '100%', marginTop: '1.5rem' }}>
              Join Auction
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
