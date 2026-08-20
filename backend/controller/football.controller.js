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
    const { dateFrom, dateTo, competitions, limit, offset, status, leagueId, days } =
      req.query;
    const data = await footballService.upcomingMatches(
      dateFrom,
      dateTo,
      competitions,
      limit,
      offset,
      status,
      leagueId,
      days,
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

const getMatchSummaryController = async (req, res) => {
  try {
    const matchId = req.params.id;
    if (!matchId) {
      return apiResponse.error(res, "Match ID is required", 400);
    }
    const data = await footballService.getMatchSummary(matchId);
    return apiResponse.success(
      res,
      "Match AI summary fetched successfully",
      data,
    );
  } catch (error) {
    return apiResponse.error(res, error.message);
  }
};

const getCompetationController = async (req, res) => {
  try {
    const data = await footballService.getCompetation();
    return apiResponse.success(res, "Competitions fetched successfully", data);
  } catch (error) {
    return apiResponse.error(res, error.message);
  }
};

const getTeamsByCompetationController = async (req, res) => {
  try {
    const { leagueId } = req.params;
    if (!leagueId) {
      return apiResponse.error(res, "League ID is required", 400);
    }
    const data = await footballService.getTeamsByCompetation(leagueId);
    return apiResponse.success(res, "Teams fetched successfully", data);
  } catch (error) {
    return apiResponse.error(res, error.message);
  }
};

const getPlayerDetailsController = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return apiResponse.error(res, "Player ID is required", 400);
    }
    const data = await footballService.getPlayerDetails(id);
    return apiResponse.success(
      res,
      "Player details fetched successfully",
      data,
    );
  } catch (error) {
    return apiResponse.error(res, error.message);
  }
};

const getTeamDetailsController = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return apiResponse.error(res, "Team ID is required", 400);
    }
    const data = await footballService.getTeamDetails(id);
    return apiResponse.success(res, "Team details fetched successfully", data);
  } catch (error) {
    return apiResponse.error(res, error.message);
  }
};

const searchPlayersController = async (req, res) => {
  try {
    const { search } = req.query;
    if (!search) {
      return apiResponse.error(res, "Search query is required", 400);
    }
    const data = await footballService.searchPlayers(search);
    return apiResponse.success(res, "Players searched successfully", data);
  } catch (error) {
    return apiResponse.error(res, error.message);
  }
};

const getTopTransfersController = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const data = await footballService.getTopTransfers(page);
    return apiResponse.success(res, "Top transfers fetched successfully", data);
  } catch (error) {
    return apiResponse.error(res, error.message);
  }
};

const getMarketValueTransfersController = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const data = await footballService.getMarketValueTransfers(page);
    return apiResponse.success(res, "Market value transfers fetched successfully", data);
  } catch (error) {
    return apiResponse.error(res, error.message);
  }
};

const getNewsController = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const data = await footballService.getNews(page);
    return apiResponse.success(res, "News fetched successfully", data);
  } catch (error) {
    return apiResponse.error(res, error.message);
  }
};

const getNewsSummaryController = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await footballService.getNewsSummary(id);
    return apiResponse.success(res, "AI News summary fetched successfully", data);
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
  getCompetationController,
  getTeamsByCompetationController,
  getPlayerDetailsController,
  getTeamDetailsController,
  getMatchSummaryController,
  searchPlayersController,
  getTopTransfersController,
  getMarketValueTransfersController,
  getNewsController,
  getNewsSummaryController,
};
