const footballApi = require("./footballApi.service");
const { DEFAULT_COMPETITIONS } = require("../utils/constants");
const {
  MOCK_LIVE_MATCHES,
  MOCK_UPCOMING_MATCHES,
  MOCK_STANDINGS,
  MOCK_SCORERS,
  MOCK_MATCH_DETAILS,
} = require("./mockData");

const formatMatchDate = (utcDateStr) => {
  if (!utcDateStr) return "";
  const matchDate = new Date(utcDateStr);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const timeStr = matchDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  if (matchDate.toDateString() === today.toDateString()) {
    return `Today, ${timeStr}`;
  } else if (matchDate.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow, ${timeStr}`;
  } else {
    const options = { month: "short", day: "numeric" };
    return `${matchDate.toLocaleDateString([], options)}, ${timeStr}`;
  }
};

const mapMatch = (match) => {
  const status = match.status;
  const isLive = ["LIVE", "IN_PLAY", "PAUSED"].includes(status);
  const isFinished = ["FINISHED"].includes(status);
  const isUpcoming = ["SCHEDULED", "TIMED", "POSTPONED"].includes(status);

  let mappedStatus = "SCHEDULED";
  if (isLive) mappedStatus = "LIVE";
  else if (isFinished) mappedStatus = "FINISHED";

  const minute = isLive ? 74 : null;

  const homeScore = match.score?.fullTime?.home ?? (isUpcoming ? null : 0);
  const awayScore = match.score?.fullTime?.away ?? (isUpcoming ? null : 0);

  let homeXG = null;
  let awayXG = null;
  if (!isUpcoming) {
    homeXG = parseFloat(
      (homeScore * 0.8 + 0.4 + (match.id % 5) * 0.1).toFixed(2),
    );
    awayXG = parseFloat(
      (awayScore * 0.8 + 0.3 + (match.id % 3) * 0.1).toFixed(2),
    );
  }

  let prediction = null;
  if (isUpcoming) {
    const hWeight = ((match.homeTeam?.name?.charCodeAt(0) || 0) % 50) + 20;
    const aWeight = ((match.awayTeam?.name?.charCodeAt(0) || 0) % 40) + 20;
    const draw = 100 - hWeight - aWeight;
    prediction = {
      homeWin: hWeight,
      draw: draw > 0 ? draw : 20,
      awayWin: aWeight,
    };
  }

  return {
    id: match.id.toString(),
    leagueId: match.competition?.code || "PL",
    leagueName: match.competition?.name || "Premier League",
    leagueLogo: match.competition?.emblem || "",
    status: mappedStatus,
    minute,
    homeTeam: {
      id: match.homeTeam.id.toString(),
      name: match.homeTeam.shortName || match.homeTeam.name,
      logo: match.homeTeam.crest,
      score: homeScore,
      xG: homeXG,
    },
    awayTeam: {
      id: match.awayTeam.id.toString(),
      name: match.awayTeam.shortName || match.awayTeam.name,
      logo: match.awayTeam.crest,
      score: awayScore,
      xG: awayXG,
    },
    date: formatMatchDate(match.utcDate),
    timestamp: match.utcDate,
    prediction,
  };
};

// --- Mock Data Fallbacks for API Rate-Limits/Errors ---

// Mock data is imported from ./mockData.js

// --- Service Functions ---

const getLiveMatches = async () => {
  try {
    const matchesRes = await footballApi.get("/matches?limit=10&status=LIVE");
    const rawMatches = matchesRes.data?.matches || [];
    return rawMatches.map(mapMatch);
  } catch (err) {
    console.error(
      "⚠️ [football.service] getLiveMatches API failed, falling back to mock:",
      err.message,
    );
    return MOCK_LIVE_MATCHES;
  }
};

const getStanding = async (leagueCode = "PL", season, limit = 10) => {
  try {
    const params = {};
    if (season) params.season = season;
    if (limit) params.limit = limit;

    const standingsRes = await footballApi.get(
      `/competitions/${leagueCode}/standings`,
      { params },
    );
    console.log("standingsRes", season, params);
    const rawTable = standingsRes.data?.standings?.[0]?.table || [];
    return rawTable.map((item) => ({
      id: item.team.id.toString(),
      leagueId: standingsRes?.data?.competition?.code || leagueCode,
      name: item.team.shortName || item.team.name,
      logo: item.team.crest || "",
      played: item.playedGames,
      won: item.won,
      drawn: item.draw,
      lost: item.lost,
      gd: item.goalDifference,
      points: item.points,
    }));
  } catch (err) {
    console.error(
      `⚠️ [football.service] getStanding API failed for ${leagueCode} (season: ${season}), falling back to mock:`,
      err.message,
    );
    return MOCK_STANDINGS;
  }
};

const upcomingMatches = async (
  dateFrom,
  dateTo,
  competitions,
  limit = 10,
  offset = 0,
  status,
  leagueId,
) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const defaultPastDate = new Date(today);
    defaultPastDate.setDate(defaultPastDate.getDate() - 7);

    const params = {
      dateFrom: dateFrom || "2026-08-20",
      dateTo: dateTo || "2026-08-29",
    };

    const compFilter =
      leagueId || competitions || DEFAULT_COMPETITIONS.join(",");
    if (compFilter && compFilter !== "all") {
      params.competitions = compFilter;
    }

    if (status && status !== "all") {
      params.status = status;
    }

    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;
    params.limit = 100;

    console.log("Calling footballApi.get('/matches') with params:", params);
    const matchesRes = await footballApi.get("/matches", { params });
    const rawMatches = matchesRes.data?.matches || [];

    const mapped = rawMatches.map(mapMatch);
    return mapped;
  } catch (err) {
    console.error(
      "⚠️ [football.service] upcomingMatches API failed, falling back to mock:",
      err.message,
    );
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;
    return MOCK_UPCOMING_MATCHES.slice(
      parsedOffset,
      parsedOffset + parsedLimit,
    );
  }
};

const playerLeaderboard = async (
  competition = "PL",
  season = 2025,
  limit = 10,
) => {
  try {
    const params = {
      season,
      limit,
    };
    const playerRes = await footballApi.get(
      `/competitions/${competition}/scorers`,
      {
        params,
      },
    );
    const rawScorers = playerRes.data?.scorers || [];
    return rawScorers.map((item) => ({
      id: item.player.id.toString(),
      name: item.player.name,
      flag: item.team.crest,
      teamName: item.team.shortName || item.team.name,
      position: item.player.position || "Forward",
      stats: {
        goals: item.goals,
      },
    }));
  } catch (err) {
    console.error(
      "⚠️ [football.service] playerLeaderboard API failed, falling back to mock:",
      err.message,
    );
    return MOCK_SCORERS;
  }
};

const getDashboardData = async (query = {}) => {
  const { dateFrom, dateTo, league, season, competitions, limit, offset } =
    query;
  const [matchesRes, standingsRes, upcomingRes, playerRes] = await Promise.all([
    getLiveMatches(),
    getStanding(league || "PL", season),
    upcomingMatches(dateFrom, dateTo, competitions, limit, offset),
    playerLeaderboard(league || "PL", season),
  ]);
  return {
    matches: matchesRes,
    standings: standingsRes,
    upcomingMatches: upcomingRes,
    playerLeaderboard: playerRes,
  };
};

const getLeagueDetails = async (leagueCode) => {
  try {
    const response = await footballApi.get(`/competitions/${leagueCode}/teams`);
    const competition = response.data?.competition || {};
    const teams = response.data?.teams || [];

    return {
      code: competition.code,
      name: competition.name,
      logo: competition.emblem || "",
      country: competition.area?.name || "",
      countryFlag: competition.area?.flag || "",
      teams: teams.map((t) => ({
        id: t.id.toString(),
        name: t.name,
        shortName: t.shortName || t.name,
        logo: t.crest || "",
        founded: t.founded || null,
        venue: t.venue || "",
        website: t.website || "",
      })),
    };
  } catch (err) {
    console.error(
      `⚠️ [football.service] getLeagueDetails API failed for ${leagueCode}, falling back to mock:`,
      err.message,
    );
    return null;
  }
};

const getMatchDetails = async (matchId) => {
  try {
    const response = await footballApi.get(`/matches/${matchId}`);
    console.log("response", response.data);
    const matchData = response?.data;
    if (!matchData) return null;

    const mapped = mapMatch(matchData);

    // Add additional properties that are specific to the detail view
    mapped.venue = matchData.venue || "";
    mapped.referee = matchData.referees?.[0]?.name || "";

    return mapped;
  } catch (error) {
    console.error("Error fetching match details:", error);
    // Return the corresponding mock match if it exists, otherwise default to m1 live match
    return MOCK_MATCH_DETAILS[matchId] || MOCK_MATCH_DETAILS["m1"];
  }
};

const getCompetation = async () => {
  try {
    const competitionCodes = ["PL", "BL1", "SA", "DED", "FL1", "PD"];

    const response = await footballApi.get("/competitions");

    const competitions = response.data?.competitions || [];
    console.log("competitions", competitions);

    return competitions
      .filter((c) => competitionCodes.includes(c.code))
      .map((c) => ({
        id: String(c.id),
        name: c.name,
        code: c.code,
        area: c.area?.name,
        areaFlag: c.area?.flag,
        emblem: c.emblem,
      }));
  } catch (error) {
    console.error("Error fetching competitions:", error);
    return [];
  }
};

module.exports = {
  getLiveMatches,
  getStanding,
  upcomingMatches,
  playerLeaderboard,
  getDashboardData,
  getLeagueDetails,
  getMatchDetails,
  getCompetation,
};
