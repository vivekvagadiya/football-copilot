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

// Baseline club power rankings / Elo ratings for European football teams
// Used in the Poisson goal expectancy model when live bookmaker odds are unavailable
const KNOWN_CLUB_RATINGS = {
  // Premier League
  "manchester city": 1960, "man city": 1960, "mancity": 1960,
  "arsenal": 1930,
  "liverpool": 1920,
  "chelsea": 1810,
  "tottenham": 1800, "tottenham hotspur": 1800, "spurs": 1800,
  "manchester united": 1780, "man united": 1780, "man utd": 1780,
  "aston villa": 1800,
  "newcastle": 1790, "newcastle united": 1790,
  "brighton": 1740, "brighton & hove albion": 1740,
  "west ham": 1710, "west ham united": 1710,
  "crystal palace": 1670,
  "fulham": 1680,
  "brentford": 1670,
  "bournemouth": 1660,
  "everton": 1650,
  "wolverhampton": 1660, "wolves": 1660,
  "nottingham forest": 1670, "nott'm forest": 1670,
  "ipswich": 1580, "ipswich town": 1580,
  "leicester": 1620, "leicester city": 1620,
  "southampton": 1590,

  // La Liga
  "real madrid": 1980,
  "barcelona": 1920,
  "atletico madrid": 1840, "atlético madrid": 1840,
  "athletic club": 1780, "athletic bilbao": 1780,
  "real sociedad": 1760,
  "villarreal": 1750,
  "girona": 1740,
  "real betis": 1730, "betis": 1730,
  "sevilla": 1710,

  // Bundesliga
  "bayern münchen": 1940, "bayern munich": 1940, "bayern": 1940,
  "bayer leverkusen": 1900, "leverkusen": 1900,
  "borussia dortmund": 1830, "dortmund": 1830,
  "rb leipzig": 1820, "leipzig": 1820,
  "eintracht frankfurt": 1740, "frankfurt": 1740,
  "stuttgart": 1750, "vfb stuttgart": 1750,

  // Serie A
  "inter": 1900, "inter milan": 1900, "internazionale": 1900,
  "juventus": 1840,
  "milan": 1830, "ac milan": 1830,
  "atalanta": 1820,
  "napoli": 1830,
  "roma": 1760, "as roma": 1760,
  "lazio": 1760,
  "fiorentina": 1730,

  // Ligue 1
  "paris saint-germain": 1910, "psg": 1910,
  "monaco": 1770, "as monaco": 1770,
  "marseille": 1760, "olympique marseille": 1760,
  "lille": 1750,
  "lyon": 1730, "olympique lyonnais": 1730,
};

const getTeamRating = (team) => {
  if (!team) return 1600;
  const rawName = (team.shortName || team.name || "").toLowerCase().trim();
  const cleanName = rawName.replace(/\b(fc|cf|afc|sc|bsc)\b/g, "").trim();

  if (KNOWN_CLUB_RATINGS[cleanName]) return KNOWN_CLUB_RATINGS[cleanName];
  if (KNOWN_CLUB_RATINGS[rawName]) return KNOWN_CLUB_RATINGS[rawName];

  for (const [key, rating] of Object.entries(KNOWN_CLUB_RATINGS)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return rating;
    }
  }

  return 1600; // Baseline average European top-flight rating
};

// Factorial lookup for Poisson distribution (0-8 goals)
const FACTORIALS = [1, 1, 2, 6, 24, 120, 720, 5040, 40320];
const poisson = (k, lambda) => {
  if (k < 0 || k > 8) return 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / (FACTORIALS[k] || 1);
};

