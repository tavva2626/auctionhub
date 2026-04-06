import { db } from '../firebase';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  runTransaction,
  query,
  orderBy,
  addDoc,
} from 'firebase/firestore';

export async function createAuctionRemote(auction) {
  const ref = doc(db, 'auctions', auction.id);
  // We no longer strip images, allowing them to remain for bidders to see.
  // Note: Base64 strings should be kept small to respect Firestore's 1MB limit.
  await setDoc(ref, { ...auction, createdAt: serverTimestamp() });
  return { id: auction.id };
}

export async function createMultiItemAuctionRemote(auction) {
  const ref = doc(db, 'multiAuctions', auction.id);
  // Preserving images so bidders can view the item catalog.
  await setDoc(ref, { ...auction, createdAt: serverTimestamp() });
  return { id: auction.id };
}

export async function getMultiItemAuctionRemote(auctionId) {
  const ref = doc(db, 'multiAuctions', auctionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export function listenMultiItemAuctionRemote(auctionId, onUpdate) {
  const ref = doc(db, 'multiAuctions', auctionId);
  const unsub = onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      onUpdate(null);
    } else {
      onUpdate({ id: snap.id, ...snap.data() });
    }
  });
  return unsub;
}

export async function getAuctionRemote(auctionId) {
  const ref = doc(db, 'auctions', auctionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export function listenAuctionRemote(auctionId, onUpdate) {
  const ref = doc(db, 'auctions', auctionId);
  const unsub = onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      onUpdate(null);
    } else {
      onUpdate({ id: snap.id, ...snap.data() });
    }
  });
  return unsub;
}

export async function addBidderRemote(auctionId, bidder) {
  const ref = doc(db, 'auctions', auctionId);
  // append bidder to bidders array
  await updateDoc(ref, { bidders: arrayUnion({ ...bidder, status: 'active', joinedAt: Date.now() }) });
  
  // Log join event
  const bidDocRef = collection(db, 'auctions', auctionId, 'bids');
  await addDoc(bidDocRef, {
    type: 'join',
    bidderId: bidder.id,
    bidderName: bidder.name,
    time: serverTimestamp()
  });

  return bidder.id;
}

export async function placeBidRemote(auctionId, bidderId, amount) {
  const auctionRef = doc(db, 'auctions', auctionId);

  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(auctionRef);
    if (!snap.exists()) throw new Error('Auction not found');
    const data = snap.data();
    const currentHighest = data.highestBid ?? data.basePrice ?? 0;
    if (amount <= currentHighest) {
      throw new Error('Bid must be greater than current highest bid');
    }

    const bidders = Array.isArray(data.bidders) ? data.bidders.slice() : [];
    let bidderName = 'Unknown';
    let found = false;
    for (let i = 0; i < bidders.length; i++) {
      if (bidders[i].id === bidderId) {
        bidders[i] = { ...bidders[i], lastBid: amount, isDropped: false, status: 'active' };
        bidderName = bidders[i].name;
        found = true;
        break;
      }
    }
    if (!found) {
      throw new Error('Bidder not found in auction');
    }

    transaction.update(auctionRef, {
      bidders,
      highestBid: amount,
      lastUpdated: serverTimestamp(),
    });

    const bidDocRef = doc(collection(db, 'auctions', auctionId, 'bids'));
    transaction.set(bidDocRef, { 
      type: 'bid',
      bidderId, 
      bidderName,
      amount, 
      time: serverTimestamp() 
    });

    return true;
  });
}

