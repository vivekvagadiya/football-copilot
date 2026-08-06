import React from "react";
import { useNavigate } from "react-router-dom";
import { Cpu } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

export const DashboardAiRecommendations = ({ recommendations, liveMatches = [], upcomingMatchesRaw = [] }) => {
  const navigate = useNavigate();

  if (!recommendations) return null;

  return (
    <div className="space-y-4 border-b border-border/40 pb-6">
      <h3 className="font-display font-extrabold text-sm text-text flex items-center gap-1.5">
        <Cpu size={14} className="text-primary animate-pulse" /> Personalized AI Recommendations
      </h3>
      
      <div className="grid grid-cols-1 gap-4">
        {/* Scouting Report Card */}
        {recommendations.scoutingReport && (
          <Card className="p-4 border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                  AI Scouting Report
                </span>
                <span className="text-[10px] font-semibold text-muted">
                  Target: {recommendations.scoutingReport.targetTeam}
                </span>
              </div>
              <h4 className="font-display font-extrabold text-sm text-text">
                {recommendations.scoutingReport.playerName}
              </h4>
              <p className="text-[10px] text-muted mb-2">
                {recommendations.scoutingReport.position} • Value: {recommendations.scoutingReport.marketValue}
              </p>
              <p className="text-[11px] text-muted leading-relaxed">
                {recommendations.scoutingReport.fitReasoning}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border flex justify-end">
              <Button
                variant="secondary"
                size="xs"
                onClick={() => navigate("/ai", { state: { initialPrompt: `Analyze ${recommendations.scoutingReport.playerName}'s tactical fit at ${recommendations.scoutingReport.targetTeam}` } })}
                className="text-[10px] py-1 px-2.5"
              >
                Ask Copilot about this fit
              </Button>
            </div>
          </Card>
        )}

        {/* Match Excitement Watchlist */}
        {recommendations.recommendedMatches && recommendations.recommendedMatches.length > 0 && (
          <Card className="p-4 border border-border bg-card flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded border border-primary/20 self-start mb-2 inline-block">
                AI Recommended Fixture
              </span>
              {(() => {
                const recMatch = recommendations.recommendedMatches[0];
                const matchDetail = [...liveMatches, ...upcomingMatchesRaw].find(m => m.id === recMatch.matchId);
                if (!matchDetail) {
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-muted">Match Watchlist</span>
                        <span className="text-[10px] text-red-500 font-bold bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                          Rating: {recMatch.excitementRating}/10
                        </span>
                      </div>
                      <p className="text-[11px] text-muted leading-relaxed">
                        {recMatch.reason}
                      </p>
                    </div>
                  );
                }
                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-muted truncate max-w-[130px]">
                        {matchDetail.leagueName}
                      </span>
                      <span className="text-[10px] text-red-500 font-bold bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                        Rating: {recMatch.excitementRating}/10
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs font-bold text-text truncate">
                        {matchDetail.homeTeam.name} vs {matchDetail.awayTeam.name}
                      </span>
                      <span className="text-[10px] text-muted font-mono">{matchDetail.date}</span>
                    </div>
                    <p className="text-[11px] text-muted leading-relaxed">
                      {recMatch.reason}
                    </p>
                  </div>
                );
              })()}
            </div>
            <div className="mt-4 pt-3 border-t border-border flex justify-end">
              {recommendations.recommendedMatches[0] && (
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => navigate(`/match/${recommendations.recommendedMatches[0].matchId}`)}
                  className="text-[10px] py-1 px-2.5"
                >
                  View Match Analytics
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Dynamic Suggested Questions Pills */}
      {recommendations.suggestedPrompts && recommendations.suggestedPrompts.length > 0 && (
        <div className="flex flex-col gap-2 pt-1.5">
          <span className="text-[10px] text-muted flex items-center font-semibold">Ask Copilot:</span>
          <div className="flex flex-wrap gap-2">
            {recommendations.suggestedPrompts.map((promptText, index) => (
              <button
                key={index}
                onClick={() => navigate("/ai", { state: { initialPrompt: promptText } })}
                className="text-[10px] bg-background hover:bg-primary/5 hover:border-primary/30 border border-border rounded-full px-3 py-1 text-muted hover:text-primary transition-all cursor-pointer font-medium text-left"
              >
                {promptText}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