// Calculate win, draw, away probabilities using a standard bivariate Poisson goal expectancy model
const calculateWinProbabilities = (match, homeTeam, awayTeam) => {
  // 1. If provider supplies live match odds, derive implied market probabilities
  if (match.odds?.homeWin && match.odds?.awayWin) {
    const rawH = 1 / match.odds.homeWin;
    const rawD = match.odds.draw ? 1 / match.odds.draw : 0.26;
    const rawA = 1 / match.odds.awayWin;
    const sum = rawH + rawD + rawA;
    const homeWin = Math.round((rawH / sum) * 100);
    const awayWin = Math.round((rawA / sum) * 100);
    const draw = Math.max(0, 100 - homeWin - awayWin);
    return {
      homeWin,
      draw,
      awayWin,
      isDemoEstimate: false,
      model: "Market Odds Implied Probability",
      label: "Official Market Odds",
      disclaimer: "Implied probability derived from match odds (overround normalized).",
    };
  }

  // 2. Otherwise use a calibrated bivariate Poisson model with European home advantage
  const homeRating = getTeamRating(homeTeam);
  const awayRating = getTeamRating(awayTeam);

  // European baseline home advantage: +75 Elo points (~+0.30 expected goal advantage)
  const HOME_ADVANTAGE = 75;
  const ratingDelta = (homeRating + HOME_ADVANTAGE) - awayRating;

  // Logistic goal ratio scaling
  const strengthRatio = Math.pow(10, ratingDelta / 600);

  // European baseline expected goals: ~1.45 home vs ~1.15 away
  const homeLambda = Math.min(3.8, Math.max(0.4, 1.45 * ((2 * strengthRatio) / (strengthRatio + 1))));
  const awayLambda = Math.min(3.8, Math.max(0.4, 1.15 * (2 / (strengthRatio + 1))));

  let homeWinP = 0;
  let drawP = 0;
  let awayWinP = 0;

  for (let h = 0; h <= 8; h++) {
    const pH = poisson(h, homeLambda);
    for (let a = 0; a <= 8; a++) {
      const pJoint = pH * poisson(a, awayLambda);
      if (h > a) {
        homeWinP += pJoint;
      } else if (h === a) {
        drawP += pJoint;
      } else {
        awayWinP += pJoint;
      }
    }
  }

  const total = homeWinP + drawP + awayWinP || 1;
  const homePercent = Math.round((homeWinP / total) * 100);
  const awayPercent = Math.round((awayWinP / total) * 100);
  const drawPercent = Math.max(0, 100 - homePercent - awayPercent);

  return {
    homeWin: homePercent,
    draw: drawPercent,
    awayWin: awayPercent,
    expectedGoals: {
      home: parseFloat(homeLambda.toFixed(2)),
      away: parseFloat(awayLambda.toFixed(2)),
    },
    isDemoEstimate: true,
    model: "Bivariate Poisson Goal Expectancy",
    label: "Demo Estimate",
    disclaimer: "Demo estimate: Model-based statistical simulation. Official bookmaker or Opta tracking feeds are not connected.",
  };
};

// Resolve xG: Prioritize official provider tracking stats if present;
// otherwise calculate a chance-quality heuristic model clearly labeled as demo estimate.
const resolveExpectedGoals = (match, homeScore, awayScore, isUpcoming, minute) => {
  if (isUpcoming) {
    return {
      homeXG: null,
      awayXG: null,
      isDemoEstimate: false,
      source: null,
      label: null,
    };
  }

  // 1. Check for genuine provider xG if available from raw match or stats
  const providerHomeXG =
    match.homeTeam?.xG ??
    match.stats?.expectedGoals?.home ??
    match.stats?.xG?.home ??
    match.xG?.home;
  const providerAwayXG =
    match.awayTeam?.xG ??
    match.stats?.expectedGoals?.away ??
    match.stats?.xG?.away ??
    match.xG?.away;

  if (
    typeof providerHomeXG === "number" &&
    typeof providerAwayXG === "number" &&
    !isNaN(providerHomeXG) &&
    !isNaN(providerAwayXG)
  ) {
    return {
      homeXG: parseFloat(providerHomeXG.toFixed(2)),
      awayXG: parseFloat(providerAwayXG.toFixed(2)),
      isDemoEstimate: false,
      source: "provider",
      label: "Official Tracking",
    };
  }

  // 2. If provider does not supply xG, generate a statistical chance-quality model
  // Scored goals carry ~0.45 chance xG on average, while baseline match flow generates ~0.01 xG/min
  const elapsed = typeof minute === "number" ? Math.min(90, Math.max(1, minute)) : 90;
  const matchProgress = elapsed / 90;

  // Open play baseline: ~0.85 home vs ~0.70 away across 90 minutes
  const baseHomeDanger = 0.85 * matchProgress;
  const baseAwayDanger = 0.70 * matchProgress;

  const homeGoals = homeScore ?? 0;
  const awayGoals = awayScore ?? 0;

  const homeXG = parseFloat((baseHomeDanger + homeGoals * 0.45).toFixed(2));
  const awayXG = parseFloat((baseAwayDanger + awayGoals * 0.45).toFixed(2));

  return {
    homeXG,
    awayXG,
    isDemoEstimate: true,
    source: "demo_estimate",
    label: "Demo Estimate",
  };
};

