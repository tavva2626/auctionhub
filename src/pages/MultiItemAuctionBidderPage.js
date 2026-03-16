import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMultiItemAuctionById, addBidToItem, addBidderToItem, formatCurrency, dropBidForItem } from '../utils/auctionStorage';
import { usePageTitle } from '../hooks/usePageTitle';

export default function MultiItemAuctionBidderPage() {
  usePageTitle('Bidder - Multi-Item AuctionRoom');
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(() => getMultiItemAuctionById(auctionId));
  const [now, setNow] = useState(Date.now());
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState('');

  const storedBidder = (() => {
    try {
      const fromSession = sessionStorage.getItem('auctionApp.currentMultiBidder');
      if (fromSession) return JSON.parse(fromSession);
      const fromLocal = localStorage.getItem('auctionApp.currentMultiBidder');
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

  const currentItemIdx = auction?.currentItemIndex ?? 0;
  const currentItem = auction?.items?.[currentItemIdx];

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fresh = getMultiItemAuctionById(auctionId);
    if (fresh) setAuction(fresh);
  }, [now, auctionId]);

  // Ensure bidder is registered for all items
  useEffect(() => {
    if (!auction || !bidder) return;
    
    auction.items?.forEach((item) => {
      if (!item.bidders?.find((b) => b.id === bidder.bidderId)) {
        addBidderToItem(auctionId, item.id, {
          id: bidder.bidderId,
          name: bidder.name,
          joinedAt: Date.now(),
        });
      }
    });
  }, [auction, auctionId, bidder]);

  if (!auction) {
    return (
      <main className="page">
        <div className="card">
          <h2>Auction not found</h2>
          <button className="primary" onClick={() => navigate('/home')}>Back to home</button>
        </div>
      </main>
    );
  }

  if (!bidder) {
    return (
      <main className="page">
        <div className="card">
          <h2>Not joined yet</h2>
          <p>Please join the auction first.</p>
          <button className="primary" onClick={() => navigate('/bid/multi-join')}>Join auction</button>
        </div>
      </main>
    );
  }

  if (!currentItem) {
    return (
      <main className="page">
        <div className="card">
          <h2>Waiting for first item</h2>
          <p>The host will start with the first item soon.</p>
        </div>
      </main>
    );
  }

  const timeLeft = currentItem.timerEnd ? Math.max(0, currentItem.timerEnd - now) : 0;
  const canBid = currentItem.status === 'started' && timeLeft > 0;

  const highestBid = (() => {
    if (!currentItem.bidders?.length) return currentItem.basePrice || 0;
    const top = currentItem.bidders
      .map((b) => b.lastBid || 0)
      .reduce((max, current) => (current > max ? current : max), 0);
    return Math.max(top, currentItem.basePrice || 0);
  })();

  const getWinner = (item) => {
    if (!item?.bidders?.length) return null;
    let winner = null;
    item.bidders.forEach((b) => {
      const bid = b.lastBid ?? item.basePrice ?? 0;
      if (!winner || bid > (winner.bid ?? 0)) {
        winner = { bidder: b, bid };
      }
    });
    return winner;
  };

  const winner = getWinner(currentItem);

  // Check if current bidder is dropped for this item
  const currentBidderInfo = currentItem.bidders?.find((b) => b.id === bidder.bidderId);
  const isDropped = currentBidderInfo?.isDropped || false;

  const handleBid = (event) => {
    event.preventDefault();
    setError('');

    if (isDropped) {
      setError('You cannot bid any more because you dropped from this auction.');
      return;
    }

    const amount = Number(bidAmount);
    if (!amount || amount <= (currentItem.basePrice || 0)) {
      setError('Bid must be greater than the base price.');
      return;
    }
    if (amount <= highestBid) {
      setError('Your bid must be higher than the current highest bid.');
      return;
    }

    addBidToItem(auctionId, currentItem.id, bidder.bidderId, amount);
    setBidAmount('');
  };

  const handleDropBid = () => {
    if (window.confirm('Are you sure you want to drop out of this item?')) {
      dropBidForItem(auctionId, currentItem.id, bidder.bidderId);
    }
  };

  const handleLeave = () => {
    sessionStorage.removeItem('auctionApp.currentMultiBidder');
    localStorage.removeItem('auctionApp.currentMultiBidder');
    navigate('/home');
  };

  return (
    <main className="page" style={{ paddingBottom: '3rem' }}>
      <header className="page-header">
        <div>
          <h1>{auction.name}</h1>
          <p>Joined as: <strong>{bidder.name}</strong></p>
        </div>
        <button className="secondary" onClick={handleLeave}>Leave auction</button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Main Content */}
        <div>
          {/* Current Item */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ margin: 0 }}>📦 {currentItem.title}</h2>
                <p style={{ margin: '0.5rem 0 0', color: 'var(--muted)' }}>
                  Item {currentItemIdx + 1} of {auction.items.length}
                </p>
              </div>
            </div>

            {currentItem.imagePreviews?.[0] && (
              <img
                src={currentItem.imagePreviews[0]}
                alt={currentItem.title}
                style={{
                  width: '100%',
                  maxHeight: '400px',
                  objectFit: 'cover',
                  borderRadius: '12px',
                  marginBottom: '1rem',
                  border: '1px solid #e5e7eb'
                }}
              />
            )}

            <p style={{ color: 'var(--muted)', margin: '0 0 1rem' }}>
              {currentItem.description || 'No description provided'}
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '1rem',
              padding: '1rem',
              background: 'rgba(59, 130, 246, 0.05)',
              borderRadius: '10px',
              marginBottom: '1.5rem'
            }}>
              <div>
                <p style={{ margin: '0 0 0.25rem', color: 'var(--muted)', fontSize: '0.9rem' }}>Base Price</p>
                <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#3b82f6' }}>
                  {formatCurrency(currentItem.basePrice)}
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 0.25rem', color: 'var(--muted)', fontSize: '0.9rem' }}>Highest Bid</p>
                <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#f59e0b' }}>
                  {formatCurrency(highestBid)}
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 0.25rem', color: 'var(--muted)', fontSize: '0.9rem' }}>Status</p>
                <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, textTransform: 'capitalize', color: '#8b5cf6' }}>
                  {currentItem.status}
                </p>
              </div>
            </div>
          </div>

          {/* Timer */}
          {currentItem.status === 'started' && (
            <div className="card" style={{ marginBottom: '1.5rem', padding: '2rem', textAlign: 'center', background: 'rgba(59, 130, 246, 0.08)' }}>
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

          {/* End Alert */}
          {currentItem.status === 'ended' && (
            <div className="card" style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ margin: '0 0 0.75rem', color: '#22c55e' }}>⏰ Auction Ended for This Item</h3>
              {winner ? (
                <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>
                  🏆 <strong>{winner.bidder.name}</strong> won at {formatCurrency(winner.bid)}
                </p>
              ) : (
                <p style={{ margin: 0, color: 'var(--muted)' }}>No bids were placed</p>
              )}
            </div>
          )}

          {/* Bidding Form */}
          {canBid && !isDropped && (
            <div className="card">
              <h3 style={{ marginTop: 0 }}>💰 Place Your Bid</h3>
              <form onSubmit={handleBid}>
                <label>
                  Bid Amount (USD)
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
                    Place Bid
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
            </div>
          )}

          {isDropped && (
            <div className="card" style={{
              padding: '1.5rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px'
            }}>
              <p style={{ margin: 0, fontWeight: 600, color: '#dc2626' }}>
                🚫 You have dropped from this item and cannot bid anymore.
              </p>
            </div>
          )}

          {!canBid && currentItem.status === 'waiting' && (
            <div className="card" style={{ padding: '1.5rem', textAlign: 'center', background: 'rgba(59, 130, 246, 0.05)' }}>
              <p style={{ margin: 0, color: 'var(--muted)' }}>
                ⏳ Waiting for the host to start the bidding for this item...
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          {/* Current Bidders */}
          <div className="card" style={{ maxHeight: '70vh', overflow: 'auto' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>
              👥 Bidders ({currentItem.bidders?.length || 0})
            </h3>
            {currentItem.bidders?.length ? (
              <div>
                {currentItem.bidders
                  .slice()
                  .sort((a, b) => (b.lastBid || 0) - (a.lastBid || 0))
                  .map((b, idx) => (
                    <div
                      key={b.id}
                      style={{
                        padding: '0.75rem',
                        background: b.id === bidder.bidderId ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.04)',
                        borderRadius: '8px',
                        marginBottom: '0.5rem',
                        borderLeft: `3px solid ${b.id === bidder.bidderId ? '#3b82f6' : '#e5e7eb'}`,
                        opacity: b.isDropped ? 0.6 : 1
                      }}
                    >
                      <p style={{ margin: '0 0 0.25rem', fontWeight: 600, color: 'var(--text)' }}>
                        #{idx + 1} - {b.name} {b.id === bidder.bidderId && '(You)'} {b.isDropped && '🚫'}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#f59e0b' }}>
                        {formatCurrency(b.lastBid || 0)}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>
                        {b.isDropped ? 'Dropped' : `${(b.bids || []).length} bid(s)`}
                      </p>
                    </div>
                  ))}
              </div>
            ) : (
              <p style={{ color: 'var(--muted)' }}>No bids yet</p>
            )}
          </div>

          {/* Items Navigation */}
          <div className="card" style={{ marginTop: '1rem', maxHeight: '400px', overflow: 'auto' }}>
            <h3 style={{ marginTop: 0, marginBottom: '0.75rem' }}>📋 Items</h3>
            <div style={{ fontSize: '0.9rem' }}>
              {auction.items.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    background: idx === currentItemIdx ? 'rgba(59, 130, 246, 0.1)' : '#f9fafb',
                    borderRadius: '8px',
                    border: idx === currentItemIdx ? '1px solid #3b82f6' : '1px solid #e5e7eb',
                    cursor: 'pointer',
                    transition: 'all 200ms'
                  }}
                >
                  <p style={{ margin: '0 0 0.25rem', fontWeight: idx === currentItemIdx ? 600 : 400, color: 'var(--text)' }}>
                    {idx + 1}. {item.title}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)' }}>
                    {item.status === 'ended' && '✅ Complete'}
                    {item.status === 'started' && '🔴 In Progress'}
                    {item.status === 'waiting' && '⏳ Waiting'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
