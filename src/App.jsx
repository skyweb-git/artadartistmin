import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './contexts/AuthContext';
import Dashboard from './components/Dashboard';
import Artists from './components/Artists';
import UserManagement from './components/Users';
import Products from './components/Products';
import Events from './components/Events';
import SystemSettings from './components/Settings';
import Gallery from './components/Gallery';
import Announcements from './components/Announcements';
import Forms from './components/Forms';
import EventSubscribers from './components/EventSubscribers';
import Layout from './components/Layout';
import Login from './components/Login';
import ArtDistrict from './components/ArtDistrict';
import FormPublicRedirect from './components/FormPublicRedirect';
import Payments from './components/Payments';
import SeatingArrangement from './components/SeatingArrangement';
import Coupons from './components/Coupons';
import Ecommerce from './components/Ecommerce';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Public login route */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
        />

        {/* Public form links must open on the marketplace site, not admin */}
        <Route path="/forms/:formId" element={<FormPublicRedirect />} />
        
        {/* Protected admin routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="artists" element={<Artists />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="products" element={<Products />} />
          <Route path="events" element={<Events />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="forms" element={<Forms />} />
          <Route path="subscribers" element={<EventSubscribers />} />
          <Route path="art-district" element={<ArtDistrict />} />
          <Route path="payments" element={<Payments />} />
          <Route path="ecommerce" element={<Ecommerce />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="seating" element={<SeatingArrangement />} />
          <Route path="settings" element={<SystemSettings />} />
        </Route>
      </Routes>
      <Toaster position="top-right" />
    </Router>
  );
}

export default App;