const mapMatch = (match) => {
  if (!match) return null;

  const rawStatus = (match.status || "").toUpperCase();
  const isLive = [
    "LIVE",
    "IN_PLAY",
    "PAUSED",
    "EXTRA_TIME",
    "PENALTY_SHOOTOUT",
    "HALFTIME",
    "SUSPENDED",
  ].includes(rawStatus);
  const isFinished = ["FINISHED", "AWARDED"].includes(rawStatus);
  const isUpcoming =
    ["SCHEDULED", "TIMED", "POSTPONED", "CANCELLED"].includes(rawStatus) ||
    (!isLive && !isFinished);

  let mappedStatus = "SCHEDULED";
  if (isLive) mappedStatus = "LIVE";
  else if (isFinished) mappedStatus = "FINISHED";

  // Dynamic minute calculation for live matches
  let minute = null;
  if (isLive) {
    if (match.minute !== undefined && match.minute !== null) {
      minute = match.minute;
    } else if (rawStatus === "PAUSED" || rawStatus === "HALFTIME") {
      minute = 45;
    } else if (match.utcDate) {
      const startMs = new Date(match.utcDate).getTime();
      const nowMs = Date.now();
      const elapsed = Math.floor((nowMs - startMs) / 60000);
      if (elapsed <= 0) {
        minute = 1;
      } else if (elapsed <= 45) {
        minute = elapsed;
      } else if (elapsed <= 60) {
        minute = 45; // Halftime interval
      } else {
        minute = Math.min(90, Math.max(46, elapsed - 15));
      }
    } else {
      minute = 1;
    }
  }

  // Score resolution (handling live vs fulltime vs halftime)
  let homeScore = null;
  let awayScore = null;
  if (!isUpcoming) {
    homeScore =
      match.score?.fullTime?.home ??
      match.score?.regularTime?.home ??
      match.score?.current?.home ??
      match.score?.halfTime?.home ??
      match.homeTeam?.score ??
      0;

    awayScore =
      match.score?.fullTime?.away ??
      match.score?.regularTime?.away ??
      match.score?.current?.away ??
      match.score?.halfTime?.away ??
      match.awayTeam?.score ??
      0;
  }

  // Expected goals (xG) resolution: official tracking or clearly labeled demo estimate
  const xgData = resolveExpectedGoals(match, homeScore, awayScore, isUpcoming, minute);

  // Win probability prediction for upcoming matches: Poisson model or market odds
  let prediction = null;
  if (isUpcoming) {
    prediction = calculateWinProbabilities(match, match.homeTeam, match.awayTeam);
  }

  // Events (if present)
  let events = [];
  if (Array.isArray(match.events)) {
    events = match.events;
  } else if (Array.isArray(match.goals)) {
    events = match.goals.map((g) => ({
      type: "goal",
      minute: g.minute || 0,
      team: g.team?.id === match.homeTeam?.id ? "home" : "away",
      player: g.scorer?.name || "Goal",
      assist: g.assist?.name || "",
      detail: g.type || "Goal",
    }));
  }

  return {
    id: (match.id || "").toString(),
    leagueId: match.competition?.code || match.leagueId || "PL",
    leagueName: match.competition?.name || match.leagueName || "Premier League",
    leagueLogo: match.competition?.emblem || match.leagueLogo || "",
    status: mappedStatus,
    minute,
    homeTeam: {
      id: (match.homeTeam?.id || "").toString(),
      name: match.homeTeam?.shortName || match.homeTeam?.name || "Home Team",
      logo: match.homeTeam?.crest || match.homeTeam?.logo || "",
      score: homeScore,
      xG: xgData.homeXG,
      isDemoEstimate: xgData.isDemoEstimate,
      xGSource: xgData.source,
      xGLabel: xgData.label,
    },
    awayTeam: {
      id: (match.awayTeam?.id || "").toString(),
      name: match.awayTeam?.shortName || match.awayTeam?.name || "Away Team",
      logo: match.awayTeam?.crest || match.awayTeam?.logo || "",
      score: awayScore,
      xG: xgData.awayXG,
      isDemoEstimate: xgData.isDemoEstimate,
      xGSource: xgData.source,
      xGLabel: xgData.label,
    },
    events,
    date: formatMatchDate(match.utcDate),
    timestamp: match.utcDate || "",
    prediction,
    xGSummary: {
      isDemoEstimate: xgData.isDemoEstimate,
      source: xgData.source,
      label: xgData.label,
    },
  };
};

