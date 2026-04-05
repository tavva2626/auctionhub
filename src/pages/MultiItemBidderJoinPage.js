import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { generateAuctionId } from '../utils/auctionStorage';
import { getMultiItemAuctionRemote } from '../utils/firestoreAuctions';
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auctionId) return;
    setLoading(true);
    getMultiItemAuctionRemote(auctionId).then((remote) => {
      if (remote) setAuction(remote);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [auctionId]);

  const handleJoin = (event) => {
    event.preventDefault();
    setError('');

    if (!auctionId.trim() || !password.trim() || !name.trim()) {
      setError('Please provide auction ID, password, and your name.');
      return;
    }

    if (!auction) {
      setError('Searching for auction...');
      return;
    }

    if (auction.status === 'ended') {
      setError('🔴 This auction session has ended and is no longer accepting bidders.');
      return;
    }

    if (auction.password !== password.trim()) {
      setError('Incorrect password for this auction.');
      return;
    }

    const totalBidders = new Set();
    (auction.items || []).forEach((item) => {
      (item.bidders || []).forEach((b) => {
        totalBidders.add(b.id);
      });
    });

    if (auction.maxBidders > 0 && totalBidders.size >= auction.maxBidders) {
      setError('This auction has reached its maximum number of bidders.');
      return;
    }

    const bidderId = generateAuctionId();
    const bidderInfo = { auctionId: auction.id, bidderId, name: name.trim() };

    localStorage.setItem('auctionApp.currentMultiBidder', JSON.stringify(bidderInfo));
    sessionStorage.setItem('auctionApp.currentMultiBidder', JSON.stringify(bidderInfo));

    navigate(`/multi-auction/${auction.id}`);
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
            Bid on multiple items in one professional session
          </p>
        </div>

        <div className="card">
          {auction?.status === 'ended' && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', textAlign: 'center' }}>
              <h3 style={{ color: '#ef4444', margin: 0 }}>🚫 Auction Completed</h3>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>The host has finished this session. The link is now expired.</p>
            </div>
          )}

          <form onSubmit={handleJoin}>
            <label>
              💼 Auction ID
              <input value={auctionId} onChange={(e) => setAuctionId(e.target.value)} placeholder="Enter auction ID" disabled={loading} />
            </label>

            <label>
              🔐 Auction Password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" />
            </label>

            <label>
              👤 Your Name
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" />
            </label>

            {auction && auction.status !== 'ended' && (
              <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '10px' }}>
                <p style={{ margin: '0 0 0.5rem', fontWeight: 600 }}>{auction.name}</p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted)' }}>Items: {auction.items?.length || 0}</p>
              </div>
            )}

            {error && <div className="form-error" style={{ marginTop: '1rem' }}>{error}</div>}

            <button type="submit" className="primary" style={{ width: '100%', marginTop: '1.5rem' }} disabled={auction?.status === 'ended'}>
              Join Auction
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
