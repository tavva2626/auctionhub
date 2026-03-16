import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { getMultiItemAuctionById, updateMultiItemAuction } from '../utils/auctionStorage';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/auctionStorage';
import { usePageTitle } from '../hooks/usePageTitle';

export default function MultiItemAuctionHostPage() {
  usePageTitle('Host - Multi-Item Auction');
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [auction, setAuction] = useState(() => getMultiItemAuctionById(auctionId));
  const [now, setNow] = useState(Date.now());
  const [timerSeconds, setTimerSeconds] = useState('60');
  const [showWinnerAlert, setShowWinnerAlert] = useState(false);
  const [winnerMessage, setWinnerMessage] = useState('');

  const isHost = user?.username === auction?.createdBy;
  const currentItemIdx = auction?.currentItemIndex ?? 0;
  const currentItem = auction?.items?.[currentItemIdx];

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fresh = getMultiItemAuctionById(auctionId);
    if (fresh) setAuction(fresh);
  }, [now, auctionId]);

  const getWinnerForItem = (item) => {
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

  const updateItemStatus = (status) => {
    if (!currentItem) return;
    const items = (auction.items || []).map((item) => {
      if (item.id !== currentItem.id) return item;
      return { ...item, status };
    });
    updateMultiItemAuction(auctionId, { items });
  };

  useEffect(() => {
    if (!currentItem || currentItem.status !== 'started') return;
    
    if (currentItem.timerEnd && now >= currentItem.timerEnd) {
      // Timer finished
      const winner = getWinnerForItem(currentItem);
      if (winner) {
        setWinnerMessage(
          `🏆 ${winner.bidder.name} won Item ${currentItemIdx + 1}: "${currentItem.title}" at ${formatCurrency(winner.bid)}`
        );
      } else {
        setWinnerMessage(
          `⏰ Time's up for "${currentItem.title}" - No bids were placed`
        );
      }
      setShowWinnerAlert(true);
      
      // Update item status to ended
      updateItemStatus('ended');
    }
  }, [currentItem, now, currentItemIdx]);

  const handleStartTimer = () => {
    if (!currentItem) return;
    const seconds = Number(timerSeconds) || 60;
    if (seconds <= 0) return;

    const timerEnd = Date.now() + seconds * 1000;
    const items = (auction.items || []).map((item) => {
      if (item.id !== currentItem.id) return item;
      return { ...item, status: 'started', timerEnd };
    });

    updateMultiItemAuction(auctionId, { items });
  };

  const handleEndTimer = () => {
    if (!currentItem) return;
    updateItemStatus('ended');
  };

  const moveToNextItem = () => {
    if (currentItemIdx + 1 < auction.items.length) {
      updateMultiItemAuction(auctionId, { currentItemIndex: currentItemIdx + 1 });
      setShowWinnerAlert(false);
      setTimerSeconds('60');
    }
  };

  const completeAuction = () => {
    updateMultiItemAuction(auctionId, { status: 'ended' });
    navigate('/home');
  };

  if (!auction) {
    return (
      <main className="page">
        <div className="card">
          <h2>Auction not found</h2>
          <Link to="/home" className="primary">Back to home</Link>
        </div>
      </main>
    );
  }

  if (!isHost) {
    return (
      <main className="page">
        <div className="card">
          <h2>Access denied</h2>
          <p>Only the auction host can access this page.</p>
          <Link to="/home" className="primary">Back to home</Link>
        </div>
      </main>
    );
  }

  if (!currentItem) {
    return (
      <main className="page">
        <div className="card">
          <h2>No items found</h2>
          <Link to="/home" className="primary">Back to home</Link>
        </div>
      </main>
    );
  }

  const timeLeft = currentItem.timerEnd ? Math.max(0, currentItem.timerEnd - now) : 0;
  const canBid = currentItem.status === 'started' && timeLeft > 0;
  const shareLink = `${window.location.origin}/bid/multi-join?auctionId=${auction.id}&password=${encodeURIComponent(auction.password)}`;

  return (
    <main className="page" style={{ paddingBottom: '3rem' }}>
      <header className="page-header">
        <div>
          <h1>📊 {auction.name}</h1>
          <p>Item {currentItemIdx + 1} of {auction.items.length}</p>
        </div>
        <div className="header-actions">
          <Link to="/home" className="secondary">Back to home</Link>
        </div>
      </header>

      {/* Winner Alert */}
      {showWinnerAlert && (
        <div style={{
          position: 'fixed',
          top: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          color: 'white',
          padding: '1.5rem 2rem',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          maxWidth: '500px',
          zIndex: 1000,
          animation: 'slideDown 0.4s ease-out',
        }}>
          <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
            {winnerMessage}
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Main Content */}
        <div>
          {/* Item Display */}
          <div className="card">
            <h2 style={{ marginTop: 0 }}>📦 {currentItem.title}</h2>

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

            {currentItem.imagePreviews?.length > 1 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.75rem',
                marginBottom: '1rem'
              }}>
                {currentItem.imagePreviews.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${currentItem.title} ${idx + 1}`}
                    style={{
                      width: '100%',
                      height: '80px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: '2px solid #e5e7eb'
                    }}
                  />
                ))}
              </div>
            )}

            <p style={{ color: 'var(--muted)', margin: '0 0 1rem' }}>
              {currentItem.description}
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              padding: '1rem',
              background: 'rgba(59, 130, 246, 0.05)',
              borderRadius: '10px',
              marginBottom: '1rem'
            }}>
              <div>
                <p style={{ margin: '0 0 0.25rem', color: 'var(--muted)', fontSize: '0.9rem' }}>Base Price</p>
                <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#3b82f6' }}>
                  {formatCurrency(currentItem.basePrice)}
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

          {/* Timer Section */}
          <div className="card">
            <h3 style={{ marginTop: 0 }}>⏱️ Timer Management</h3>

            {currentItem.status === 'waiting' && (
              <div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <input
                    type="number"
                    min="5"
                    max="3600"
                    value={timerSeconds}
                    onChange={(e) => setTimerSeconds(e.target.value)}
                    placeholder="60"
                    style={{
                      padding: '0.75rem',
                      borderRadius: '10px',
                      border: '1px solid #e5e7eb',
                      fontSize: '1rem',
                      fontWeight: 600
                    }}
                  />
                  <button
                    onClick={handleStartTimer}
                    className="primary"
                    style={{ margin: 0 }}
                  >
                    Start Timer
                  </button>
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>
                  ℹ️ Enter seconds (5-3600) for how long bidding will last
                </p>
              </div>
            )}

            {currentItem.status === 'started' && (
              <div>
                <div style={{
                  fontSize: '3.5rem',
                  fontWeight: 700,
                  color: '#3b82f6',
                  textAlign: 'center',
                  padding: '1.5rem',
                  background: 'rgba(59, 130, 246, 0.08)',
                  borderRadius: '12px',
                  marginBottom: '1rem',
                  fontFamily: 'monospace',
                  letterSpacing: '0.1em'
                }}>
                  {Math.floor(timeLeft / 1000)}s
                </div>
                <button
                  onClick={handleEndTimer}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  End Timer Now
                </button>
              </div>
            )}

            {currentItem.status === 'ended' && (
              <div style={{
                padding: '1rem',
                background: 'rgba(34, 197, 94, 0.1)',
                borderRadius: '10px',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                marginBottom: '1rem'
              }}>
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--text)' }}>
                  ✅ Auction for this item is complete
                </p>
              </div>
            )}
          </div>

          {/* Share Link */}
          <div className="card">
            <h3 style={{ marginTop: 0 }}>🔗 Share Auction Link</h3>
            <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>
              Share this with bidders to join the multi-item auction
            </p>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input
                readOnly
                value={shareLink}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                  fontSize: '0.85rem',
                  color: 'var(--muted)'
                }}
              />
              <QRCodeCanvas value={shareLink} size={120} />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Participants */}
          <div className="card" style={{ maxHeight: '70vh', overflow: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>
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
                        background: 'rgba(59, 130, 246, 0.04)',
                        borderRadius: '8px',
                        marginBottom: '0.5rem',
                        borderLeft: '3px solid #3b82f6',
                        opacity: b.isDropped ? 0.6 : 1
                      }}
                    >
                      <p style={{ margin: '0 0 0.25rem', fontWeight: 600, color: 'var(--text)' }}>
                        #{idx + 1} - {b.name} {b.isDropped && '🚫'}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#f59e0b' }}>
                        Bid: {formatCurrency(b.lastBid || 0)}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>
                        {b.isDropped ? 'Dropped' : `Bids: ${(b.bids || []).length}`}
                      </p>
                    </div>
                  ))}
              </div>
            ) : (
              <p style={{ color: 'var(--muted)' }}>No bidders yet</p>
            )}
          </div>

          {/* Item Navigation */}
          <div className="card" style={{ marginTop: '1rem' }}>
            <h3 style={{ marginTop: 0 }}>📋 Items</h3>
            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
              {auction.items.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => {
                    updateMultiItemAuction(auctionId, { currentItemIndex: idx });
                    setShowWinnerAlert(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    textAlign: 'left',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    background: idx === currentItemIdx ? 'rgba(59, 130, 246, 0.1)' : '#f9fafb',
                    cursor: 'pointer',
                    transition: 'all 200ms',
                    borderLeft: idx === currentItemIdx ? '4px solid #3b82f6' : '4px solid transparent'
                  }}
                >
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: idx === currentItemIdx ? 600 : 400 }}>
                    {idx + 1}. {item.title}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)' }}>
                    {item.status === 'ended' && '✅ Complete'}
                    {item.status === 'started' && '🔴 In Progress'}
                    {item.status === 'waiting' && '⏳ Waiting'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          {currentItem.status === 'ended' && currentItemIdx < auction.items.length - 1 && (
            <button
              onClick={moveToNextItem}
              className="primary"
              style={{ width: '100%', marginTop: '1rem' }}
            >
              → Next Item
            </button>
          )}

          {currentItemIdx === auction.items.length - 1 && currentItem.status === 'ended' && (
            <button
              onClick={completeAuction}
              style={{
                width: '100%',
                marginTop: '1rem',
                padding: '0.85rem',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ✅ Complete Auction
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </main>
  );
}
