const footballApi = require("./footballApi.service");
const rapidFootballApi = require("./rapidFootballApi.service");
const MatchSummary = require("../models/matchSummary.model");
const NewsSummary = require("../models/newsSummary.model");
const { DEFAULT_COMPETITIONS } = require("../utils/constants");

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
    console.log("live calling");
    return rawMatches.map(mapMatch);
  } catch (err) {
    console.error(
      "⚠️ [football.service] getLiveMatches API failed, falling back to mock:",
      err.message,
    );
    return [];
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
    return [];
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
    const dateToObj = new Date(today);
    dateToObj.setDate(today.getDate() + 10);

    const formatDate = (date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    const params = {
      dateFrom: dateFrom || "2026-08-18" || formatDate(today),
      dateTo: dateTo || "2026-08-28" || formatDate(dateToObj),
    };
    console.log("params", params);

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
    return [];
  }
};

const playerLeaderboard = async (competition = "PL", season, limit = 20) => {
  try {
    const params = {
      limit,
    };
    if (season) params.season = season;

    const playerRes = await footballApi.get(
      `/competitions/${competition}/scorers`,
      {
        params,
      },
    );
    const rawScorers = playerRes.data?.scorers || [];
    return rawScorers.map((item, index) => {
      const goals = item.goals || 0;
      const assists = item.assists || 0;
      const playedMatches = item.playedMatches || 0;
      const penalties = item.penalties || 0;
      const rating = Number(
        Math.min(9.8, 7.2 + goals * 0.25 + (assists || 0) * 0.15).toFixed(2),
      );

      return {
        id: item.player.id.toString(),
        rank: index + 1,
        name: item.player.name,
        photo: null,
        flag: item.team.crest || "",
        teamName: item.team.shortName || item.team.name,
        teamCrest: item.team.crest || "",
        position: item.player.position || "Offence",
        number: index + 1,
        nationality: item.player.nationality || item.team.area?.name || "",
        dateOfBirth: item.player.dateOfBirth || "",
        goals,
        assists,
        playedMatches,
        penalties,
        value: `${goals} Goals`,
        stats: {
          goals,
          assists,
          playedMatches,
          penalties,
          rating,
        },
      };
    });
  } catch (err) {
    console.error(
      "⚠️ [football.service] playerLeaderboard API failed, falling back to mock:",
      err.message,
    );
    return [];
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
    return [];
  }
};

const getMatchSummary = async (matchId) => {
  let cachedSummary = await MatchSummary.findOne({ matchId });
  const now = new Date();

  // If already finished and summary exists, return immediately (fast cache response)
  if (
    cachedSummary &&
    cachedSummary.status === "FINISHED" &&
    cachedSummary.aiSummary
  ) {
    return cachedSummary;
  }

  // Call API and check status if no cache, or if cache is live (meaning it's updating),
  // or if last updated is older than 60 seconds
  const isStale =
    !cachedSummary ||
    !cachedSummary.aiSummary ||
    cachedSummary.status === "LIVE" ||
    (now - new Date(cachedSummary.lastUpdated)) / 1000 > 60;

  if (isStale) {
    try {
      const matchDetails = await getMatchDetails(matchId);
      if (matchDetails) {
        // Only call AI to generate a summary if:
        // 1. We don't have a summary in the DB yet
        // 2. The match is currently LIVE
        // 3. The match status has changed (e.g. SCHEDULED -> LIVE, or LIVE -> FINISHED)
        const hasNoSummary = !cachedSummary || !cachedSummary.aiSummary;
        const isLive = matchDetails.status === "LIVE";
        const statusChanged =
          cachedSummary && cachedSummary.status !== matchDetails.status;

        const shouldGenerateAI = hasNoSummary || isLive || statusChanged;

        let summaryText;
        if (shouldGenerateAI) {
          const aiService = require("./ai.service");
          summaryText =
            await aiService.generateMatchSummaryResponse(matchDetails);
        } else {
          summaryText = cachedSummary.aiSummary;
        }

        if (!cachedSummary) {
          cachedSummary = new MatchSummary({
            matchId,
            status: matchDetails.status,
            aiSummary: summaryText,
            lastUpdated: now,
          });
        } else {
          cachedSummary.status = matchDetails.status;
          cachedSummary.aiSummary = summaryText;
          cachedSummary.lastUpdated = now;
        }
        await cachedSummary.save();
      }
    } catch (err) {
      console.error(
        `Error generating or saving AI Match Summary for ID ${matchId}:`,
        err,
      );
    }
  }

  return cachedSummary;
};

