// Football Copilot - High-Fidelity Mock Data

export const LEAGUES = [
  { id: 'pl', name: 'Premier League', country: 'England', logo: '🇬🇧', season: '2025/2026', teamsCount: 20 },
  { id: 'laliga', name: 'La Liga', country: 'Spain', logo: '🇪🇸', season: '2025/2026', teamsCount: 20 },
  { id: 'seriea', name: 'Serie A', country: 'Italy', logo: '🇮🇹', season: '2025/2026', teamsCount: 20 },
  { id: 'bundesliga', name: 'Bundesliga', country: 'Germany', logo: '🇩🇪', season: '2025/2026', teamsCount: 18 },
  { id: 'ucl', name: 'Champions League', country: 'Europe', logo: '🇪🇺', season: '2025/2026', teamsCount: 36 }
];

export const TEAMS = [
  // Premier League
  {
    id: 'arsenal',
    name: 'Arsenal',
    shortName: 'ARS',
    leagueId: 'pl',
    logo: '🔴',
    cover: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1200&auto=format&fit=crop',
    manager: 'Mikel Arteta',
    stadium: 'Emirates Stadium (Capacity: 60,700)',
    founded: '1886',
    rank: 1,
    played: 28,
    won: 20,
    drawn: 5,
    lost: 3,
    gd: 38,
    points: 65,
    form: ['W', 'W', 'D', 'W', 'L'],
    stats: {
      goalsScored: 64,
      goalsConceded: 26,
      cleanSheets: 12,
      possession: 58.4,
      passAccuracy: 86.8,
      yellowCards: 42,
      redCards: 1
    }
  },
  {
    id: 'mancity',
    name: 'Manchester City',
    shortName: 'MCI',
    leagueId: 'pl',
    logo: '🩵',
    cover: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1200&auto=format&fit=crop',
    manager: 'Pep Guardiola',
    stadium: 'Etihad Stadium (Capacity: 53,400)',
    founded: '1880',
    rank: 2,
    played: 28,
    won: 19,
    drawn: 6,
    lost: 3,
    gd: 36,
    points: 63,
    form: ['W', 'D', 'W', 'W', 'W'],
    stats: {
      goalsScored: 68,
      goalsConceded: 32,
      cleanSheets: 10,
      possession: 63.2,
      passAccuracy: 89.5,
      yellowCards: 38,
      redCards: 0
    }
  },
  {
    id: 'liverpool',
    name: 'Liverpool',
    shortName: 'LIV',
    leagueId: 'pl',
    logo: '🔴',
    cover: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=1200&auto=format&fit=crop',
    manager: 'Arne Slot',
    stadium: 'Anfield (Capacity: 61,200)',
    founded: '1892',
    rank: 3,
    played: 28,
    won: 18,
    drawn: 7,
    lost: 3,
    gd: 32,
    points: 61,
    form: ['D', 'W', 'W', 'L', 'W'],
    stats: {
      goalsScored: 62,
      goalsConceded: 30,
      cleanSheets: 11,
      possession: 56.1,
      passAccuracy: 85.2,
      yellowCards: 45,
      redCards: 2
    }
  },
  {
    id: 'chelsea',
    name: 'Chelsea',
    shortName: 'CHE',
    leagueId: 'pl',
    logo: '🔵',
    cover: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1200&auto=format&fit=crop',
    manager: 'Enzo Maresca',
    stadium: 'Stamford Bridge (Capacity: 40,341)',
    founded: '1905',
    rank: 4,
    played: 28,
    won: 15,
    drawn: 8,
    lost: 5,
    gd: 18,
    points: 53,
    form: ['W', 'W', 'L', 'D', 'W'],
    stats: {
      goalsScored: 52,
      goalsConceded: 34,
      cleanSheets: 8,
      possession: 55.7,
      passAccuracy: 84.9,
      yellowCards: 55,
      redCards: 3
    }
  },

  // La Liga
  {
    id: 'realmadrid',
    name: 'Real Madrid',
    shortName: 'RMA',
    leagueId: 'laliga',
    logo: '⚪',
    cover: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1200&auto=format&fit=crop',
    manager: 'Carlo Ancelotti',
    stadium: 'Santiago Bernabéu (Capacity: 85,000)',
    founded: '1902',
    rank: 1,
    played: 27,
    won: 21,
    drawn: 4,
    lost: 2,
    gd: 41,
    points: 67,
    form: ['W', 'W', 'W', 'W', 'D'],
    stats: {
      goalsScored: 65,
      goalsConceded: 24,
      cleanSheets: 14,
      possession: 59.8,
      passAccuracy: 88.9,
      yellowCards: 35,
      redCards: 1
    }
  },
  {
    id: 'barcelona',
    name: 'Barcelona',
    shortName: 'FCB',
    leagueId: 'laliga',
    logo: '🔵🔴',
    cover: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1200&auto=format&fit=crop',
    manager: 'Hansi Flick',
    stadium: 'Spotify Camp Nou (Capacity: 99,350)',
    founded: '1899',
    rank: 2,
    played: 27,
    won: 20,
    drawn: 3,
    lost: 4,
    gd: 39,
    points: 63,
    form: ['W', 'L', 'W', 'W', 'W'],
    stats: {
      goalsScored: 70,
      goalsConceded: 31,
      cleanSheets: 9,
      possession: 61.2,
      passAccuracy: 88.0,
      yellowCards: 40,
      redCards: 2
    }
  },
  {
    id: 'atletico',
    name: 'Atlético Madrid',
    shortName: 'ATM',
    leagueId: 'laliga',
    logo: '🔴⚪',
    cover: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1200&auto=format&fit=crop',
    manager: 'Diego Simeone',
    stadium: 'Cívitas Metropolitano (Capacity: 70,400)',
    founded: '1903',
    rank: 3,
    played: 27,
    won: 16,
    drawn: 7,
    lost: 4,
    gd: 22,
    points: 55,
    form: ['L', 'W', 'D', 'W', 'W'],
    stats: {
      goalsScored: 45,
      goalsConceded: 23,
      cleanSheets: 13,
      possession: 50.5,
      passAccuracy: 83.1,
      yellowCards: 59,
      redCards: 4
    }
  },

  // Bundesliga
  {
    id: 'bayern',
    name: 'Bayern Munich',
    shortName: 'FCB',
    leagueId: 'bundesliga',
    logo: '🔴⚪',
    cover: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1200&auto=format&fit=crop',
    manager: 'Vincent Kompany',
    stadium: 'Allianz Arena (Capacity: 75,000)',
    founded: '1900',
    rank: 1,
    played: 25,
    won: 18,
    drawn: 5,
    lost: 2,
    gd: 45,
    points: 59,
    form: ['W', 'W', 'W', 'D', 'W'],
    stats: {
      goalsScored: 72,
      goalsConceded: 27,
      cleanSheets: 11,
      possession: 64.8,
      passAccuracy: 90.1,
      yellowCards: 32,
      redCards: 0
    }
  },
  {
    id: 'dortmund',
    name: 'Borussia Dortmund',
    shortName: 'BVB',
    leagueId: 'bundesliga',
    logo: '🟡⚫',
    cover: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1200&auto=format&fit=crop',
    manager: 'Nuri Sahin',
    stadium: 'Signal Iduna Park (Capacity: 81,365)',
    founded: '1909',
    rank: 2,
    played: 25,
    won: 15,
    drawn: 6,
    lost: 4,
    gd: 24,
    points: 51,
    form: ['D', 'W', 'W', 'L', 'W'],
    stats: {
      goalsScored: 54,
      goalsConceded: 30,
      cleanSheets: 8,
      possession: 54.2,
      passAccuracy: 84.5,
      yellowCards: 44,
      redCards: 1
    }
  }
];

