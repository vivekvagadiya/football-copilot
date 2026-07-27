const footballApi = require("./footballApi.service");

const getLiveMatches = async () => {
  const matchesRes = await footballApi.get("/matches?limit=10&status=LIVE");
  console.log("🚀 ~ getLiveMatches ~ matchesRes:", matchesRes.data);
  return matchesRes.data;
};

const getStanding = async () => {
  const standingsRes = await footballApi.get("/competitions/PL/standings");
  console.log("🚀 ~ getStanding ~ standingsRes:", standingsRes.data);
  return standingsRes.data;
};

const upcomingMatches = async (dateFrom, dateTo) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Default to past 7 days if no past date filter is provided
  const defaultPastDate = new Date(today);
  defaultPastDate.setDate(defaultPastDate.getDate() - 7);

  const formattedDateFrom = dateFrom || defaultPastDate.toISOString().slice(0, 10); // YYYY-MM-DD
  const formattedDateTo = dateTo || tomorrow.toISOString().slice(0, 10);

  const matchesRes = await footballApi.get(
    `/matches?dateFrom=${formattedDateFrom}&dateTo=${formattedDateTo}&limit=10`,
  );
  console.log("🚀 ~ upcomingMatches ~ matchesRes:", matchesRes.data);
  return matchesRes.data;
};

const playerLeaderboard = async () => {
  const playerRes = await footballApi.get("/competitions/PL/scorers");
  console.log("🚀 ~ playerLeaderboard ~ playerRes:", playerRes.data);
  return playerRes.data;
};

const getDashboardData = async (query = {}) => {
  const { dateFrom, dateTo } = query;
  const [matchesRes, standingsRes, upcomingRes, playerRes] = await Promise.all([
    getLiveMatches(),
    getStanding(),
    upcomingMatches(dateFrom, dateTo),
    playerLeaderboard(),
  ]);
  console.log("🚀 ~ getDashboardData ~ matchesRes:", matchesRes);
  console.log("🚀 ~ getDashboardData ~ standingRes:", standingsRes);
  return {
    matches: matchesRes,
    standings: standingsRes,
    upcomingMatches: upcomingRes,
    playerLeaderboard: playerRes,
  };
};

module.exports = {
  getLiveMatches,
  getStanding,
  getDashboardData,
};

if (require.main === module) {
  getDashboardData().catch((err) => {
    console.error("Error running getDashboardData:", err.message);
  });
}
