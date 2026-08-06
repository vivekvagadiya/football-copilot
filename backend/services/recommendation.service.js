const favoriteService = require("./favorite.service");
const footballService = require("./football.service");
const aiService = require("./ai.service");
const logger = require("../config/logger");

/**
 * Service: Generate personalized AI recommendations for a specific user.
 * 
 * @param {string} userId - User MongoDB ObjectId
 * @returns {Promise<Object>} Object containing dynamic briefing, recommended matches, scouting reports, and suggested prompts
 */
const getAIRecommendations = async (userId) => {
  try {
    // 1. Fetch user favorites
    const rawFavorites = await favoriteService.getUserFavoritesService(userId);
    const favorites = rawFavorites.map((fav) => ({
      itemType: fav.itemType,
      externalId: fav.externalId,
      name: fav.meta?.name || "",
      subtitle: fav.meta?.subtitle || "",
    }));

    // 2. Fetch live & upcoming matches (limit to a digestible size for context)
    const liveMatches = await footballService.getLiveMatches();
    const upcomingMatches = await footballService.upcomingMatches(
      undefined, // dateFrom
      undefined, // dateTo
      undefined, // competitions
      15,        // limit
      0,         // offset
      "SCHEDULED"
    );

    const matchesList = [
      ...liveMatches.map((m) => ({
        id: m.id,
        homeTeam: m.homeTeam.name,
        awayTeam: m.awayTeam.name,
        leagueName: m.leagueName,
        status: "LIVE",
        score: `${m.homeTeam.score} - ${m.awayTeam.score}`,
        minute: m.minute,
      })),
      ...upcomingMatches.map((m) => ({
        id: m.id,
        homeTeam: m.homeTeam.name,
        awayTeam: m.awayTeam.name,
        leagueName: m.leagueName,
        status: "UPCOMING",
        date: m.date,
      })),
    ];

    // 3. Fetch trending news (first 10 items)
    const trendingNews = await footballService.getNews(1);
    const newsList = trendingNews.slice(0, 10).map((n) => ({
      id: n.id,
      title: n.title,
      summary: n.summary,
    }));

    // 4. Request Gemini analysis
    logger.info(`[Recommendations] Fetching AI recommendations for user ${userId} with ${favorites.length} favorites`);
    const aiRecommendations = await aiService.generateRecommendationsResponse(
      favorites,
      matchesList,
      newsList
    );

    return aiRecommendations;
  } catch (error) {
    logger.error(`[Recommendations] Error generating recommendations for user ${userId}:`, error);
    
    // Formulate a robust fallback in case of Gemini or parsing failure
    return {
      briefing: "Welcome back! Check out the upcoming fixtures and trending news highlights on your dashboard today.",
      recommendedMatches: [],
      scoutingReport: {
        targetTeam: "Chelsea",
        playerName: "Martin Zubimendi",
        position: "Midfielder",
        marketValue: "€60M",
        fitReasoning: "A top transfer target known for superb press-resistance and defensive positioning who would fit any possession-oriented team.",
      },
      suggestedPrompts: [
        "What are the key tactical matchups in today's games?",
        "Tell me about the top transfer targets this season."
      ],
    };
  }
};

module.exports = {
  getAIRecommendations,
};
