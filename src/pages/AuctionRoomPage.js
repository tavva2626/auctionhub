import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  addBid,
  formatCurrency,
  getAuctionById,
  getWinner,
  updateAuction,
} from '../utils/auctionStorage';

export default function AuctionRoomPage() {
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

  const handleBid = (event) => {
    event.preventDefault();
    setError('');
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

      <section className="card auction-info">
        <h2>Auction info</h2>
        <p>
          <strong>Status:</strong> {auction.status}
        </p>
        {auction.status === 'started' && (
          <p>
            <strong>Time left:</strong> {Math.floor(timeLeft / 1000)}s
          </p>
        )}
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

        {canBid && (
          <form className="bid-form" onSubmit={handleBid}>
            <label>
              Your bid (USD)
              <input
                type="number"
                step="1"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder="Enter an amount"
              />
            </label>
            {error && <div className="form-error">{error}</div>}
            <button type="submit" className="primary">
              Place bid
            </button>
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
                <tr key={b.id} className={b.id === bidder.bidderId ? 'current-bidder' : ''}>
                  <td>#{idx + 1} - {b.name} {b.id === bidder.bidderId && <span className="badge">(You)</span>}</td>
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
    </main>
  );
}
