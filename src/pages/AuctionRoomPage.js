import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  addBid,
  formatCurrency,
  getAuctionById,
  getWinner,
  updateAuction,
  dropBid,
} from '../utils/auctionStorage';
import { usePageTitle } from '../hooks/usePageTitle';

export default function AuctionRoomPage() {
  usePageTitle('Bidder - Auction Room');
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(() => getAuctionById(auctionId));
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());

  const storedBidder = (() => {
    try {
      // Check sessionStorage first (unique per tab), then localStorage for backward compatibility
      const fromSession = sessionStorage.getItem('auctionApp.currentBidder');
      if (fromSession) return JSON.parse(fromSession);
      
      const fromLocal = localStorage.getItem('auctionApp.currentBidder');
      if (fromLocal) return JSON.parse(fromLocal);
      
      return null;
    } catch {
      return null;
    }
  })();

  const bidder = (() => {
    if (!storedBidder) return null;
    if (storedBidder.auctionId !== auctionId) return null;
    return storedBidder;
  })();

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fresh = getAuctionById(auctionId);
    if (fresh) setAuction(fresh);
  }, [auctionId, now]);

  useEffect(() => {
    if (!auction) return;
    if (auction.status === 'started' && auction.timerEnd && now >= auction.timerEnd) {
      const updated = updateAuction(auction.id, { status: 'ended' });
      setAuction(updated);
    }
  }, [auction, now]);

  if (!auction) {
    return (
      <main className="page">
        <div className="card">
          <h2>Auction not found</h2>
          <p>Make sure you joined using the correct auction ID/link.</p>
          <button className="primary" onClick={() => navigate('/home')}>
            Back to home
          </button>
        </div>
      </main>
    );
  }

  if (!bidder) {
    return (
      <main className="page">
        <div className="card">
          <h2>Not joined yet</h2>
          <p>It looks like you haven't joined this auction as a bidder yet.</p>
          <button className="primary" onClick={() => navigate('/bid/join')}>
            Join auction
          </button>
        </div>
      </main>
    );
  }

  const timeLeft = auction.timerEnd ? Math.max(0, auction.timerEnd - now) : 0;
  const canBid = auction.status === 'started' && timeLeft > 0;

  const highestBid = (() => {
    if (!auction.bidders || auction.bidders.length === 0) return auction.basePrice || 0;
    const top = auction.bidders
      .map((b) => b.lastBid || 0)
      .reduce((max, current) => (current > max ? current : max), 0);
    return Math.max(top, auction.basePrice || 0);
  })();

  const winner = getWinner(auction);

  // Check if current bidder is dropped
  const currentBidderInfo = auction.bidders?.find((b) => b.id === bidder.bidderId);
  const isDropped = currentBidderInfo?.isDropped || false;

  const handleBid = (event) => {
    event.preventDefault();
    setError('');

    if (isDropped) {
      setError('You cannot bid any more because you dropped from this auction.');
      return;
    }

    const amount = Number(bidAmount);
    if (!amount || amount <= (auction.basePrice || 0)) {
      setError('Bid must be greater than the base price.');
      return;
    }
    if (amount <= highestBid) {
      setError('Your bid must be higher than the current highest bid.');
      return;
    }

    addBid(auction.id, bidder.bidderId, amount);
    setBidAmount('');
  };

  const handleDropBid = () => {
    if (window.confirm('Are you sure you want to drop out of this auction?')) {
      dropBid(auction.id, bidder.bidderId);
    }
  };

  const handleLeave = () => {
    sessionStorage.removeItem('auctionApp.currentBidder');
    localStorage.removeItem('auctionApp.currentBidder');
    navigate('/home');
  };

  return (
    <main className="page auction-room">
      <header className="page-header">
        <div>
          <h1>{auction.title}</h1>
          <p>
            Joining as <strong>{bidder.name}</strong>
          </p>
        </div>
        <button className="secondary" onClick={handleLeave}>
          Leave auction
        </button>
      </header>

      <div className="auction-layout-container">
        <section className="card auction-info">
        <h2>Auction info</h2>
        <p>
          <strong>Status:</strong> {auction.status}
        </p>
        <p>
          <strong>Current highest bid:</strong> {formatCurrency(highestBid)}
        </p>

        <div className="auction-chat">
          <h3>Description</h3>
          <p>{auction.description}</p>
        </div>

        {!canBid && auction.status === 'waiting' && (
          <p className="hint">Waiting for the host to start the timer...</p>
        )}

        {auction.status === 'started' && (
          <div style={{ marginBottom: '1.5rem', padding: '2rem', textAlign: 'center', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '12px' }}>
            <p style={{ margin: '0 0 0.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>Time Remaining</p>
            <div style={{
              fontSize: '4rem',
              fontWeight: 700,
              color: '#3b82f6',
              fontFamily: 'monospace',
              letterSpacing: '0.1em'
            }}>
              {Math.floor(timeLeft / 1000)}s
            </div>
          </div>
        )}

        {auction.status === 'ended' && (
          <div className="winner-box">
            <h3>Auction ended</h3>
            {winner ? (
              <p>
                Winner: <strong>{winner.bidder.name}</strong> with{' '}
                {formatCurrency(winner.bid)}
              </p>
            ) : (
              <p>No bids were placed.</p>
            )}
          </div>
        )}

        {isDropped && (
          <div className="card" style={{
            padding: '1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px'
          }}>
            <p style={{ margin: 0, fontWeight: 600, color: '#dc2626' }}>
              🚫 You have dropped from this auction and cannot bid anymore.
            </p>
          </div>
        )}

        {canBid && !isDropped && (
          <form className="bid-form" onSubmit={handleBid}>
            <label>
              Your bid (USD)
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={`Minimum: $${Math.floor(highestBid) + 1}`}
              />
            </label>
            {error && <div className="form-error">{error}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <button type="submit" className="primary">
                Place bid
              </button>
              <button
                type="button"
                onClick={handleDropBid}
                style={{
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                🚫 Drop Out
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="card bid-list">
        <h2>Bid history</h2>
        {auction.bidders?.length ? (
          <table>
            <thead>
              <tr>
                <th>Bidder</th>
                <th>Last bid</th>
                <th>Bids</th>
              </tr>
            </thead>
            <tbody>
              {auction.bidders
                .slice()
                .sort((a, b) => (b.lastBid || 0) - (a.lastBid || 0))
                .map((b, idx) => (
                <tr key={b.id} className={b.id === bidder.bidderId ? 'current-bidder' : ''} style={{ opacity: b.isDropped ? 0.6 : 1 }}>
                  <td>#{idx + 1} - {b.name} {b.id === bidder.bidderId && <span className="badge">(You)</span>} {b.isDropped && <span className="badge" style={{ background: '#ef4444' }}>Dropped</span>}</td>
                  <td className="bid-amount">{formatCurrency(b.lastBid || 0)}</td>
                  <td className="bid-count">{(b.bids || []).length}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        ) : (
          <p>No bids yet.</p>
        )}
      </section>
      </div>
    </main>
  );
}