const getCompetation = async () => {
  try {
    const competitionCodes = ["PL", "PD", "BL1", "FL1", "SA", "CL"];

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

const getTeamsByCompetation = async (leagueId = "PL") => {
  try {
    const response = await footballApi.get(`/competitions/${leagueId}/teams`);
    console.log("response", response.data);
    const rawTeams = response?.data?.teams;
    return rawTeams;
  } catch (error) {
    console.error("Error fetching competitions:", error);
    return [];
  }
};

const getPlayerDetails = async (personId) => {
  try {
    const response = await footballApi.get(`/persons/${personId}`);
    console.log("response", response.data);
    const data = response.data;
    if (!data) return null;

    return {
      id: String(data.id),
      name: data.name,
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      dateOfBirth: data.dateOfBirth || "",
      nationality: data.nationality || "",
      section: data.section || "",
      position: data.position || data.section || "Player",
      shirtNumber: data.shirtNumber || null,
      number: data.shirtNumber || null,
      lastUpdated: data.lastUpdated || "",
      teamName: data.currentTeam?.shortName || data.currentTeam?.name || "N/A",
      teamCrest: data.currentTeam?.crest || "",
      flag: data.currentTeam?.area?.flag || data.currentTeam?.crest || "",
      currentTeam: data.currentTeam
        ? {
            id: data.currentTeam.id,
            name: data.currentTeam.name,
            shortName: data.currentTeam.shortName || data.currentTeam.name,
            tla: data.currentTeam.tla || "",
            crest: data.currentTeam.crest || "",
            address: data.currentTeam.address || "",
            website: data.currentTeam.website || "",
            founded: data.currentTeam.founded || null,
            clubColors: data.currentTeam.clubColors || "",
            venue: data.currentTeam.venue || "",
            area: data.currentTeam.area || null,
            runningCompetitions: data.currentTeam.runningCompetitions || [],
            contract: data.currentTeam.contract || null,
          }
        : null,
      stats: {
        goals: data.goals || 0,
        assists: data.assists || 0,
        playedMatches: data.playedMatches || 0,
        rating: 7.5,
      },
    };
  } catch (error) {
    console.error("Error fetching player details:", error);
    return null;
  }
};

const getTeamDetails = async (teamId) => {
  try {
    const response = await footballApi.get(`/teams/${teamId}`);
    const data = response.data;
    if (!data) return null;

    return {
      id: String(data.id),
      name: data.name,
      shortName: data.shortName || data.name,
      tla: data.tla || "",
      crest: data.crest || "",
      logo: data.crest || "",
      address: data.address || "",
      website: data.website || "",
      founded: data.founded || null,
      clubColors: data.clubColors || "",
      venue: data.venue || "N/A",
      stadium: data.venue || "N/A",
      area: data.area || null,
      runningCompetitions: data.runningCompetitions || [],
      coach: data.coach
        ? {
            id: data.coach.id,
            name: data.coach.name,
            firstName: data.coach.firstName,
            lastName: data.coach.lastName,
            nationality: data.coach.nationality || "",
            dateOfBirth: data.coach.dateOfBirth || "",
          }
        : null,
      manager: data.coach?.name || "N/A",
      squad: (data.squad || []).map((player) => ({
        id: String(player.id),
        name: player.name,
        position: player.position || player.section || "Player",
        dateOfBirth: player.dateOfBirth || "",
        nationality: player.nationality || "",
      })),
      staff: data.staff || [],
      lastUpdated: data.lastUpdated || "",
    };
  } catch (error) {
    console.error("Error fetching team details:", error);
    return null;
  }
};

const mapTransfer = (t, index) => {
  // Format fee
  let feeText = "Undisclosed";
  if (t.fee && t.fee.feeText) {
    feeText = t.fee.feeText;
  } else if (t.amountEuroEstimated) {
    feeText = `€${(t.amountEuroEstimated / 1000000).toFixed(1)}M`;
  } else if (t.marketValue) {
    feeText = `€${(t.marketValue / 1000000).toFixed(1)}M (Est.)`;
  }

  // Format date
  let dateText = "Recent";
  if (t.transferDate) {
    const diffTime = Math.abs(new Date() - new Date(t.transferDate));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) {
      dateText = "Today";
    } else if (diffDays === 2) {
      dateText = "Yesterday";
    } else {
      dateText = `${diffDays} days ago`;
    }
  }

  return {
    id: t.playerId ? `${t.playerId}-${index}` : String(Math.random()),
    player: t.name || "Unknown Player",
    position: t.position?.label || "Player",
    fromClub: t.fromClub || "Unknown Club",
    toClub: t.toClub || "Unknown Club",
    fee: feeText,
    status: t.onLoan ? "On Loan" : "Done Deal",
    confidence: 100, // Actual transfer
    date: dateText,
  };
};

const searchPlayers = async (searchQuery) => {
  try {
    const response = await rapidFootballApi.get("/football-players-search", {
      params: { search: searchQuery },
    });
    const suggestions = response.data?.response?.suggestions || [];
    return suggestions.map((s) => ({
      id: s.id,
      name: s.name,
      team: s.teamName || "N/A",
      type: s.type || "player",
    }));
  } catch (error) {
    console.error("Error searching players via RapidAPI:", error.message);
    throw error;
  }
};

const getTopTransfers = async (page = 1) => {
  try {
    const response = await rapidFootballApi.get("/football-get-top-transfers", {
      params: { page },
    });
    const transfers = response.data?.response?.transfers || [];
    return transfers.map((t, idx) => mapTransfer(t, idx));
  } catch (error) {
    console.error("Error fetching top transfers via RapidAPI:", error.message);
    throw error;
  }
};

const getMarketValueTransfers = async (page = 1) => {
  try {
    const response = await rapidFootballApi.get(
      "/football-get-market-value-transfers",
      {
        params: { page },
      },
    );
    const transfers = response.data?.response?.transfers || [];
    return transfers.map((t, idx) => mapTransfer(t, idx));
  } catch (error) {
    console.error(
      "Error fetching market value transfers via RapidAPI:",
      error.message,
    );
    throw error;
  }
};

const mapTrendingNews = (n, index) => {
  // Format date
  let dateText = "Recent";
  if (n.gmtTime) {
    const diffTime = Math.abs(new Date() - new Date(n.gmtTime));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      dateText = "Just now";
    } else if (diffHours < 24) {
      dateText = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    } else if (diffDays === 1) {
      dateText = "Yesterday";
    } else {
      dateText = `${diffDays} days ago`;
    }
  }

  return {
    id: n.id || `news-${index}-${String(Math.random())}`,
    title: n.title || "Football Update",
    summary: `Reported by ${n.sourceStr || "Sports Intelligence"}. Read the full tactical briefing and breakdown details.`,
    content:
      n.title +
      ` (Source: ${n.sourceStr || "Sports Intelligence"}). This trending story is capturing high interest across major leagues. Check back for live score updates and statistical analysis.`,
    date: dateText,
    reads: `${Math.floor(Math.random() * 40) + 10}K reads`,
    image:
      n.imageUrl ||
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop",
  };
};