export const PLAYERS = [
  // Arsenal Players
  {
    id: 'saka',
    name: 'Bukayo Saka',
    teamId: 'arsenal',
    teamName: 'Arsenal',
    position: 'Right Winger',
    number: 7,
    nationality: 'English',
    flag: '🇬🇧',
    age: 24,
    height: '178 cm',
    weight: '72 kg',
    preferredFoot: 'Left',
    value: '€140M',
    photo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=250&auto=format&fit=crop',
    stats: {
      appearances: 28,
      goals: 16,
      assists: 12,
      shotsOnTarget: 34,
      passAccuracy: 83.5,
      minutesPlayed: 2410,
      rating: 7.85
    },
    career: [
      { season: '2024/25', club: 'Arsenal', apps: 35, goals: 16, assists: 14 },
      { season: '2023/24', club: 'Arsenal', apps: 35, goals: 16, assists: 9 },
      { season: '2022/23', club: 'Arsenal', apps: 38, goals: 14, assists: 11 }
    ]
  },
  {
    id: 'odegaard',
    name: 'Martin Ødegaard',
    teamId: 'arsenal',
    teamName: 'Arsenal',
    position: 'Attacking Midfielder',
    number: 8,
    nationality: 'Norwegian',
    flag: '🇳🇴',
    age: 27,
    height: '178 cm',
    weight: '68 kg',
    preferredFoot: 'Left',
    value: '€110M',
    photo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=250&auto=format&fit=crop',
    stats: {
      appearances: 22,
      goals: 8,
      assists: 10,
      shotsOnTarget: 22,
      passAccuracy: 88.9,
      minutesPlayed: 1890,
      rating: 7.72
    },
    career: [
      { season: '2024/25', club: 'Arsenal', apps: 28, goals: 8, assists: 11 },
      { season: '2023/24', club: 'Arsenal', apps: 35, goals: 8, assists: 10 },
      { season: '2022/23', club: 'Arsenal', apps: 37, goals: 15, assists: 8 }
    ]
  },

  // Man City
  {
    id: 'haaland',
    name: 'Erling Haaland',
    teamId: 'mancity',
    teamName: 'Manchester City',
    position: 'Striker',
    number: 9,
    nationality: 'Norwegian',
    flag: '🇳🇴',
    age: 25,
    height: '195 cm',
    weight: '88 kg',
    preferredFoot: 'Left',
    value: '€180M',
    photo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=250&auto=format&fit=crop',
    stats: {
      appearances: 26,
      goals: 28,
      assists: 4,
      shotsOnTarget: 56,
      passAccuracy: 78.2,
      minutesPlayed: 2280,
      rating: 8.12
    },
    career: [
      { season: '2024/25', club: 'Manchester City', apps: 32, goals: 27, assists: 5 },
      { season: '2023/24', club: 'Manchester City', apps: 31, goals: 27, assists: 5 },
      { season: '2022/23', club: 'Manchester City', apps: 35, goals: 36, assists: 8 }
    ]
  },
  {
    id: 'debruyne',
    name: 'Kevin De Bruyne',
    teamId: 'mancity',
    teamName: 'Manchester City',
    position: 'Central Midfielder',
    number: 17,
    nationality: 'Belgian',
    flag: '🇧🇪',
    age: 34,
    height: '181 cm',
    weight: '75 kg',
    preferredFoot: 'Right',
    value: '€50M',
    photo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=250&auto=format&fit=crop',
    stats: {
      appearances: 18,
      goals: 4,
      assists: 14,
      shotsOnTarget: 18,
      passAccuracy: 86.4,
      minutesPlayed: 1420,
      rating: 7.90
    },
    career: [
      { season: '2024/25', club: 'Manchester City', apps: 24, goals: 6, assists: 13 },
      { season: '2023/24', club: 'Manchester City', apps: 18, goals: 4, assists: 10 },
      { season: '2022/23', club: 'Manchester City', apps: 32, goals: 7, assists: 16 }
    ]
  },

  // Real Madrid
  {
    id: 'mbappe',
    name: 'Kylian Mbappé',
    teamId: 'realmadrid',
    teamName: 'Real Madrid',
    position: 'Forward',
    number: 9,
    nationality: 'French',
    flag: '🇫🇷',
    age: 27,
    height: '178 cm',
    weight: '75 kg',
    preferredFoot: 'Right',
    value: '€180M',
    photo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=250&auto=format&fit=crop',
    stats: {
      appearances: 25,
      goals: 22,
      assists: 6,
      shotsOnTarget: 48,
      passAccuracy: 84.1,
      minutesPlayed: 2150,
      rating: 8.01
    },
    career: [
      { season: '2024/25', club: 'Real Madrid', apps: 34, goals: 24, assists: 8 },
      { season: '2023/24', club: 'PSG', apps: 29, goals: 27, assists: 7 },
      { season: '2022/23', club: 'PSG', apps: 34, goals: 29, assists: 5 }
    ]
  },
  {
    id: 'vinicius',
    name: 'Vinícius Júnior',
    teamId: 'realmadrid',
    teamName: 'Real Madrid',
    position: 'Left Winger',
    number: 7,
    nationality: 'Brazilian',
    flag: '🇧🇷',
    age: 25,
    height: '176 cm',
    weight: '73 kg',
    preferredFoot: 'Right',
    value: '€160M',
    photo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=250&auto=format&fit=crop',
    stats: {
      appearances: 26,
      goals: 15,
      assists: 11,
      shotsOnTarget: 39,
      passAccuracy: 81.3,
      minutesPlayed: 2220,
      rating: 7.98
    },
    career: [
      { season: '2024/25', club: 'Real Madrid', apps: 31, goals: 17, assists: 9 },
      { season: '2023/24', club: 'Real Madrid', apps: 26, goals: 15, assists: 5 },
      { season: '2022/23', club: 'Real Madrid', apps: 33, goals: 10, assists: 9 }
    ]
  },

  // Barcelona
  {
    id: 'yamal',
    name: 'Lamine Yamal',
    teamId: 'barcelona',
    teamName: 'Barcelona',
    position: 'Right Winger',
    number: 19,
    nationality: 'Spanish',
    flag: '🇪🇸',
    age: 18,
    height: '180 cm',
    weight: '69 kg',
    preferredFoot: 'Left',
    value: '€150M',
    photo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=250&auto=format&fit=crop',
    stats: {
      appearances: 27,
      goals: 11,
      assists: 14,
      shotsOnTarget: 29,
      passAccuracy: 85.0,
      minutesPlayed: 2190,
      rating: 7.92
    },
    career: [
      { season: '2024/25', club: 'Barcelona', apps: 37, goals: 7, assists: 9 },
      { season: '2023/24', club: 'Barcelona', apps: 37, goals: 5, assists: 5 }
    ]
  },
  {
    id: 'lewandowski',
    name: 'Robert Lewandowski',
    teamId: 'barcelona',
    teamName: 'Barcelona',
    position: 'Striker',
    number: 9,
    nationality: 'Polish',
    flag: '🇵🇱',
    age: 37,
    height: '185 cm',
    weight: '81 kg',
    preferredFoot: 'Right',
    value: '€15M',
    photo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=250&auto=format&fit=crop',
    stats: {
      appearances: 25,
      goals: 19,
      assists: 3,
      shotsOnTarget: 41,
      passAccuracy: 77.8,
      minutesPlayed: 2020,
      rating: 7.55
    },
    career: [
      { season: '2024/25', club: 'Barcelona', apps: 35, goals: 19, assists: 3 },
      { season: '2023/24', club: 'Barcelona', apps: 35, goals: 19, assists: 8 },
      { season: '2022/23', club: 'Barcelona', apps: 34, goals: 23, assists: 7 }
    ]
  }
];

