const footballApi = require("./footballApi.service");
const { DEFAULT_COMPETITIONS } = require("../utils/constants");

// --- Helper Functions for Data Mapping ---

const getEmojiLogo = (teamName) => {
  if (!teamName) return "⚽";
  const name = teamName.toLowerCase();
  if (name.includes("arsenal")) return "🔴";
  if (name.includes("manchester city") || name.includes("man city"))
    return "🩵";
  if (name.includes("liverpool")) return "🔴";
  if (name.includes("chelsea")) return "🔵";
  if (
    name.includes("manchester united") ||
    name.includes("man united") ||
    name.includes("man utd")
  )
    return "🔴";
  if (name.includes("tottenham") || name.includes("spurs")) return "⚪";
  if (name.includes("aston villa")) return "🦁";
  if (name.includes("newcastle")) return "⚫⚪";
  if (name.includes("west ham")) return "⚒️";
  if (name.includes("brighton")) return "🔵⚪";
  if (name.includes("wolverhampton") || name.includes("wolves")) return "🐺";
  if (name.includes("fulham")) return "⚪⚫";
  if (name.includes("crystal palace")) return "🦅";
  if (name.includes("brentford")) return "🐝";
  if (name.includes("everton")) return "🔵";
  if (name.includes("nottingham forest") || name.includes("nottingham"))
    return "🌳";
  if (name.includes("bournemouth")) return "🍒";
  if (name.includes("leicester")) return "🦊";
  if (name.includes("ipswich")) return "🚜";
  if (name.includes("southampton")) return "🔴⚪";
  return "⚽";
};

const getFlagEmoji = (nationality) => {
  if (!nationality) return "🏳️";
  const nat = nationality.toLowerCase();
  if (nat === "england") return "🏴󠁧󠁢󠁥󠁮󠁧󠁿";
  if (nat === "norway") return "🇳🇴";
  if (nat === "egypt") return "🇪🇬";
  if (nat === "france") return "🇫🇷";
  if (nat === "brazil") return "🇧🇷";
  if (nat === "argentina") return "🇦🇷";
  if (nat === "portugal") return "🇵🇹";
  if (nat === "spain") return "🇪🇸";
  if (nat === "belgium") return "🇧🇪";
  if (nat === "germany") return "🇩🇪";
  if (nat === "netherlands" || nat === "holland") return "🇳🇱";
  if (nat === "senegal") return "🇸🇳";
  if (nat === "sweden") return "🇸🇪";
  if (nat === "denmark") return "🇩🇰";
  if (nat === "italy") return "🇮🇹";
  if (nat === "croatia") return "🇭🇷";
  if (nat === "scotland") return "🏴󠁧󠁢󠁳󠁣󠁴󠁿";
  if (nat === "wales") return "🏴󠁧󠁢󠁷󠁬󠁳󠁿";
  if (nat === "republic of ireland" || nat === "ireland") return "🇮🇪";
  if (nat === "poland") return "🇵🇱";
  if (nat === "cameroon") return "🇨🇲";
  if (nat === "nigeria") return "🇳🇬";
  if (nat === "ghana") return "🇬🇭";
  if (nat === "ivory coast" || nat === "côte d'ivoire") return "🇨🇮";
  if (nat === "colombia") return "🇨🇴";
  if (nat === "uruguay") return "🇺🇾";
  if (nat === "chile") return "🇨🇱";
  if (nat === "mexico") return "🇲🇽";
  if (nat === "united states" || nat === "usa") return "🇺🇸";
  if (nat === "canada") return "🇨🇦";
  if (nat === "australia") return "🇦🇺";
  if (nat === "japan") return "🇯🇵";
  if (nat === "south korea" || nat === "korea republic") return "🇰🇷";
  if (nat === "ukraine") return "🇺🇦";
  if (nat === "austria") return "🇦🇹";
  if (nat === "switzerland") return "🇨🇭";
  return "🏳️";
};

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

const MOCK_LIVE_MATCHES = [
  {
    id: "m1",
    leagueId: "pl",
    leagueName: "Premier League",
    status: "live",
    minute: 74,
    homeTeam: { id: "57", name: "Arsenal", logo: "🔴", score: 2, xG: 1.84 },
    awayTeam: { id: "65", name: "Man City", logo: "🩵", score: 1, xG: 1.12 },
    date: "Live",
    timestamp: new Date().toISOString(),
  },
];

const MOCK_UPCOMING_MATCHES = [
  {
    id: "m2",
    leagueId: "laliga",
    leagueName: "La Liga",
    status: "upcoming",
    date: "Today, 21:00",
    timestamp: new Date(Date.now() + 3600000 * 11).toISOString(),
    homeTeam: {
      id: "86",
      name: "Real Madrid",
      logo: "⚪",
      score: null,
      xG: null,
    },
    awayTeam: {
      id: "81",
      name: "Barcelona",
      logo: "🔵🔴",
      score: null,
      xG: null,
    },
    prediction: { homeWin: 42, draw: 28, awayWin: 30 },
  },
  {
    id: "m4",
    leagueId: "pl",
    leagueName: "Premier League",
    status: "upcoming",
    date: "Tomorrow, 15:00",
    timestamp: new Date(Date.now() + 3600000 * 29).toISOString(),
    homeTeam: {
      id: "64",
      name: "Liverpool",
      logo: "🔴",
      score: null,
      xG: null,
    },
    awayTeam: { id: "61", name: "Chelsea", logo: "🔵", score: null, xG: null },
    prediction: { homeWin: 55, draw: 25, awayWin: 20 },
  },
];

const MOCK_STANDINGS = [
  {
    id: "57",
    leagueId: "pl",
    name: "Arsenal",
    logo: "🔴",
    played: 28,
    won: 20,
    drawn: 5,
    lost: 3,
    gd: 38,
    points: 65,
  },
  {
    id: "65",
    leagueId: "pl",
    name: "Manchester City",
    logo: "🩵",
    played: 28,
    won: 19,
    drawn: 6,
    lost: 3,
    gd: 36,
    points: 63,
  },
  {
    id: "64",
    leagueId: "pl",
    name: "Liverpool",
    logo: "🔴",
    played: 28,
    won: 18,
    drawn: 7,
    lost: 3,
    gd: 32,
    points: 61,
  },
  {
    id: "61",
    leagueId: "pl",
    name: "Chelsea",
    logo: "🔵",
    played: 28,
    won: 15,
    drawn: 8,
    lost: 5,
    gd: 18,
    points: 53,
  },
];

const MOCK_SCORERS = [
  {
    id: "p1",
    name: "Erling Haaland",
    flag: "🇳🇴",
    teamName: "Manchester City",
    position: "Forward",
    stats: { goals: 28 },
  },
  {
    id: "p2",
    name: "Bukayo Saka",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    teamName: "Arsenal",
    position: "Forward",
    stats: { goals: 18 },
  },
  {
    id: "p3",
    name: "Mohamed Salah",
    flag: "🇪🇬",
    teamName: "Liverpool",
    position: "Forward",
    stats: { goals: 17 },
  },
];

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
      logo: item.team.crest || getEmojiLogo(item.team.name),
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

module.exports = {
  getLiveMatches,
  getStanding,
  upcomingMatches,
  playerLeaderboard,
  getDashboardData,
  getLeagueDetails,
};
