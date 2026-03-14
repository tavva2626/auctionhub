import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { addBidder, getAuctionById, generateAuctionId } from '../utils/auctionStorage';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function BidderJoinPage() {
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
    if (found.maxBidders && currentBidders.length >= found.maxBidders) {
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
      <div className="card">
        <h1>Join as bidder</h1>
        <p>Enter the auction ID and password provided by the host.</p>

        <form onSubmit={handleJoin}>
          <label>
            Auction ID
            <input value={auctionId} onChange={(e) => setAuctionId(e.target.value)} placeholder="Auction ID" />
          </label>

          <label>
            Auction password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Auction password"
            />
          </label>

          <label>
            Your name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bidder name" />
          </label>

          {auction && (
            <div className="auction-summary">
              <h3>About this auction</h3>
              <p>
                <strong>{auction.title}</strong> (base price: ${auction.basePrice || 0})
              </p>
              <p>{auction.description}</p>
            </div>
          )}

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="primary">
            Join auction
          </button>
        </form>
      </div>
    </main>
  );
}
