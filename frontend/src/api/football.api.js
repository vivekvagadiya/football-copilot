import axiosInstance from "./axios";

export const getLiveMatchesApi = async () => {
  try {
    const response = await axiosInstance.get("/football/matches/live");
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