export async function dropBidRemote(auctionId, bidderId) {
  const auctionRef = doc(db, 'auctions', auctionId);
  const snap = await getDoc(auctionRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  let bidderName = 'Unknown';
  const bidders = (data.bidders || []).map((b) => {
    if (b.id === bidderId) {
      bidderName = b.name;
      return { ...b, isDropped: true, status: 'dropped' };
    }
    return b;
  });
  await updateDoc(auctionRef, { bidders });

  // Log drop event
  const bidDocRef = collection(db, 'auctions', auctionId, 'bids');
  await addDoc(bidDocRef, {
    type: 'drop',
    bidderId,
    bidderName,
    time: serverTimestamp()
  });

  return true;
}

export async function leaveAuctionRemote(auctionId, bidderId) {
  const auctionRef = doc(db, 'auctions', auctionId);
  const snap = await getDoc(auctionRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  let bidderName = 'Unknown';
  const bidders = (data.bidders || []).map((b) => {
    if (b.id === bidderId) {
      bidderName = b.name;
      return { ...b, status: 'left' };
    }
    return b;
  });
  await updateDoc(auctionRef, { bidders });

  // Log leave event
  const bidDocRef = collection(db, 'auctions', auctionId, 'bids');
  await addDoc(bidDocRef, {
    type: 'leave',
    bidderId,
    bidderName,
    time: serverTimestamp()
  });

  return true;
}

export async function addBidderToMultiItemRemote(auctionId, bidder) {
  const ref = doc(db, 'multiAuctions', auctionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  
  const items = (data.items || []).map(item => {
    const bidders = Array.isArray(item.bidders) ? item.bidders.slice() : [];
    if (!bidders.find(b => b.id === bidder.id)) {
      bidders.push({ ...bidder, status: 'active', joinedAt: Date.now() });
    }
    return { ...item, bidders };
  });

  await updateDoc(ref, { items });

  // Log global join
  const bidDocRef = collection(db, 'multiAuctions', auctionId, 'events');
  await addDoc(bidDocRef, {
    type: 'join',
    bidderId: bidder.id,
    bidderName: bidder.name,
    time: serverTimestamp()
  });
}

export async function placeMultiItemBidRemote(auctionId, itemIndex, bidderId, amount) {
  const ref = doc(db, 'multiAuctions', auctionId);
  
  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) throw new Error('Auction not found');
    const data = snap.data();
    const items = data.items || [];
    const item = items[itemIndex];
    if (!item) throw new Error('Item not found');

    const highest = item.bidders?.reduce((max, b) => Math.max(max, b.lastBid || 0), item.basePrice || 0) || item.basePrice || 0;
    if (amount <= highest) throw new Error('Bid must be higher than current highest');

    let bidderName = 'Unknown';
    const newItems = items.map((it, idx) => {
      if (idx !== itemIndex) return it;
      const bidders = (it.bidders || []).map(b => {
        if (b.id === bidderId) {
          bidderName = b.name;
          return { ...b, lastBid: amount, status: 'active', isDropped: false };
        }
        return b;
      });
      return { ...it, bidders };
    });

    transaction.update(ref, { items: newItems });

    const eventRef = collection(db, 'multiAuctions', auctionId, 'events');
    const newEventRef = doc(eventRef);
    transaction.set(newEventRef, {
      type: 'bid',
      itemId: item.id,
      itemTitle: item.title,
      bidderId,
      bidderName,
      amount,
      time: serverTimestamp()
    });

    return true;
  });
}

export async function dropMultiItemBidRemote(auctionId, itemIndex, bidderId) {
  const ref = doc(db, 'multiAuctions', auctionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const items = data.items || [];
  let bidderName = 'Unknown';
  let itemTitle = 'Unknown';
  let itemId = '';

  const newItems = items.map((it, idx) => {
    if (idx !== itemIndex) return it;
    itemTitle = it.title;
    itemId = it.id;
    const bidders = (it.bidders || []).map(b => {
      if (b.id === bidderId) {
        bidderName = b.name;
        return { ...b, isDropped: true, status: 'dropped' };
      }
      return b;
    });
    return { ...it, bidders };
  });

  await updateDoc(ref, { items: newItems });

  const eventRef = collection(db, 'multiAuctions', auctionId, 'events');
  await addDoc(eventRef, {
    type: 'drop',
    itemId,
    itemTitle,
    bidderId,
    bidderName,
    time: serverTimestamp()
  });
}

export async function leaveMultiItemAuctionRemote(auctionId, bidderId) {
  const ref = doc(db, 'multiAuctions', auctionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const items = data.items || [];
  let bidderName = 'Unknown';

  const newItems = items.map((it) => {
    const bidders = (it.bidders || []).map(b => {
      if (b.id === bidderId) {
        bidderName = b.name;
        return { ...b, status: 'left' };
      }
      return b;
    });
    return { ...it, bidders };
  });

  await updateDoc(ref, { items: newItems });

  const eventRef = collection(db, 'multiAuctions', auctionId, 'events');
  await addDoc(eventRef, {
    type: 'leave',
    bidderId,
    bidderName,
    time: serverTimestamp()
  });
}

export async function getAuctionBidHistory(auctionId, isMulti = false) {
  const collectionName = isMulti ? 'multiAuctions' : 'auctions';
  const subCollectionName = isMulti ? 'events' : 'bids';
  const ref = collection(db, collectionName, auctionId, subCollectionName);
  const q = query(ref, orderBy('time', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function saveUserProfile(uid, userData) {
  const ref = doc(db, 'users', uid);
  await setDoc(ref, { 
    ...userData, 
    lastLogin: serverTimestamp() 
  }, { merge: true });
}

export async function updateAuctionRemote(auctionId, data) {
  const ref = doc(db, 'auctions', auctionId);
  await updateDoc(ref, data);
  return true;
}

export async function updateMultiItemAuctionRemote(auctionId, data) {
  const ref = doc(db, 'multiAuctions', auctionId);
  await updateDoc(ref, data);
  return true;
}
