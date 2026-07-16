import React, { createContext, useContext, useState, useEffect } from 'react';
import { NOTIFICATIONS as INITIAL_NOTIFICATIONS } from '../constants/mockData';

const AppContext = createContext(undefined);

export const AppProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    // Default to dark theme per spec
    return 'dark';
  });

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    if (saved) return JSON.parse(saved);
    // Setup standard mock user profile
    return {
      username: 'Gaffer_AI',
      email: 'gaffer@copilot.ai',
      favoriteTeamId: 'arsenal',
      favoriteLeagueId: 'pl',
      notificationsEnabled: true,
      language: 'English',
      securityLevel: 'High'
    };
  });

  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favorites');
    if (saved) return JSON.parse(saved);
    return {
      teams: ['arsenal', 'realmadrid'],
      players: ['saka', 'yamal'],
      leagues: ['pl', 'laliga']
    };
  });

  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Sync favorites
  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Sync user profile
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  const updateProfile = (updatedFields) => {
    setUser(prev => prev ? { ...prev, ...updatedFields } : null);
  };

  const toggleFavorite = (type, id) => {
    setFavorites(prev => {
      const list = prev[type] || [];
      const updated = list.includes(id)
        ? list.filter(item => item !== id)
        : [...list, id];
      return { ...prev, [type]: updated };
    });
  };

  const isFavorite = (type, id) => {
    return (favorites[type] || []).includes(id);
  };

  const markNotificationAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const addNotification = (n) => {
    setNotifications(prev => [
      { id: `nt-${Date.now()}`, read: false, time: 'Just now', ...n },
      ...prev
    ]);
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        user,
        login,
        logout,
        updateProfile,
        favorites,
        toggleFavorite,
        isFavorite,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        addNotification,
        isSearchOpen,
        setIsSearchOpen
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
