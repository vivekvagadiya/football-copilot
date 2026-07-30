import React, { createContext, useContext, useState, useEffect } from "react";
import { NOTIFICATIONS as INITIAL_NOTIFICATIONS } from "../constants/mockData";

const AppContext = createContext(undefined);

export const AppProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    // Default to dark theme per spec
    return "dark";
  });

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    if (saved) return JSON.parse(saved);
    // Setup standard mock user profile
    return {
      username: "Gaffer_AI",
      email: "gaffer@copilot.ai",
      favoriteTeamId: "arsenal",
      favoriteLeagueId: "pl",
      notificationsEnabled: true,
      language: "English",
      securityLevel: "High",
    };
  });

  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem("favorites");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          teams: parsed.teams || [],
          players: parsed.players || [],
          matches: parsed.matches || [],
          leagues: parsed.leagues || [],
        };
      } catch (e) {
        // Fallback on parse error
      }
    }
    return {
      teams: [],
      players: [],
      matches: [],
      leagues: [],
    };
  });

  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [colorTheme, setColorTheme] = useState(() => {
    return localStorage.getItem("colorTheme") || "green";
  });

  // Apply theme and color accent to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
    root.setAttribute("data-color-theme", colorTheme);
    localStorage.setItem("theme", theme);
    localStorage.setItem("colorTheme", colorTheme);
  }, [theme, colorTheme]);

  const changeColorTheme = (themeName) => {
    setColorTheme(themeName);
  };

  // Sync favorites with Backend API on mount
  useEffect(() => {
    const fetchFavoriteIds = async () => {
      const { tokenService } = await import("../api/tokenService");
      const token = tokenService.getAccessToken();
      if (!token) return;

      try {
        const { getFavoriteIdsApi } = await import("../api/favorite.api");
        const res = await getFavoriteIdsApi();
        if (res.success && res.data) {
          setFavorites({
            teams: (res.data.TEAM || []).map(String),
            players: (res.data.PLAYER || []).map(String),
            matches: (res.data.MATCH || []).map(String),
            leagues: (res.data.LEAGUE || []).map(String),
          });
        }
      } catch (err) {
        console.warn("Could not sync favorite IDs with backend:", err.message);
      }
    };

    fetchFavoriteIds();
  }, [user]);

  // Sync favorites to local storage
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  // Sync user profile
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  const updateProfile = (updatedFields) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : null));
  };

  const normalizeFavoriteKey = (type) => {
    const key = String(type).toLowerCase();
    if (key === "team" || key === "teams") return "teams";
    if (key === "player" || key === "players") return "players";
    if (key === "match" || key === "matches") return "matches";
    if (key === "league" || key === "leagues") return "leagues";
    return key;
  };

  const toggleFavorite = (type, id) => {
    const key = normalizeFavoriteKey(type);
    setFavorites((prev) => {
      const list = prev[key] || [];
      const idStr = String(id);
      const exists = list.some((item) => String(item) === idStr);
      const updated = exists
        ? list.filter((item) => String(item) !== idStr)
        : [...list, idStr];
      return { ...prev, [key]: updated };
    });
  };

  const isFavorite = (type, id) => {
    const key = normalizeFavoriteKey(type);
    const list = favorites[key] || [];
    return list.some((item) => String(item) === String(id));
  };

  const markNotificationAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const addNotification = (n) => {
    setNotifications((prev) => [
      { id: `nt-${Date.now()}`, read: false, time: "Just now", ...n },
      ...prev,
    ]);
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        colorTheme,
        changeColorTheme,
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
        setIsSearchOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