export const MATCHES = [
  // Live Match
  {
    id: 'm1',
    leagueId: 'pl',
    leagueName: 'Premier League',
    status: 'live',
    minute: 74,
    homeTeam: { id: 'arsenal', name: 'Arsenal', logo: '🔴', score: 2, xG: 1.84 },
    awayTeam: { id: 'mancity', name: 'Manchester City', logo: '🩵', score: 1, xG: 1.12 },
    possession: { home: 48, away: 52 },
    shots: { home: { total: 12, onTarget: 6 }, away: { total: 9, onTarget: 3 } },
    corners: { home: 5, away: 4 },
    fouls: { home: 8, away: 11 },
    cards: { home: { yellow: 1, red: 0 }, away: { yellow: 3, red: 0 } },
    events: [
      { type: 'goal', minute: 23, team: 'home', player: 'Bukayo Saka', assist: 'M. Ødegaard', detail: 'Stunning left-foot strike' },
      { type: 'yellow', minute: 31, team: 'away', player: 'Rodri', detail: 'Tactical foul' },
      { type: 'goal', minute: 48, team: 'away', player: 'Erling Haaland', assist: 'K. De Bruyne', detail: 'Header from close range' },
      { type: 'yellow', minute: 54, team: 'away', player: 'Rúben Dias', detail: 'Argument with referee' },
      { type: 'goal', minute: 67, team: 'home', player: 'Kai Havertz', assist: 'Declan Rice', detail: 'Tap-in after rebound' },
      { type: 'yellow', minute: 70, team: 'home', player: 'Gabriel Magalhães', detail: 'Foul on Haaland' }
    ],
    lineups: {
      home: {
        formation: '4-3-3',
        starting: [
          { name: 'David Raya', number: 22, position: 'GK' },
          { name: 'Ben White', number: 4, position: 'DF' },
          { name: 'William Saliba', number: 2, position: 'DF' },
          { name: 'Gabriel Magalhães', number: 6, position: 'DF' },
          { name: 'Jurriën Timber', number: 12, position: 'DF' },
          { name: 'Declan Rice', number: 41, position: 'MF' },
          { name: 'Thomas Partey', number: 5, position: 'MF' },
          { name: 'Martin Ødegaard', number: 8, position: 'MF' },
          { name: 'Bukayo Saka', number: 7, position: 'FW' },
          { name: 'Kai Havertz', number: 29, position: 'FW' },
          { name: 'Gabriel Martinelli', number: 11, position: 'FW' }
        ]
      },
      away: {
        formation: '4-2-3-1',
        starting: [
          { name: 'Ederson', number: 31, position: 'GK' },
          { name: 'Kyle Walker', number: 2, position: 'DF' },
          { name: 'Manuel Akanji', number: 25, position: 'DF' },
          { name: 'Rúben Dias', number: 3, position: 'DF' },
          { name: 'Josko Gvardiol', number: 24, position: 'DF' },
          { name: 'Rodri', number: 16, position: 'MF' },
          { name: 'Mateo Kovacic', number: 8, position: 'MF' },
          { name: 'Bernardo Silva', number: 20, position: 'MF' },
          { name: 'Kevin De Bruyne', number: 17, position: 'MF' },
          { name: 'Phil Foden', number: 47, position: 'MF' },
          { name: 'Erling Haaland', number: 9, position: 'FW' }
        ]
      }
    }
  },

  // Upcoming Match
  {
    id: 'm2',
    leagueId: 'laliga',
    leagueName: 'La Liga',
    status: 'upcoming',
    date: 'Today, 21:00',
    timestamp: '2026-07-10T21:00:00Z',
    homeTeam: { id: 'realmadrid', name: 'Real Madrid', logo: '⚪', score: null, xG: null },
    awayTeam: { id: 'barcelona', name: 'Barcelona', logo: '🔵🔴', score: null, xG: null },
    venue: 'Santiago Bernabéu, Madrid',
    referee: 'Jesús Gil Manzano',
    prediction: { homeWin: 42, draw: 28, awayWin: 30 }
  },

  // Finished Match
  {
    id: 'm3',
    leagueId: 'bundesliga',
    leagueName: 'Bundesliga',
    status: 'finished',
    date: 'Yesterday',
    homeTeam: { id: 'bayern', name: 'Bayern Munich', logo: '🔴⚪', score: 3, xG: 2.45 },
    awayTeam: { id: 'dortmund', name: 'Borussia Dortmund', logo: '🟡⚫', score: 1, xG: 1.05 },
    possession: { home: 61, away: 39 },
    shots: { home: { total: 18, onTarget: 8 }, away: { total: 8, onTarget: 3 } },
    corners: { home: 7, away: 2 },
    fouls: { home: 10, away: 12 },
    cards: { home: { yellow: 1, red: 0 }, away: { yellow: 2, red: 0 } },
    events: [
      { type: 'goal', minute: 14, team: 'home', player: 'Harry Kane', assist: 'Jamal Musiala', detail: 'Volley' },
      { type: 'goal', minute: 38, team: 'home', player: 'Jamal Musiala', assist: 'Leroy Sané', detail: 'Solo run and finish' },
      { type: 'goal', minute: 61, team: 'away', player: 'Serhou Guirassy', assist: 'Julian Brandt', detail: 'Header' },
      { type: 'goal', minute: 89, team: 'home', player: 'Thomas Müller', assist: 'Kane', detail: 'Late counter goal' }
    ]
  },
  {
    id: 'm4',
    leagueId: 'pl',
    leagueName: 'Premier League',
    status: 'upcoming',
    date: 'Tomorrow, 15:00',
    timestamp: '2026-07-11T15:00:00Z',
    homeTeam: { id: 'liverpool', name: 'Liverpool', logo: '🔴', score: null, xG: null },
    awayTeam: { id: 'chelsea', name: 'Chelsea', logo: '🔵', score: null, xG: null },
    venue: 'Anfield, Liverpool',
    prediction: { homeWin: 55, draw: 25, awayWin: 20 }
  }
];

