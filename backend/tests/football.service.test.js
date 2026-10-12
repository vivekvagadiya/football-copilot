const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  getTeamRating,
  calculateWinProbabilities,
  resolveExpectedGoals,
  mapMatch,
  mapTransfer,
} = require("../services/football.service");

describe("Football Service - Business Logic & Predictive Models", () => {
  describe("Team Rating Lookup", () => {
    it("should recognize top tier clubs and return their expected Elo ratings", () => {
      const cityRating = getTeamRating({ name: "Manchester City", shortName: "Man City" });
      const realRating = getTeamRating({ name: "Real Madrid", shortName: "Real Madrid" });
      const arsenalRating = getTeamRating({ name: "Arsenal FC", shortName: "Arsenal" });

      assert.equal(cityRating, 1960);
      assert.equal(realRating, 1980);
      assert.equal(arsenalRating, 1930);
    });

    it("should return the baseline rating (1600) for unlisted or generic teams", () => {
      const defaultRating = getTeamRating({ name: "Unknown United", shortName: "Unknown" });
      assert.equal(defaultRating, 1600);
    });

    it("should handle null or empty team objects gracefully", () => {
      assert.equal(getTeamRating(null), 1600);
      assert.equal(getTeamRating({}), 1600);
    });
  });

  describe("Win Probabilities Model (Bivariate Poisson)", () => {
    it("should calculate probabilities that sum to exactly 100%", () => {
      const homeTeam = { name: "Arsenal", shortName: "Arsenal" };
      const awayTeam = { name: "Chelsea", shortName: "Chelsea" };
      const prediction = calculateWinProbabilities({}, homeTeam, awayTeam);

      assert.ok(prediction);
      assert.equal(typeof prediction.homeWin, "number");
      assert.equal(typeof prediction.draw, "number");
      assert.equal(typeof prediction.awayWin, "number");
      assert.equal(prediction.homeWin + prediction.draw + prediction.awayWin, 100);
    });

    it("should clearly label Poisson model predictions as demo estimates with disclaimer", () => {
      const homeTeam = { name: "Liverpool", shortName: "Liverpool" };
      const awayTeam = { name: "Everton", shortName: "Everton" };
      const prediction = calculateWinProbabilities({}, homeTeam, awayTeam);

      assert.equal(prediction.isDemoEstimate, true);
      assert.equal(prediction.model, "Bivariate Poisson Goal Expectancy");
      assert.equal(prediction.label, "Demo Estimate");
      assert.ok(prediction.disclaimer.includes("Demo estimate"));
      assert.ok(prediction.expectedGoals.home > 0);
      assert.ok(prediction.expectedGoals.away > 0);
    });

    it("should reflect home advantage for evenly matched teams", () => {
      // Two teams with identical baseline ratings
      const homeTeam = { name: "Aston Villa", shortName: "Aston Villa" };
      const awayTeam = { name: "Tottenham Hotspur", shortName: "Tottenham" };
      const prediction = calculateWinProbabilities({}, homeTeam, awayTeam);

      // Home team should have higher win probability than away team due to +75 Elo home edge
      assert.ok(
        prediction.homeWin > prediction.awayWin,
        `Expected homeWin (${prediction.homeWin}) > awayWin (${prediction.awayWin})`
      );
    });

    it("should give overwhelming probability to strong home favorites", () => {
      const homeTeam = { name: "Manchester City", shortName: "Man City" };
      const awayTeam = { name: "Southampton", shortName: "Southampton" };
      const prediction = calculateWinProbabilities({}, homeTeam, awayTeam);

      assert.ok(prediction.homeWin >= 70, `Expected Man City home win >= 70%, got ${prediction.homeWin}%`);
      assert.ok(prediction.awayWin < 15, `Expected Southampton away win < 15%, got ${prediction.awayWin}%`);
    });

    it("should use and normalize bookmaker market odds when provided in match payload", () => {
      const matchWithOdds = {
        odds: {
          homeWin: 2.0, // 50%
          draw: 3.5,    // 28.5%
          awayWin: 4.0, // 25%
        },
      };
      const prediction = calculateWinProbabilities(matchWithOdds, { name: "Team A" }, { name: "Team B" });

      assert.equal(prediction.isDemoEstimate, false);
      assert.equal(prediction.model, "Market Odds Implied Probability");
      assert.equal(prediction.label, "Official Market Odds");
      assert.equal(prediction.homeWin + prediction.draw + prediction.awayWin, 100);
      assert.ok(prediction.homeWin > prediction.awayWin);
    });
  });

  describe("Expected Goals (xG) Resolution", () => {
    it("should return null xG for upcoming matches", () => {
      const result = resolveExpectedGoals({}, null, null, true, null);
      assert.equal(result.homeXG, null);
      assert.equal(result.awayXG, null);
      assert.equal(result.isDemoEstimate, false);
    });

    it("should prioritize official provider xG when provided in match statistics", () => {
      const matchWithProviderXg = {
        homeTeam: { xG: 2.14 },
        awayTeam: { xG: 0.82 },
      };
      const result = resolveExpectedGoals(matchWithProviderXg, 2, 0, false, 90);

      assert.equal(result.homeXG, 2.14);
      assert.equal(result.awayXG, 0.82);
      assert.equal(result.isDemoEstimate, false);
      assert.equal(result.source, "provider");
      assert.equal(result.label, "Official Tracking");
    });

    it("should generate a realistic, clearly labeled demo estimate when provider xG is absent", () => {
      const matchWithoutXg = {};
      const result = resolveExpectedGoals(matchWithoutXg, 3, 1, false, 90);

      assert.equal(typeof result.homeXG, "number");
      assert.equal(typeof result.awayXG, "number");
      assert.equal(result.isDemoEstimate, true);
      assert.equal(result.source, "demo_estimate");
      assert.equal(result.label, "Demo Estimate");
      // 3 goals scored should produce higher chance-quality xG than 1 goal
      assert.ok(result.homeXG > result.awayXG);
    });

    it("should scale in-progress live match demo xG according to elapsed minute", () => {
      const matchWithoutXg = {};
      const earlyMatch = resolveExpectedGoals(matchWithoutXg, 0, 0, false, 15);
      const halfTimeMatch = resolveExpectedGoals(matchWithoutXg, 0, 0, false, 45);

      assert.ok(halfTimeMatch.homeXG > earlyMatch.homeXG);
      assert.ok(halfTimeMatch.awayXG > earlyMatch.awayXG);
    });
  });

  describe("Match Mapping (mapMatch)", () => {
    it("should correctly map a finished match with score and demo xG metadata", () => {
      const rawMatch = {
        id: 104231,
        status: "FINISHED",
        utcDate: "2026-10-12T15:00:00Z",
        score: {
          fullTime: { home: 2, away: 1 },
        },
        homeTeam: { id: 57, name: "Arsenal FC", shortName: "Arsenal" },
        awayTeam: { id: 61, name: "Chelsea FC", shortName: "Chelsea" },
        competition: { code: "PL", name: "Premier League" },
      };

      const mapped = mapMatch(rawMatch);

      assert.equal(mapped.id, "104231");
      assert.equal(mapped.status, "FINISHED");
      assert.equal(mapped.homeTeam.score, 2);
      assert.equal(mapped.awayTeam.score, 1);
      assert.equal(typeof mapped.homeTeam.xG, "number");
      assert.equal(typeof mapped.awayTeam.xG, "number");
      assert.equal(mapped.homeTeam.isDemoEstimate, true);
      assert.equal(mapped.awayTeam.isDemoEstimate, true);
      assert.equal(mapped.prediction, null); // Upcoming only
      assert.equal(mapped.xGSummary.isDemoEstimate, true);
    });

    it("should correctly map an upcoming match with Poisson win probabilities", () => {
      const rawMatch = {
        id: "20456",
        status: "TIMED",
        utcDate: "2026-10-15T20:00:00Z",
        homeTeam: { id: 86, name: "Real Madrid CF", shortName: "Real Madrid" },
        awayTeam: { id: 81, name: "FC Barcelona", shortName: "Barcelona" },
        competition: { code: "PD", name: "La Liga" },
      };

      const mapped = mapMatch(rawMatch);

      assert.equal(mapped.status, "SCHEDULED");
      assert.equal(mapped.homeTeam.score, null);
      assert.equal(mapped.awayTeam.score, null);
      assert.equal(mapped.homeTeam.xG, null);
      assert.equal(mapped.awayTeam.xG, null);
      assert.ok(mapped.prediction);
      assert.equal(mapped.prediction.isDemoEstimate, true);
      assert.equal(mapped.prediction.label, "Demo Estimate");
      assert.equal(mapped.prediction.homeWin + mapped.prediction.draw + mapped.prediction.awayWin, 100);
    });

    it("should return null when match input is falsy", () => {
      assert.equal(mapMatch(null), null);
      assert.equal(mapMatch(undefined), null);
    });
  });

  describe("Transfer Mapping (mapTransfer)", () => {
    it("should format disclosed fee and done deal status", () => {
      const rawTransfer = {
        playerId: "p100",
        name: "Declan Rice",
        fromClub: "West Ham",
        toClub: "Arsenal",
        fee: { feeText: "€116.6M" },
        onLoan: false,
      };

      const mapped = mapTransfer(rawTransfer, 0);

      assert.equal(mapped.player, "Declan Rice");
      assert.equal(mapped.fee, "€116.6M");
      assert.equal(mapped.status, "Done Deal");
    });

    it("should format loans and estimated market values", () => {
      const rawTransfer = {
        playerId: "p101",
        name: "Jadon Sancho",
        fromClub: "Man Utd",
        toClub: "Chelsea",
        amountEuroEstimated: 25000000,
        onLoan: true,
      };

      const mapped = mapTransfer(rawTransfer, 1);

      assert.equal(mapped.fee, "€25.0M");
      assert.equal(mapped.status, "On Loan");
    });
  });
});
