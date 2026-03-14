import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { formatCurrency, getAuctionById, getWinner, updateAuction } from '../utils/auctionStorage';
import { useAuth } from '../context/AuthContext';

function formatTimeRemaining(ms) {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export default function HostAuctionPage() {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [auction, setAuction] = useState(() => getAuctionById(auctionId));
  const [now, setNow] = useState(Date.now());

  const isHost = user?.username === auction?.createdBy;

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Keep in sync with local storage in case someone else updated it.
    const fresh = getAuctionById(auctionId);
    if (fresh) {
      setAuction(fresh);
    }
  }, [now, auctionId]);

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
          <p>The auction ID may be invalid or it has been removed.</p>
          <Link to="/home" className="primary">
            Back to home
          </Link>
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
          <Link to="/home" className="primary">
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  const shareLink = `${window.location.origin}/bid/join?auctionId=${auction.id}&password=${encodeURIComponent(
    auction.password
  )}`;

  const timeRemaining = auction.timerEnd ? Math.max(0, auction.timerEnd - now) : 0;

  const winner = getWinner(auction);

  const handleStart = () => {
    const seconds = Number(
      window.prompt('How long should the auction run? (seconds)', '60') || '60'
    );
    if (!seconds || seconds <= 0) return;
    const timerEnd = Date.now() + seconds * 1000;
    const updated = updateAuction(auction.id, {
      status: 'started',
      timerEnd,
    });
    setAuction(updated);
  };

  const handleEnd = () => {
    const updated = updateAuction(auction.id, { status: 'ended' });
    setAuction(updated);
  };

  const handleClear = () => {
    if (window.confirm('Clear all bidders and bids?')) {
      const updated = updateAuction(auction.id, { bidders: [] });
      setAuction(updated);
    }
  };

  return (
    <main className="page auction-page">
      <header className="page-header">
        <div>
          <h1>Host view: {auction.title}</h1>
          <p>Created by {auction.createdBy}</p>
        </div>
        <div className="header-actions">
          <Link to="/home" className="secondary">
            Back to home
          </Link>
          <button className="secondary" onClick={() => navigate('/host/create')}>
            Create new auction
          </button>
        </div>
      </header>

      <section className="card auction-summary">
        <h2>Auction details</h2>
        <div className="auction-meta">
          <div>
            <strong>Base price:</strong> {formatCurrency(auction.basePrice)}
          </div>
          <div>
            <strong>Max bidders:</strong> {auction.maxBidders}
          </div>
          <div>
            <strong>Status:</strong> {auction.status}
          </div>
          {auction.status === 'started' && (
            <div>
              <strong>Time left:</strong> {formatTimeRemaining(timeRemaining)}
            </div>
          )}
        </div>

        <h3>Description</h3>
        <p>{auction.description || 'No description provided.'}</p>

        {auction.history && (
          <>
            <h3>History</h3>
            <p>{auction.history}</p>
          </>
        )}

        {auction.images?.length > 0 && (
          <div className="image-grid">
            {auction.images.map((src) => (
              <img key={src} src={src} alt={auction.title} />
            ))}
          </div>
        )}

        <div className="share-section">
          <h3>Share this auction</h3>
          <p>Share this link or show the QR code to bidders.</p>
          <div className="share-box">
            <input readOnly value={shareLink} />
            <QRCodeCanvas value={shareLink} size={148} />
          </div>
        </div>

        <div className="auction-actions">
          {auction.status === 'waiting' && (
            <button className="primary" onClick={handleStart}>
              Start auction timer
            </button>
          )}
          {auction.status === 'started' && (
            <button className="primary" onClick={handleEnd}>
              End auction now
            </button>
          )}
          <button className="secondary" onClick={handleClear}>
            Clear bidders
          </button>
        </div>
      </section>

      <section className="card bidder-list">
        <h2>Participants ({auction.bidders?.length || 0})</h2>
        {auction.bidders?.length ? (
          <table>
            <thead>
              <tr>
                <th>Bidder</th>
                <th>Last bid</th>
                <th>Total bids</th>
              </tr>
            </thead>
            <tbody>
              {auction.bidders
                .slice()
                .sort((a, b) => (b.lastBid || 0) - (a.lastBid || 0))
                .map((b, idx) => (
                <tr key={b.id}>
                  <td>#{idx + 1} - {b.name}</td>
                  <td className="bid-amount">{formatCurrency(b.lastBid ?? 0)}</td>
                  <td className="bid-count">{(b.bids || []).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No bidders have joined yet.</p>
        )}

        {auction.status === 'ended' && (
          <div className="winner-box">
            <h3>Winner</h3>
            {winner ? (
              <p>
                <strong>{winner.bidder.name}</strong> with a bid of{' '}
                {formatCurrency(winner.bid)}
              </p>
            ) : (
              <p>No bids were placed.</p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