export const NEWS = [
  {
    id: 'n1',
    title: 'Tactical Analysis: How Arteta neutralized Man City press',
    summary: 'An in-depth breakdown of Arsenals tactical setup in the title decider.',
    content: 'Mikel Arteta deployed a narrow mid-block that forced Manchester City out wide. By using Declan Rice to track Kevin De Bruyne, and keeping Gabriel and Saliba physically tight on Erling Haaland, the Gunners disrupted Citys central channels. In possession, Martin Ødegaards rapid transition distribution to Bukayo Saka created multiple 1v1 opportunities against Josko Gvardiol...',
    date: '2 hours ago',
    reads: '12K reads',
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 'n2',
    title: 'Kylian Mbappé hits 20 goals in La Liga',
    summary: 'The French superstar has reached another milestone in record time.',
    content: 'Kylian Mbappé scored a penalty and a superb individual goal to take his tally to 22 goals in just 25 appearances. Manager Carlo Ancelotti praised his work rate: "Kylian is not just a goalscorer, he drops deep, connects the lines, and frees up space for Vinícius on the left wing. This is the version of him we always wanted to see."',
    date: '5 hours ago',
    reads: '25K reads',
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 'n3',
    title: 'Transfer Rumors: Wirtz to Real Madrid or Man City?',
    summary: 'Florian Wirtz is the subject of a massive transfer war in the upcoming window.',
    content: 'Bayer Leverkusen playmaker Florian Wirtz is valued at over €130M. Reports suggest Real Madrid are leading the race to sign the German prodigy as a long-term successor to Luka Modrić. However, Pep Guardiola is reportedly pushing Manchester City board to sign Wirtz to add creativity to their midfield line.',
    date: '1 day ago',
    reads: '45K reads',
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop'
  }
];

