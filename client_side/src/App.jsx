import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Auth Pages
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';

// Public Pages
import Home from './pages/Home';
import MenuBrowse from './pages/MenuBrowse';
import ChefsList from './pages/ChefsList';
import ChefDetail from './pages/ChefDetail';

// Customer Pages
import CustomerDashboard from './components/customer/Dashboard';
import CustomerProfile from './components/customer/Profile';
import BookingFlow from './components/customer/BookingFlow';
import BookingHistory from './components/customer/BookingHistory';
import BookingDetail from './components/customer/BookingDetail';
import TrackChef from './components/customer/TrackChef';
import PaymentPage from './components/customer/PaymentPage';
import FavoriteChefs from './components/customer/FavoriteChefs';
import Loyalty from './components/customer/Loyalty';
import Messages from './components/Messages';

// Chef Pages
import ChefDashboard from './components/chef/Dashboard';
import ChefProfile from './components/chef/Profile';
import Portfolio from './components/chef/Portfolio';
import Availability from './components/chef/Availability';
import ChefBookings from './components/chef/Bookings';
import Earnings from './components/chef/Earnings';

// Admin Pages
import AdminDashboard from './components/admin/Dashboard';
import UserManagement from './components/admin/UserManagement';
import ChefVerification from './components/admin/ChefVerification';
import BookingManagement from './components/admin/BookingManagement';
import Revenue from './components/admin/Revenue';
import Disputes from './components/admin/Disputes';
import CommissionSettings from './components/admin/CommissionSettings';

import Loading from './components/common/Loading';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/auth/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/menu" element={<MenuBrowse />} />
      <Route path="/chefs" element={<ChefsList />} />
      <Route path="/chefs/:id" element={<ChefDetail />} />

      {/* Auth */}
      <Route path="/auth/login"          element={<Login />} />
      <Route path="/auth/register"       element={<Register />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/reset-password"  element={<ResetPassword />} />

      {/* Customer */}
      <Route path="/customer" element={<ProtectedRoute allowedRoles={['customer']}><CustomerDashboard /></ProtectedRoute>} />
      <Route path="/customer/profile"      element={<ProtectedRoute allowedRoles={['customer']}><CustomerProfile /></ProtectedRoute>} />
      <Route path="/customer/book"         element={<ProtectedRoute allowedRoles={['customer']}><BookingFlow /></ProtectedRoute>} />
      <Route path="/customer/bookings"     element={<ProtectedRoute allowedRoles={['customer']}><BookingHistory /></ProtectedRoute>} />
      <Route path="/customer/bookings/:id" element={<ProtectedRoute allowedRoles={['customer']}><BookingDetail /></ProtectedRoute>} />
      <Route path="/customer/track/:id"    element={<ProtectedRoute allowedRoles={['customer']}><TrackChef /></ProtectedRoute>} />
      <Route path="/customer/payment/:id"  element={<ProtectedRoute allowedRoles={['customer']}><PaymentPage /></ProtectedRoute>} />
      <Route path="/customer/favorites"    element={<ProtectedRoute allowedRoles={['customer']}><FavoriteChefs /></ProtectedRoute>} />
      <Route path="/customer/loyalty"      element={<ProtectedRoute allowedRoles={['customer']}><Loyalty /></ProtectedRoute>} />
      <Route path="/messages"              element={<ProtectedRoute allowedRoles={['customer','chef']}><Messages /></ProtectedRoute>} />

      {/* Chef */}
      <Route path="/chef"                element={<ProtectedRoute allowedRoles={['chef']}><ChefDashboard /></ProtectedRoute>} />
      <Route path="/chef/profile"        element={<ProtectedRoute allowedRoles={['chef']}><ChefProfile /></ProtectedRoute>} />
      <Route path="/chef/portfolio"      element={<ProtectedRoute allowedRoles={['chef']}><Portfolio /></ProtectedRoute>} />
      <Route path="/chef/availability"   element={<ProtectedRoute allowedRoles={['chef']}><Availability /></ProtectedRoute>} />
      <Route path="/chef/bookings"       element={<ProtectedRoute allowedRoles={['chef']}><ChefBookings /></ProtectedRoute>} />
      <Route path="/chef/earnings"       element={<ProtectedRoute allowedRoles={['chef']}><Earnings /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin"                    element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users"              element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
      <Route path="/admin/chef-verification"  element={<ProtectedRoute allowedRoles={['admin']}><ChefVerification /></ProtectedRoute>} />
      <Route path="/admin/bookings"           element={<ProtectedRoute allowedRoles={['admin']}><BookingManagement /></ProtectedRoute>} />
      <Route path="/admin/revenue"            element={<ProtectedRoute allowedRoles={['admin']}><Revenue /></ProtectedRoute>} />
      <Route path="/admin/disputes"           element={<ProtectedRoute allowedRoles={['admin']}><Disputes /></ProtectedRoute>} />
      <Route path="/admin/commission"         element={<ProtectedRoute allowedRoles={['admin']}><CommissionSettings /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
