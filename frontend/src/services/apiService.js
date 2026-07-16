import { LEAGUES, TEAMS, PLAYERS, MATCHES, NEWS, TRANSFERS, AI_RESPONSES } from '../constants/mockData';

// Helper to simulate network latency
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const apiService = {
  getLeagues: async () => {
    await delay(300);
    return LEAGUES;
  },

  getLeague: async (id) => {
    await delay(400);
    const league = LEAGUES.find(l => l.id === id);
    if (!league) throw new Error('League not found');
    const teams = TEAMS.filter(t => t.leagueId === id).sort((a, b) => a.rank - b.rank);
    const matches = MATCHES.filter(m => m.leagueId === id);
    return { ...league, teams, matches };
  },

  getTeams: async () => {
    await delay(300);
    return TEAMS;
  },

  getTeam: async (id) => {
    await delay(450);
    const team = TEAMS.find(t => t.id === id);
    if (!team) throw new Error('Team not found');
    const players = PLAYERS.filter(p => p.teamId === id);
    const fixtures = MATCHES.filter(m => m.homeTeam.id === id || m.awayTeam.id === id);
    // Build standing position in the league
    const leagueTeams = TEAMS.filter(t => t.leagueId === team.leagueId).sort((a, b) => a.rank - b.rank);
    return { ...team, players, fixtures, leagueTeams };
  },

  getPlayers: async () => {
    await delay(300);
    return PLAYERS;
  },

  getPlayer: async (id) => {
    await delay(400);
    const player = PLAYERS.find(p => p.id === id);
    if (!player) throw new Error('Player not found');
    const team = TEAMS.find(t => t.id === player.teamId);
    return { ...player, team };
  },

  getMatches: async () => {
    await delay(350);
    return MATCHES;
  },

  getMatch: async (id) => {
    await delay(400);
    const match = MATCHES.find(m => m.id === id);
    if (!match) throw new Error('Match not found');
    return match;
  },

  getNews: async () => {
    await delay(300);
    return NEWS;
  },

  getTransfers: async () => {
    await delay(300);
    return TRANSFERS;
  },

  askCopilot: async (prompt) => {
    await delay(1200); // Higher delay for premium AI feel
    const query = prompt.toLowerCase();
    if (query.includes('tactical') || query.includes('arsenal') || query.includes('mancity')) {
      return AI_RESPONSES.tactical;
    }
    if (query.includes('scout') || query.includes('playmaker') || query.includes('midfielder') || query.includes('zubimendi')) {
      return AI_RESPONSES.scouting;
    }
    return AI_RESPONSES.default;
  }
};
