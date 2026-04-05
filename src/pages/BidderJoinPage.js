import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { generateAuctionId } from '../utils/auctionStorage';
import { getAuctionRemote, addBidderRemote } from '../utils/firestoreAuctions';
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auctionId) return;
    setLoading(true);
    getAuctionRemote(auctionId).then((remote) => {
      if (remote) setAuction(remote);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [auctionId]);

  const handleJoin = async (event) => {
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
      setError('🔴 This auction has already ended. Access expired.');
      return;
    }

    if (auction.password !== password.trim()) {
      setError('Incorrect password for this auction.');
      return;
    }

    const currentBidders = auction.bidders || [];
    if (auction.maxBidders > 0 && currentBidders.length >= auction.maxBidders) {
      setError('This auction has reached its maximum number of bidders.');
      return;
    }

    const bidderId = generateAuctionId();

    try {
      await addBidderRemote(auction.id, { id: bidderId, name: name.trim() });
      
      const bidderSession = { auctionId: auction.id, bidderId, name: name.trim() };
      localStorage.setItem('auctionApp.currentBidder', JSON.stringify(bidderSession));
      sessionStorage.setItem('auctionApp.currentBidder', JSON.stringify(bidderSession));

      navigate(`/auction/${auction.id}`);
    } catch (err) {
      setError('Failed to join: ' + err.message);
    }
  };

  return (
    <main className="page join-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text)' }}>Join as Bidder</h1>
        <button className="secondary" onClick={() => navigate('/home')}>← Back to Home</button>
      </div>

      <div className="card">
        {auction?.status === 'ended' && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid #ef4444', 
            padding: '1rem', 
            borderRadius: '10px', 
            marginBottom: '1.5rem', 
            textAlign: 'center' 
          }}>
            <h3 style={{ color: '#ef4444', margin: 0 }}>🔴 Link Expired</h3>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>The host has completed this auction session.</p>
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

          <label>👤 Your Name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" />
          </label>

          {auction && auction.status !== 'ended' && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '10px' }}>
              <p style={{ margin: '0 0 0.5rem', fontWeight: 600 }}>{auction.title}</p>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted)' }}>{auction.description}</p>
            </div>
          )}

          {error && <div className="form-error" style={{ marginTop: '1rem' }}>{error}</div>}

          <button type="submit" className="primary" style={{ width: '100%', marginTop: '1.5rem' }} disabled={auction?.status === 'ended'}>
            Join Auction
          </button>
        </form>
      </div>
    </main>
  );
}
