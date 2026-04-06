import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { formatCurrency, getWinner } from '../utils/auctionStorage';
import { listenAuctionRemote, updateAuctionRemote, getAuctionBidHistory } from '../utils/firestoreAuctions';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import ModalDialog from '../components/ModalDialog';
import NetworkAccessInfo from '../components/NetworkAccessInfo';
import { getNetworkURL } from '../utils/networkURL';
import * as XLSX from 'xlsx';

function formatTimeRemaining(ms) {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export default function HostAuctionPage() {
  usePageTitle('Host - Auction Dashboard');
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [auction, setAuction] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [showStartModal, setShowStartModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const isHost = user?.username === auction?.createdBy;

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const unsub = listenAuctionRemote(auctionId, (data) => {
      setAuction(data);
    });
    return () => unsub && unsub();
  }, [auctionId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!auction) return;
    if (auction.status === 'started' && auction.timerEnd && now >= auction.timerEnd) {
      updateAuctionRemote(auction.id, { status: 'ended' });
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

  const shareLink = getNetworkURL(`/bid/join?auctionId=${auction.id}&password=${encodeURIComponent(
    auction.password
  )}`);

  const timeRemaining = auction.timerEnd ? Math.max(0, auction.timerEnd - now) : 0;

  const winner = getWinner(auction);

  const handleStart = () => {
    setShowStartModal(true);
  };

  const handleStartConfirm = async (minutes) => {
    const numMinutes = Number(minutes) || 5;
    if (numMinutes <= 0) {
      setShowStartModal(false);
      return;
    }
    const timerEnd = Date.now() + numMinutes * 60 * 1000;
    await updateAuctionRemote(auction.id, {
      status: 'started',
      timerEnd,
    });
    setShowStartModal(false);
  };

  const handleEnd = async () => {
    await updateAuctionRemote(auction.id, { status: 'ended' });
  };

  const handleClear = () => {
    setShowClearModal(true);
  };

  const handleClearConfirm = async (confirmed) => {
    setShowClearModal(false);
    if (confirmed) {
      await updateAuctionRemote(auction.id, { bidders: [] });
    }
  };

  const handleExportData = async () => {
    if (!auction || isExporting) return;
    setIsExporting(true);
    try {
      const history = await getAuctionBidHistory(auction.id);
      
      const rows = history.map(event => {
        const time = event.time?.seconds 
          ? new Date(event.time.seconds * 1000).toLocaleString() 
          : new Date().toLocaleString();
        
        return {
          "Timestamp": time,
          "Event Type": (event.type || 'bid').toUpperCase(),
          "Bidder Name": event.bidderName || 'Unknown',
          "Amount": event.amount || 0,
          "Bidder ID": event.bidderId || ''
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Audit Log");
      XLSX.writeFile(wb, `auction-${auction.id}-audit-log.xlsx`);

    } catch (err) {
      alert("Failed to export data: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyLink = () => {
    const shareLink = getNetworkURL(`/bid/join?auctionId=${auction.id}&password=${encodeURIComponent(auction.password)}`);
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }).catch(() => {
      alert('Failed to copy link');
    });
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

      <div className="auction-layout-container">
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

        {auction.imagePreviews?.[0] && (
          <div style={{
            width: '100%',
            height: '300px',
            backgroundColor: '#f3f4f6',
            borderRadius: '12px',
            overflow: 'hidden',
            margin: '1.5rem 0',
            border: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img
              src={auction.imagePreviews[0]}
              alt={auction.title}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
            />
          </div>
        )}

        <h3>Description</h3>
        <p>{auction.description || 'No description provided.'}</p>

        <div className="share-section">
          <h3>Share this auction</h3>
          <p>Share this link or show the QR code to bidders.</p>
          <div className="share-box">
            <input readOnly value={shareLink} />
            <button
              onClick={handleCopyLink}
              title="Copy link to clipboard"
              style={{
                background: copyFeedback ? '#10b981' : 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 200ms ease',
                fontSize: '0.9rem',
              }}
            >
              {copyFeedback ? '✓ Copied!' : '📋 Copy'}
            </button>
            <QRCodeCanvas value={shareLink} size={148} />
          </div>
        </div>

        <div className="auction-actions">
          {auction.status === 'waiting' && !auction.timerEnd && (
            <button className="primary" onClick={handleStart}>
              Start auction timer
            </button>
          )}
          {auction.status === 'started' && (
            <button className="primary" onClick={handleEnd}>
              End auction now
            </button>
          )}
          {auction.status === 'ended' && (
            <button 
              className="primary" 
              onClick={handleExportData} 
              disabled={isExporting}
              style={{ background: '#10b981', border: 'none' }}
            >
              {isExporting ? '⌛ Processing...' : '⬇️ Download Audit Log (Excel)'}
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
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {auction.bidders
                .slice()
                .sort((a, b) => (b.lastBid || 0) - (a.lastBid || 0))
                .map((b, idx) => (
                <tr key={b.id} style={{ opacity: (b.status === 'dropped' || b.status === 'left') ? 0.6 : 1 }}>
                  <td>#{idx + 1} - {b.name}</td>
                  <td className="bid-amount">{formatCurrency(b.lastBid ?? 0)}</td>
                  <td>
                    <span className="badge" style={{ 
                      background: b.status === 'active' ? '#22c55e' : (b.status === 'dropped' ? '#ef4444' : '#f59e0b'),
                      color: 'white',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      {(b.status || 'Active').toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No participants yet.</p>
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
      </div>

      <ModalDialog
        isOpen={showStartModal}
        title="Start Auction"
        message="How long should the auction run? (in minutes)"
        type="prompt"
        defaultValue="5"
        onConfirm={handleStartConfirm}
        onCancel={() => setShowStartModal(false)}
        confirmText="Start"
        cancelText="Cancel"
      />

      <ModalDialog
        isOpen={showClearModal}
        title="Clear Auction"
        message="Are you sure you want to clear all bidders and bids? This action cannot be undone."
        type="confirm"
        onConfirm={handleClearConfirm}
        onCancel={() => setShowClearModal(false)}
        confirmText="Clear"
        cancelText="Cancel"
      />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1.5rem' }}>
        <NetworkAccessInfo />
      </div>
    </main>
  );
}