const getNews = async (page = 1) => {
  try {
    const response = await rapidFootballApi.get("/football-get-trendingnews");
    const news = response.data?.response?.news || [];
    if (news.length === 0) {
      return [];
    }
    return news.map((n, idx) => mapTrendingNews(n, idx));
  } catch (error) {
    console.error("Error fetching trending news via RapidAPI:", error.message);
    return [];
  }
};

const getNewsSummary = async (newsId) => {
  let cachedSummary = await NewsSummary.findOne({ newsId });
  const now = new Date();

  if (cachedSummary && cachedSummary.aiSummary) {
    return cachedSummary;
  }

  // Find the news item details
  // 1. Fetch current news items (will use RapidAPI / MOCK_NEWS fallback)
  const newsItems = await getNews(1);
  const newsItem = newsItems.find((item) => item.id === newsId);

  if (!newsItem) {
    throw new Error(`News article with ID ${newsId} not found`);
  }

  try {
    const aiService = require("./ai.service");
    const summaryText = await aiService.generateNewsSummaryResponse(newsItem);

    if (!cachedSummary) {
      cachedSummary = new NewsSummary({
        newsId,
        aiSummary: summaryText,
        lastUpdated: now,
      });
    } else {
      cachedSummary.aiSummary = summaryText;
      cachedSummary.lastUpdated = now;
    }

    await cachedSummary.save();
    return cachedSummary;
  } catch (error) {
    console.error(
      `Error generating or saving AI News Summary for ID ${newsId}:`,
      error,
    );
    throw error;
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
  getTeamsByCompetation,
  getPlayerDetails,
  getTeamDetails,
  getMatchSummary,
  searchPlayers,
  getTopTransfers,
  getMarketValueTransfers,
  getNews,
  getNewsSummary,
};