// --- Mock Data Fallbacks for API Rate-Limits/Errors ---

// Mock data is imported from ./mockData.js

// --- Service Functions ---

const getLiveMatches = async (
  dateFrom,
  dateTo,
  competitions,
  limit = 10,
  offset = 0,
  status = "LIVE",
  leagueId,
  days,
) => {
  try {
    // Support if options are passed as an object or as positional arguments
    let paramsObj = {};
    if (typeof dateFrom === "object" && dateFrom !== null) {
      paramsObj = dateFrom;
    } else {
      paramsObj = {
        dateFrom,
        dateTo,
        competitions,
        limit,
        offset,
        status: status || "LIVE",
        leagueId,
        days,
      };
    }

    const {
      dateFrom: dFrom,
      dateTo: dTo,
      competitions: comp,
      limit: lim = 10,
      offset: off = 0,
      status: stat = "LIVE",
      leagueId: lId,
    } = paramsObj;

    const params = {
      status: stat && stat !== "all" ? stat : "LIVE",
    };

    if (dFrom) params.dateFrom = dFrom;
    if (dTo) params.dateTo = dTo;

    const compFilter = lId || comp || DEFAULT_COMPETITIONS.join(",");
    if (compFilter && compFilter !== "all") {
      params.competitions = compFilter;
    }

    const parsedLimit = lim ? parseInt(lim, 10) : 10;
    const parsedOffset = off ? parseInt(off, 10) : 0;
    params.limit = 100;

    console.log(
      "Calling footballApi.get('/matches') for LIVE with params:",
      params,
    );
    const matchesRes = await footballApi.get("/matches", { params });
    const rawMatches = matchesRes.data?.matches || [];
    console.log("live matches fetched:", rawMatches.length);
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
  days = 10,
) => {
  try {
    const today = new Date();
    const rangeDays = parseInt(days, 10) || 10;

    const formatDate = (date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    let defaultDateFrom;
    let defaultDateTo;

    if (status === "FINISHED") {
      // For finished matches, look back over recent days up to today
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - rangeDays);
      defaultDateFrom = formatDate(pastDate);
      defaultDateTo = formatDate(today);
    } else if (status === "all" || !status) {
      // For full calendar, include recent past (last 4 days) + upcoming (next 5 days) within API limits
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - 4);
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 5);
      defaultDateFrom = formatDate(pastDate);
      defaultDateTo = formatDate(futureDate);
    } else {
      // For scheduled/upcoming matches, look forward from today
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + rangeDays);
      defaultDateFrom = formatDate(today);
      defaultDateTo = formatDate(futureDate);
    }

    const params = {
      dateFrom: dateFrom || defaultDateFrom,
      dateTo: dateTo || defaultDateTo,
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
    params.limit = parsedLimit;
    params.offset = parsedOffset;
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
  const {
    dateFrom,
    dateTo,
    league,
    season,
    competitions,
    limit,
    offset,
    status,
    leagueId,
    days,
  } = query;
  const [matchesRes, standingsRes, upcomingRes, playerRes] = await Promise.all([
    getLiveMatches(),
    getStanding(league || "PL", season),
    upcomingMatches(
      dateFrom,
      dateTo,
      competitions,
      limit,
      offset,
      status,
      leagueId,
      days,
    ),
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

const getMatchAiTimeline = async (matchId) => {
  let cachedSummary = await MatchSummary.findOne({ matchId });
  const now = new Date();

  // If match finished and timeline exists, return immediately from cache
  if (
    cachedSummary &&
    cachedSummary.status === "FINISHED" &&
    cachedSummary.aiTimeline
  ) {
    return cachedSummary.aiTimeline;
  }

  const isStale =
    !cachedSummary ||
    !cachedSummary.aiTimeline ||
    cachedSummary.status === "LIVE" ||
    (now - new Date(cachedSummary.lastUpdated)) / 1000 > 60;

  if (isStale) {
    try {
      const matchDetails = await getMatchDetails(matchId);
      if (matchDetails) {
        const aiService = require("./ai.service");
        const timelineData =
          await aiService.generateMatchAiTimelineResponse(matchDetails);

        if (!cachedSummary) {
          cachedSummary = new MatchSummary({
            matchId,
            status: matchDetails.status,
            aiTimeline: timelineData,
            lastUpdated: now,
          });
        } else {
          cachedSummary.status = matchDetails.status;
          cachedSummary.aiTimeline = timelineData;
          cachedSummary.lastUpdated = now;
        }
        await cachedSummary.save();
        return timelineData;
      }
    } catch (err) {
      console.error(
        `Error generating or saving AI Match Timeline for ID ${matchId}:`,
        err,
      );
    }
  }

  return cachedSummary?.aiTimeline || null;
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

const searchLeagues = async (searchQuery) => {
  try {
    const response = await rapidFootballApi.get("/football-leagues-search", {
      params: { search: searchQuery },
    });
    const suggestions = response.data?.response?.suggestions || [];
    return suggestions.map((s) => ({
      id: s.id,
      name: s.name,
      countryCode: s.ccode || "N/A",
    }));
  } catch (error) {
    console.error("Error searching leagues via RapidAPI:", error.message);
    throw error;
  }
};

const searchTeams = async (searchQuery) => {
  try {
    const response = await rapidFootballApi.get("/football-teams-search", {
      params: { search: searchQuery },
    });
    const suggestions = response.data?.response?.suggestions || [];
    return suggestions.map((s) => ({
      id: s.id,
      name: s.name,
      league: s.leagueName || "N/A",
      leagueId: s.leagueId || null,
    }));
  } catch (error) {
    console.error("Error searching teams via RapidAPI:", error.message);
    throw error;
  }
};

const searchMatches = async (searchQuery) => {
  try {
    const response = await rapidFootballApi.get("/football-matches-search", {
      params: { search: searchQuery },
    });
    const suggestions = response.data?.response?.suggestions || [];
    return suggestions.map((s) => ({
      id: s.id,
      homeTeam: s.homeTeamName,
      homeTeamId: s.homeTeamId,
      awayTeam: s.awayTeamName,
      awayTeamId: s.awayTeamId,
      matchDate: s.matchDate,
      league: s.leagueName || "N/A",
      leagueId: s.leagueId || null,
      status: s.status || {},
    }));
  } catch (error) {
    console.error("Error searching matches via RapidAPI:", error.message);
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
  getMatchAiTimeline,
  searchPlayers,
  searchLeagues,
  searchTeams,
  searchMatches,
  getTopTransfers,
  getMarketValueTransfers,
  getNews,
  getNewsSummary,
};
