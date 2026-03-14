import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAuction, generateAuctionId } from '../utils/auctionStorage';
import { useAuth } from '../context/AuthContext';

export default function HostCreateAuctionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [history, setHistory] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [maxBidders, setMaxBidders] = useState('5');
  const [imageUrls, setImageUrls] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  if (!user) return null;

  const handleCreate = (event) => {
    event.preventDefault();
    setError('');

    if (!title.trim() || !password.trim()) {
      setError('Auction title and password are required.');
      return;
    }

    const auctionId = generateAuctionId();

    const auction = {
      id: auctionId,
      password: password.trim(),
      title: title.trim(),
      description: description.trim(),
      history: history.trim(),
      basePrice: Number(basePrice) || 0,
      maxBidders: Number(maxBidders) || 5,
      images: imageUrls
        .split(/\s*,\s*/)
        .filter(Boolean)
        .slice(0, 6),
      createdBy: user?.username || 'host',
      createdAt: Date.now(),
      status: 'waiting',
      timerEnd: null,
      bidders: [],
      winner: null,
    };

    createAuction(auction);
    navigate(`/host/auction/${auctionId}`);
  };

  return (
    <main className="page create-auction-page">
      <header className="page-header">
        <h1>Create an Auction</h1>
        <p>Fill in the details and share the generated link with bidders.</p>
      </header>

      <form className="card form-card" onSubmit={handleCreate}>
        <label>
          Auction Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A great item" />
        </label>

        <label>
          Base Price (USD)
          <input
            type="number"
            step="0.01"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            placeholder="0"
          />
        </label>

        <label>
          Maximum number of bidders
          <input
            type="number"
            min="1"
            value={maxBidders}
            onChange={(e) => setMaxBidders(e.target.value)}
            placeholder="5"
          />
        </label>

        <label>
          Item description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Where did this come from? Why is it special?"
          />
        </label>

        <label>
          Item history (optional)
          <textarea
            value={history}
            onChange={(e) => setHistory(e.target.value)}
            placeholder="Previous owners, provenance, etc."
          />
        </label>

        <label>
          Image URLs (comma-separated)
          <input
            value={imageUrls}
            onChange={(e) => setImageUrls(e.target.value)}
            placeholder="https://... , https://..."
          />
        </label>

        <label>
          Auction password (share with bidders)
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Secret password"
          />
        </label>

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button type="submit" className="primary">
            Create auction
          </button>
          <button type="button" className="secondary" onClick={() => navigate('/home')}>
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