export const TRANSFERS = [
  { id: 't1', player: 'Florian Wirtz', position: 'Attacking Midfielder', fromClub: 'Bayer Leverkusen', toClub: 'Real Madrid', fee: '€135M', status: 'Rumor', confidence: 78, date: 'Today' },
  { id: 't2', player: 'Victor Osimhen', position: 'Striker', fromClub: 'Napoli', toClub: 'Chelsea', fee: '€95M', status: 'Here We Go', confidence: 95, date: 'Yesterday' },
  { id: 't3', player: 'Bruno Guimarães', position: 'Defensive Midfielder', fromClub: 'Newcastle', toClub: 'Manchester City', fee: '€105M', status: 'Done Deal', confidence: 100, date: '2 days ago' },
  { id: 't4', player: 'Alphonso Davies', position: 'Left Back', fromClub: 'Bayern Munich', toClub: 'Real Madrid', fee: 'Free Transfer', status: 'Done Deal', confidence: 100, date: '3 days ago' },
  { id: 't5', player: 'Alexander Isak', position: 'Striker', fromClub: 'Newcastle', toClub: 'Arsenal', fee: '€110M', status: 'Rumor', confidence: 45, date: '5 days ago' }
];

export const NOTIFICATIONS = [
  { id: 'nt1', type: 'match', title: 'Goal Alert! Arsenal 2 - 1 Man City', message: 'Kai Havertz scores a rebound in the 67th minute!', time: '10 min ago', read: false },
  { id: 'nt2', type: 'transfer', title: 'Here We Go! Osimhen to Chelsea', message: 'Agreement reached on personal terms. Fee around €95M.', time: '1 hour ago', read: false },
  { id: 'nt3', type: 'match', title: 'Match Starting Soon', message: 'El Clásico: Real Madrid vs Barcelona starts in 6 hours.', time: '6 hours ago', read: true },
  { id: 'nt4', type: 'news', title: 'New Tactical Analysis Available', message: 'How Arteta neutralized Man City press is now live.', time: '1 day ago', read: true }
];

