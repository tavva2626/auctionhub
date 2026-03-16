import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import HostCreateAuctionPage from './pages/HostCreateAuctionPage';
import HostAuctionPage from './pages/HostAuctionPage';
import BidderJoinPage from './pages/BidderJoinPage';
import AuctionRoomPage from './pages/AuctionRoomPage';
import MultiItemAuctionCreatePage from './pages/MultiItemAuctionCreatePage';
import MultiItemAuctionHostPage from './pages/MultiItemAuctionHostPage';
import MultiItemBidderJoinPage from './pages/MultiItemBidderJoinPage';
import MultiItemAuctionBidderPage from './pages/MultiItemAuctionBidderPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/home" element={<HomePage />} />
          
          {/* Single Item Auction Routes */}
          <Route path="/host/create" element={<HostCreateAuctionPage />} />
          <Route path="/host/auction/:auctionId" element={<HostAuctionPage />} />
          <Route path="/bid/join" element={<BidderJoinPage />} />
          <Route path="/auction/:auctionId" element={<AuctionRoomPage />} />
          
          {/* Multi Item Auction Routes */}
          <Route path="/host/multi-create" element={<MultiItemAuctionCreatePage />} />
          <Route path="/host/multi-auction/:auctionId" element={<MultiItemAuctionHostPage />} />
          <Route path="/bid/multi-join" element={<MultiItemBidderJoinPage />} />
          <Route path="/multi-auction/:auctionId" element={<MultiItemAuctionBidderPage />} />
          
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
