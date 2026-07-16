import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Pages
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import Dashboard from '../pages/Dashboard';
import LiveMatches from '../pages/LiveMatches';
import Fixtures from '../pages/Fixtures';
import MatchDetails from '../pages/MatchDetails';
import Leagues from '../pages/Leagues';
import LeagueDetails from '../pages/LeagueDetails';
import Teams from '../pages/Teams';
import TeamDetails from '../pages/TeamDetails';
import Players from '../pages/Players';
import PlayerProfile from '../pages/PlayerProfile';
import News from '../pages/News';
import Transfers from '../pages/Transfers';
import Favorites from '../pages/Favorites';
import Notifications from '../pages/Notifications';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';
import AIChat from '../pages/AIChat';
import NotFound from '../pages/NotFound';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Dashboard Routes */}
      <Route element={<DashboardLayout />}>
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