// Predefined AI response logic for interactive chat
export const AI_RESPONSES = {
  default: "I'm your **Football Copilot**. I can help you analyze player statistics, tactical lineups, match metrics, and provide transfer analysis. Try asking: \n- *Analyze Arsenal vs Manchester City tactically.*\n- *Compare Haaland and Saka metrics.*\n- *Provide scouting options for a deep-lying playmaker.*",
  tactical: "### Tactical Breakdown: Arsenal 2-1 Manchester City\n\n#### 1. Mid-Block Stability\nArsenal utilized a compact **4-4-2 defensive shape** out of possession. Martin Ødegaard and Kai Havertz blockaded passes into Rodri, forcing Manchester City to funnel attacks wide into Akanji or Walker, who lacked vertical penetration.\n\n#### 2. Declan Rice Role\nRice acted as a hybrid box-to-box midfielder, dropping into a back-three out of possession to support Gabriel and Saliba against Haaland, and then pushing forward to assist transitions.\n\n```\nArsenal Defense Layout:\n     [Gabriel]     [Saliba]\n          \\  [Rice]  /\n[Timber]   \\        /   [White]\n```\n\n#### 3. Transition xG Analysis\n- **Arsenal transition xG**: 1.15 (Direct counter attacks via Saka/Martinelli)\n- **City set-piece xG**: 0.45\n- **Verdict**: Arsenal deserved the win based on creating high-quality, high-speed vertical transitions.",
  scouting: "### Scouting Report: Deep-Lying Playmakers (DLP)\n\nHere are three premium targets to fit a possession-oriented structure:\n\n| Player | Current Club | Key Strength | Market Value | Fit Rating |\n| :--- | :--- | :--- | :--- | :--- |\n| **Martin Zubimendi** | Real Sociedad | Interception/Press escape | €60M | 9.5/10 |\n| **João Neves** | PSG | High-volume passing | €85M | 9.0/10 |\n| **Joey Veerman** | PSV Eindhoven | Long ball accuracy | €40M | 8.2/10 |\n\n*Recommendation*: **Martin Zubimendi** represents the highest cost-to-benefit ratio. His press-resistance profile mimics Sergio Busquets, with an 89.4% pass accuracy under pressure."
};
