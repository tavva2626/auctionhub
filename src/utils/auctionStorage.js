const STORAGE_KEY = 'auctionApp.auctions';

function loadAuctions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

function saveAuctions(auctions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auctions));
}

export function getAuctionById(auctionId) {
  const auctions = loadAuctions();
  return auctions.find((a) => a.id === auctionId) || null;
}

export function createAuction(auction) {
  const auctions = loadAuctions();
  auctions.unshift(auction);
  saveAuctions(auctions);
  return auction;
}

export function updateAuction(auctionId, changes) {
  const auctions = loadAuctions();
  const idx = auctions.findIndex((a) => a.id === auctionId);
  if (idx === -1) return null;
  auctions[idx] = { ...auctions[idx], ...changes };
  saveAuctions(auctions);
  return auctions[idx];
}

export function addBidder(auctionId, bidder) {
  const auction = getAuctionById(auctionId);
  if (!auction) return null;
  const bidders = auction.bidders || [];
  const existing = bidders.find((b) => b.id === bidder.id);
  if (!existing) {
    bidders.push({ ...bidder, bids: [] });
  }
  return updateAuction(auctionId, { bidders });
}

export function addBid(auctionId, bidderId, amount) {
  const auction = getAuctionById(auctionId);
  if (!auction) return null;
  const bidders = (auction.bidders || []).map((b) => {
    if (b.id !== bidderId) return b;
    const nextBid = { amount, time: Date.now() };
    return { ...b, bids: [...(b.bids || []), nextBid], lastBid: amount };
  });
  return updateAuction(auctionId, { bidders });
}

export function generateAuctionId() {
  // Simple unique id based on timestamp and random number
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getWinner(auction) {
  if (!auction?.bidders?.length) return null;
  let winner = null;
  auction.bidders.forEach((b) => {
    const bid = b.lastBid ?? b.basePrice ?? 0;
    if (!winner || bid > (winner.bid ?? 0)) {
      winner = { bidder: b, bid };
    }
  });
  return winner;
}

export function formatCurrency(value) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value);
}
