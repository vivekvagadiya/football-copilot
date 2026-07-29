const footballService = require("../services/football.service");
const apiResponse = require("../utils/apiResponse");

const getLiveMatchesController = async (req, res) => {
  try {
    const data = await footballService.getLiveMatches();
    return apiResponse.success(res, "Live matches fetched successfully", data);
  } catch (error) {
    return apiResponse.error(res, error.message);
  }
};

const getStandingController = async (req, res) => {
  try {
    const { league, season, limit } = req.query;
    const data = await footballService.getStanding(league, season, limit);
    return apiResponse.success(res, "Standings fetched successfully", data);
  } catch (error) {
    return apiResponse.error(res, error.message);
  }
};

const getUpcomingMatchesController = async (req, res) => {
  try {
    const { dateFrom, dateTo, competitions, limit, offset, status, leagueId } =
      req.query;
    const data = await footballService.upcomingMatches(
      dateFrom,
      dateTo,
      competitions,
      limit,
      offset,
      status,
      leagueId,
    );
    return apiResponse.success(
      res,
      "Upcoming matches fetched successfully",
      data,
    );
  } catch (error) {
    return apiResponse.error(res, error.message);
  }
};

const getPlayerLeaderboardController = async (req, res) => {
  try {
    const { league, season, limit } = req.query;
    const data = await footballService.playerLeaderboard(league, season, limit);
    return apiResponse.success(
      res,
      "Player leaderboard fetched successfully",
      data,
    );
  } catch (error) {
    return apiResponse.error(res, error.message);
  }
};

const getDashboardDataController = async (req, res) => {
  try {
    const data = await footballService.getDashboardData(req.query);
    return apiResponse.success(
      res,
      "Dashboard data fetched successfully",
      data,
    );
  } catch (error) {
    return apiResponse.error(res, error.message);
  }
};

const getLeagueDetailsController = async (req, res) => {
  try {
    const { code } = req.params;
    if (!code) {
      return apiResponse.error(res, "League code is required", 400);
    }
    const data = await footballService.getLeagueDetails(code);
    return apiResponse.success(
      res,
      "League details fetched successfully",
      data,
    );
  } catch (error) {
    return apiResponse.error(res, error.message);
  }
};

const getMatchDetailsController = async (req, res) => {
  try {
    const matchId = req.params.id;
    if (!matchId) {
      return apiResponse.error(res, "Match ID is required", 400);
    }
    const data = await footballService.getMatchDetails(matchId);
    return apiResponse.success(res, "Match details fetched successfully", data);
  } catch (error) {
    return apiResponse.error(res, error.message);
  }
};

module.exports = {
  getLiveMatchesController,
  getStandingController,
  getUpcomingMatchesController,
  getPlayerLeaderboardController,
  getDashboardDataController,
  getLeagueDetailsController,
  getMatchDetailsController,
};
