import axiosInstance from "./axios";

export const getLiveMatchesApi = async (params) => {
  try {
    const response = await axiosInstance.get("/football/matches/live", {
      params,
    });
    return response?.data?.data || [];
  } catch (error) {
    throw error?.errors?.[0] || error;
  }
};

export const getUpcomingMatchesApi = async (params) => {
  try {
    const response = await axiosInstance.get("/football/matches/upcoming", {
      params,
    });
    return response?.data?.data || [];
  } catch (error) {
    throw error?.errors?.[0] || error;
  }
};

export const getStandingsApi = async (league, season) => {
  try {
    const params = { league };
    if (season) params.season = season;
    const response = await axiosInstance.get("/football/standings", { params });
    return response?.data?.data || [];
  } catch (error) {
    throw error?.errors?.[0] || error;
  }
};

export const getPlayerLeaderboardApi = async (league, season) => {
  try {
    const params = {};
    if (league) params.league = league;
    if (season) params.season = season;
    const response = await axiosInstance.get("/football/scorers", { params });
    return response?.data?.data || [];
  } catch (error) {
    throw error?.errors?.[0] || error;
  }
};

export const getDashboardData = async () => {
  try {
    const response = await axiosInstance.get("/football/dashboard");
    return response?.data?.data || response?.data;
  } catch (error) {
    throw error?.errors?.[0] || error;
  }
};

export const getLeagueDetailsApi = async (code) => {
  try {
    const response = await axiosInstance.get(`/football/leagues/${code}`);
    return response?.data?.data || null;
  } catch (error) {
    throw error?.errors?.[0] || error;
  }
};

export const getMatchDetailsApi = async (matchId) => {
  try {
    const response = await axiosInstance.get(`/football/matches/${matchId}`);
    return response?.data?.data || null;
  } catch (error) {
    throw error?.errors?.[0] || error;
  }
};

export const getCompetationApi = async () => {
  try {
    const response = await axiosInstance.get(`/football/competitions`);
    return response?.data?.data || null;
  } catch (error) {
    throw error?.errors?.[0] || error;
  }
};

export const getTeamsApi = async (leagueCode) => {
  try {
    const response = await axiosInstance.get(
      `/football/competitions/${leagueCode}/teams`,
    );
    return response?.data?.data || [];
  } catch (error) {
    throw error?.errors?.[0] || error;
  }
};

export const getPlayerDetailsApi = async (playerId) => {
  try {
    const response = await axiosInstance.get(`/football/players/${playerId}`);
    return response?.data?.data || null;
  } catch (error) {
    throw error?.errors?.[0] || error;
  }
};

export const getTeamDetailsApi = async (teamId) => {
  try {
    const response = await axiosInstance.get(`/football/teams/${teamId}`);
    return response?.data?.data || null;
  } catch (error) {
    throw error?.errors?.[0] || error;
  }
};

export const getMatchAiSummaryApi = async (matchId) => {
  try {
    const response = await axiosInstance.get(`/football/matches/${matchId}/ai-summary`);
    return response?.data?.data || null;
  } catch (error) {
    throw error?.errors?.[0] || error;
  }
};

export const getTopTransfersApi = async (page = 1) => {
  try {
    const response = await axiosInstance.get("/football/transfers/top", {
      params: { page },
    });
    return response?.data?.data || [];
  } catch (error) {
    throw error?.errors?.[0] || error;
  }
};

export const getMarketValueTransfersApi = async (page = 1) => {
  try {
    const response = await axiosInstance.get("/football/transfers/market-value", {
      params: { page },
    });
    return response?.data?.data || [];
  } catch (error) {
    throw error?.errors?.[0] || error;
  }
};

export const getNewsApi = async (page = 1) => {
  try {
    const response = await axiosInstance.get("/football/news", {
      params: { page },
    });
    return response?.data?.data || [];
  } catch (error) {
    throw error?.errors?.[0] || error;
  }
};

export const getNewsSummaryApi = async (newsId) => {
  try {
    const response = await axiosInstance.get(`/football/news/${newsId}/ai-summary`);
    return response?.data?.data || null;
  } catch (error) {
    throw error?.errors?.[0] || error;
  }
};
