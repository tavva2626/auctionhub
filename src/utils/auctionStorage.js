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
    return { ...b, bids: [...(b.bids || []), nextBid], lastBid: amount, isDropped: false };
  });
  return updateAuction(auctionId, { bidders });
}

export function dropBid(auctionId, bidderId) {
  const auction = getAuctionById(auctionId);
  if (!auction) return null;
  const bidders = (auction.bidders || []).map((b) => {
    if (b.id !== bidderId) return b;
    return { ...b, isDropped: true };
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
    // Skip dropped bidders
    if (b.isDropped) return;
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

// Multi-item auction storage
const MULTI_STORAGE_KEY = 'auctionApp.multiAuctions';

function loadMultiAuctions() {
  try {
    const raw = localStorage.getItem(MULTI_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

function saveMultiAuctions(auctions) {
  localStorage.setItem(MULTI_STORAGE_KEY, JSON.stringify(auctions));
}

export function createMultiItemAuction(auction) {
  const auctions = loadMultiAuctions();
  auctions.unshift(auction);
  saveMultiAuctions(auctions);
  return auction;
}

export function getMultiItemAuctionById(auctionId) {
  const auctions = loadMultiAuctions();
  return auctions.find((a) => a.id === auctionId) || null;
}

export function updateMultiItemAuction(auctionId, changes) {
  const auctions = loadMultiAuctions();
  const idx = auctions.findIndex((a) => a.id === auctionId);
  if (idx === -1) return null;
  auctions[idx] = { ...auctions[idx], ...changes };
  saveMultiAuctions(auctions);
  return auctions[idx];
}

export function addItemToMultiAuction(auctionId, item) {
  const auction = getMultiItemAuctionById(auctionId);
  if (!auction) return null;
  const items = auction.items || [];
  
  const newItem = {
    ...item,
    id: generateAuctionId(),
    status: 'waiting',
    bidders: [],
    bids: [],
    winner: null,
    timerEnd: null,
  };
  
  items.push(newItem);
  return updateMultiItemAuction(auctionId, { items });
}

export function updateItemInMultiAuction(auctionId, itemId, changes) {
  const auction = getMultiItemAuctionById(auctionId);
  if (!auction) return null;
  
  const items = (auction.items || []).map((item) => {
    if (item.id !== itemId) return item;
    return { ...item, ...changes };
  });
  
  updateMultiItemAuction(auctionId, { items });
  return items.find((i) => i.id === itemId);
}

export function addBidderToItem(auctionId, itemId, bidder) {
  const auction = getMultiItemAuctionById(auctionId);
  if (!auction) return null;
  
  const items = (auction.items || []).map((item) => {
    if (item.id !== itemId) return item;
    const bidders = item.bidders || [];
    const existing = bidders.find((b) => b.id === bidder.id);
    if (!existing) {
      bidders.push({ ...bidder, bids: [] });
    }
    return { ...item, bidders };
  });
  
  updateMultiItemAuction(auctionId, { items });
}

export function addBidToItem(auctionId, itemId, bidderId, amount) {
  const auction = getMultiItemAuctionById(auctionId);
  if (!auction) return null;
  
  const items = (auction.items || []).map((item) => {
    if (item.id !== itemId) return item;
    
    const bidders = (item.bidders || []).map((b) => {
      if (b.id !== bidderId) return b;
      const nextBid = { amount, time: Date.now() };
      return { ...b, bids: [...(b.bids || []), nextBid], lastBid: amount, isDropped: false };
    });
    
    return { ...item, bidders };
  });
  
  updateMultiItemAuction(auctionId, { items });
}

export function dropBidForItem(auctionId, itemId, bidderId) {
  const auction = getMultiItemAuctionById(auctionId);
  if (!auction) return null;
  
  const items = (auction.items || []).map((item) => {
    if (item.id !== itemId) return item;
    
    const bidders = (item.bidders || []).map((b) => {
      if (b.id !== bidderId) return b;
      return { ...b, isDropped: true };
    });
    
    return { ...item, bidders };
  });
  
  updateMultiItemAuction(auctionId, { items });
}

export function getWinnerForItem(item) {
  if (!item?.bidders?.length) return null;
  let winner = null;
  item.bidders.forEach((b) => {
    // Skip dropped bidders when finding winner
    if (b.isDropped) return;
    const bid = b.lastBid ?? item.basePrice ?? 0;
    if (!winner || bid > (winner.bid ?? 0)) {
      winner = { bidder: b, bid };
    }
  });
  return winner;
}
