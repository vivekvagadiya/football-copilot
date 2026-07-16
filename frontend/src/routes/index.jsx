import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { tokenService } from '../api/tokenService';
import { useApp } from '../context/AppContext';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Pages
import LandingPage from '../pages/core/LandingPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import Dashboard from '../pages/core/Dashboard';
import LiveMatches from '../pages/football/LiveMatches';
import Fixtures from '../pages/football/Fixtures';
import MatchDetails from '../pages/football/MatchDetails';
import Leagues from '../pages/football/Leagues';
import LeagueDetails from '../pages/football/LeagueDetails';
import Teams from '../pages/football/Teams';
import TeamDetails from '../pages/football/TeamDetails';
import Players from '../pages/football/Players';
import PlayerProfile from '../pages/football/PlayerProfile';
import News from '../pages/football/News';
import Transfers from '../pages/football/Transfers';
import Favorites from '../pages/football/Favorites';
import Notifications from '../pages/core/Notifications';
import Profile from '../pages/core/Profile';
import Settings from '../pages/core/Settings';
import AIChat from '../pages/ai/AIChat';
import NotFound from '../pages/core/NotFound';

// Route Guards
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = !!tokenService.getAccessToken();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const GuestRoute = ({ children }) => {
  const isAuthenticated = !!tokenService.getAccessToken();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        } />
        <Route path="/register" element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        } />
      </Route>

      {/* Dashboard Routes */}
      <Route element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/live" element={<LiveMatches />} />
        <Route path="/fixtures" element={<Fixtures />} />
        <Route path="/match/:id" element={<MatchDetails />} />
        <Route path="/leagues" element={<Leagues />} />
        <Route path="/league/:id" element={<LeagueDetails />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/team/:id" element={<TeamDetails />} />
        <Route path="/players" element={<Players />} />
        <Route path="/player/:id" element={<PlayerProfile />} />
        <Route path="/news" element={<News />} />
        <Route path="/transfers" element={<Transfers />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/ai" element={<AIChat />} />
      </Route>

      {/* Fallbacks */}
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};
export default AppRoutes;
