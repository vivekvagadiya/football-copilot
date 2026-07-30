import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Zap, Calendar, Award, Shield, User2, 
  Newspaper, ArrowRightLeft, Star, Bell, Settings, Cpu,
  Menu, ChevronLeft, ChevronRight, Search as SearchIcon, 
  Sun, Moon, LogOut, Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { SearchModal } from '../components/ui/Search';
import { Drawer } from '../components/ui/Drawer';
import { toast } from 'sonner';
import { logoutApi } from '../api/auth.api';

export const DashboardLayout = () => {
  const { theme, toggleTheme, user, logout, notifications, isSearchOpen, setIsSearchOpen } = useApp();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Live Engine', path: '/live', icon: Zap, badge: 'LIVE' },
    { name: 'Fixtures', path: '/fixtures', icon: Calendar },
    { name: 'AI Copilot', path: '/ai', icon: Cpu, accent: true },
    { name: 'Leagues', path: '/leagues', icon: Award },
    { name: 'Teams', path: '/teams', icon: Shield },
    { name: 'Players', path: '/players', icon: User2 },
    { name: 'News Feed', path: '/news', icon: Newspaper },
    { name: 'Transfers', path: '/transfers', icon: ArrowRightLeft },
    { name: 'Favorites', path: '/favorites', icon: Star },
    { name: 'Notifications', path: '/notifications', icon: Bell, alertCount: notifications.filter(n => !n.read).length }
  ];

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (err) {
      console.error("Logout API error:", err);
    } finally {
      logout();
      toast.success('Logged out successfully');
      navigate('/');
    }
  };

  const currentActiveItem = menuItems.find(item => location.pathname.startsWith(item.path)) || { name: 'Football Copilot' };

  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-text transition-colors duration-200 flex flex-col md:flex-row">
      {/* Search Command Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Desktop Sidebar (Left) */}
      <aside 
        className={`hidden md:flex flex-col h-screen border-r border-border bg-card shrink-0 sidebar-transition z-30 ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border/70 shrink-0">
          <Link to="/dashboard" className="flex items-center gap-2 overflow-hidden">
            <Cpu className="text-primary shrink-0" size={24} />
            {!isSidebarCollapsed && (
              <span className="font-display font-black text-sm tracking-wider text-text truncate">
                COPILOT OS
              </span>
            )}
          </Link>
          
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded-lg border border-border/50 hover:bg-border/20 text-muted hover:text-text cursor-pointer"
          >
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Sidebar Navigation items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto min-h-0">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center p-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  isActive 
                    ? item.accent 
                      ? 'bg-primary text-[#07120D]' 
                      : 'bg-border/30 text-primary border border-border/40' 
                    : item.accent 
                      ? 'text-primary border border-primary/25 bg-primary/5 hover:bg-primary/10'
                      : 'text-muted hover:text-text hover:bg-border/15'
                }`}
              >
                <Icon size={16} className={`shrink-0 ${isSidebarCollapsed ? 'mx-auto' : 'mr-3'}`} />
                {!isSidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left truncate">{item.name}</span>
                    {item.badge && (
                      <span className="bg-red-500 text-white font-extrabold text-[8px] px-1 py-0.5 rounded-sm animate-pulse shrink-0">
                        {item.badge}
                      </span>
                    )}
                    {item.alertCount > 0 && (
                      <span className="bg-primary text-[#07120D] text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0">
                        {item.alertCount}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Profile */}
        <div className="shrink-0 border-t border-border p-3 space-y-2 bg-card">
          {!isSidebarCollapsed && user && (
            <div className="flex items-center gap-3 p-1.5 rounded-lg bg-background/45 border border-border/20">
              <Avatar fallback={user.username[0]} size="sm" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-text truncate">{user.username}</p>
                <p className="text-[9px] text-muted truncate">{user.email}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <button
              onClick={() => navigate('/settings')}
              className={`w-full flex items-center p-2 rounded-lg text-xs text-muted hover:text-text hover:bg-border/15 transition-all cursor-pointer`}
            >
              <Settings size={15} className={`shrink-0 ${isSidebarCollapsed ? 'mx-auto' : 'mr-3'}`} />
              {!isSidebarCollapsed && <span className="flex-1 text-left">OS Settings</span>}
            </button>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center p-2 rounded-lg text-xs text-red-500 hover:bg-red-500/10 transition-all cursor-pointer`}
            >
              <LogOut size={15} className={`shrink-0 ${isSidebarCollapsed ? 'mx-auto' : 'mr-3'}`} />
              {!isSidebarCollapsed && <span className="flex-1 text-left">Disconnect</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Layout Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 shrink-0 border-b border-border bg-card/60 backdrop-blur-md flex items-center justify-between px-4 z-20">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg border border-border/55 text-muted hover:text-text cursor-pointer"
            >
              <Menu size={16} />
            </button>

            {/* Current Active view indicator */}
            <h1 className="font-display font-bold text-sm text-text hidden sm:block">
              {currentActiveItem.name}
            </h1>
          </div>

          {/* Quick Command search trigger bar */}
          <div className="flex items-center gap-3 flex-1 justify-end max-w-md">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full max-w-[240px] hidden sm:flex items-center justify-between px-3 py-1.5 rounded-lg border border-border/60 bg-background/50 hover:bg-border/10 text-xs text-muted transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <SearchIcon size={13} />
                <span>Search OS commands...</span>
              </span>
              <kbd className="bg-border/30 border border-border/40 px-1 rounded text-[10px]">Ctrl K</kbd>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-border/55 hover:bg-border/20 text-muted hover:text-text cursor-pointer"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Quick Profile Nav */}
            <Link to="/profile" className="flex items-center shrink-0">
              <Avatar fallback={user ? user.username[0] : 'U'} size="sm" className="hover:border-primary/50 transition-colors" />
            </Link>
          </div>
        </header>

        {/* Scrollable Main Content View */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background min-h-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile Menu Drawer */}
      <Drawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        title="Copilot OS Menu"
        position="right"
      >
        <div className="flex flex-col h-full justify-between min-h-0">
          <nav className="flex-1 overflow-y-auto space-y-1 pr-1 min-h-0">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.path);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center p-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive 
                      ? item.accent 
                        ? 'bg-primary text-[#07120D]' 
                        : 'bg-border/30 text-primary border border-border/40' 
                      : item.accent 
                        ? 'text-primary border border-primary/25 bg-primary/5'
                        : 'text-muted hover:text-text'
                  }`}
                >
                  <Icon size={16} className="mr-3" />
                  <span className="flex-1 text-left">{item.name}</span>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-[8px] px-1 py-0.5 rounded-sm animate-pulse">
                      {item.badge}
                    </span>
                  )}
                  {item.alertCount > 0 && (
                    <span className="bg-primary text-[#07120D] text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {item.alertCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="shrink-0 border-t border-border pt-3 mt-3 space-y-3 bg-card">
            {user && (
              <div className="flex items-center gap-3 p-2 rounded-lg bg-border/10">
                <Avatar fallback={user.username[0]} size="sm" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-text truncate">{user.username}</p>
                  <p className="text-[10px] text-muted truncate">{user.email}</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  navigate('/settings');
                  setIsMobileMenuOpen(false);
                }}
              >
                Settings
              </Button>
              <Button 
                variant="danger" 
                size="sm" 
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
};
export default DashboardLayout;
