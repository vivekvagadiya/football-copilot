import React from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { Shield, Sun, Moon, Cpu } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';

export const PublicLayout = () => {
  const { theme, toggleTheme } = useApp();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-text transition-colors duration-200 flex flex-col hero-gradient">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Cpu className="text-primary" size={24} />
            <span className="font-display font-black text-lg tracking-wider bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              FOOTBALL COPILOT
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6 text-sm">
            <Link to="/" className="text-muted hover:text-text transition-colors">Features</Link>
            <a href="#about" className="text-muted hover:text-text transition-colors">OS Architecture</a>
            <a href="#stats" className="text-muted hover:text-text transition-colors">Tactical Engine</a>
          </nav>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-border/45 hover:bg-border/20 text-muted hover:text-text transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/login')}
              className="text-xs"
            >
              Sign In
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={() => navigate('/dashboard')}
              className="text-xs"
            >
              Launch OS
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer id="about" className="border-t border-border/40 bg-card py-8 text-center text-xs text-muted">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Cpu className="text-primary" size={16} />
            <span className="font-display font-semibold tracking-wider text-text">Football Copilot Operating System</span>
          </div>
          <p>© 2026 Football Copilot. Powered by advanced tactical analytical models.</p>
          <div className="flex space-x-4">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default PublicLayout;
