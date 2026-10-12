import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Sun, Flame, Newspaper, TrendingUp, ChevronDown, ChevronUp, MessageSquare, ArrowRight, Shield } from "lucide-react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

export const DailyBriefingCard = ({ briefingData, isLoading }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);

  if (isLoading) {
    return (
      <Card className="border border-primary/20 bg-gradient-to-r from-card via-card to-primary/5 p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-border/40 rounded w-1/4" />
            <div className="h-3 bg-border/30 rounded w-3/4" />
          </div>
        </div>
      </Card>
    );
  }

  const {
    date = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
    greeting = "Good Day! Here is your 60-second Football Copilot briefing.",
    headline = "High-stakes European matchday unfolds with critical title and top-4 positioning on the line.",
    todayPicks = [],
    topIntel = [],
    statOfTheDay = "Teams utilizing high transition press have generated 28% more expected goals from counter-attacks this season.",
    suggestedPrompt = "What are the most impactful tactical matchups to watch today?"
  } = briefingData || {};

  const handleAskCopilot = (promptText) => {
    navigate("/ai", { state: { initialPrompt: promptText || suggestedPrompt } });
  };

  return (
    <Card className="border border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 p-5 relative overflow-hidden transition-all shadow-md">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/25 text-primary shrink-0 shadow-inner">
            <Sun size={20} className="text-primary animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={12} />
                AI Daily Briefing
              </span>
              <span className="text-[10px] text-muted font-mono bg-border/40 px-2 py-0.5 rounded-full">
                {date}
              </span>
            </div>
            <h3 className="font-display font-bold text-text text-sm sm:text-base mt-0.5">
              {greeting}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-muted hover:text-text gap-1 py-1 px-2.5"
          >
            {isExpanded ? (
              <>
                <span>Collapse</span>
                <ChevronUp size={14} />
              </>
            ) : (
              <>
                <span>Read 60s Digest</span>
                <ChevronDown size={14} />
              </>
            )}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleAskCopilot(suggestedPrompt)}
            className="text-xs font-bold gap-1.5 shadow-sm"
          >
            <MessageSquare size={13} />
            Ask Copilot
          </Button>
        </div>
      </div>

      {/* Main Headline */}
      <div className="pt-3.5 pb-2">
        <p className="text-xs sm:text-sm font-medium text-text/90 leading-relaxed">
          {headline}
        </p>
      </div>

      {/* Expandable Bento Grid */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 mt-2 border-t border-border/30 animate-fade-in">
          {/* Card 1: Today's Must-Watch Fixtures */}
          <div className="bg-card/70 border border-border/50 rounded-xl p-3.5 space-y-2.5 hover:border-primary/30 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text flex items-center gap-1.5">
                <Flame size={14} className="text-secondary" />
                Today's Hot Fixtures
              </span>
              <Badge variant="live" className="text-[9px] px-1.5 py-0.2">
                Top Picks
              </Badge>
            </div>
            <div className="space-y-2">
              {todayPicks.length > 0 ? (
                todayPicks.slice(0, 2).map((pick, idx) => (
                  <div key={idx} className="bg-card border border-border/40 rounded-lg p-2.5 space-y-1">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="truncate max-w-[140px] text-text">{pick.match}</span>
                      <span className="text-[10px] text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded">
                        {pick.time || "Today"}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted leading-tight line-clamp-2">
                      {pick.whyWatch}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-muted py-2">No marquee fixtures scheduled today.</p>
              )}
            </div>
          </div>

          {/* Card 2: Top Intelligence & Headlines */}
          <div className="bg-card/70 border border-border/50 rounded-xl p-3.5 space-y-2.5 hover:border-primary/30 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text flex items-center gap-1.5">
                <Newspaper size={14} className="text-primary" />
                Key Intel & Rumors
              </span>
              <span className="text-[10px] text-muted font-mono">Digest</span>
            </div>
            <div className="space-y-2">
              {topIntel.length > 0 ? (
                topIntel.slice(0, 2).map((intel, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-card border border-border/40 rounded-lg p-2.5">
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase shrink-0 mt-0.5 bg-secondary/15 text-secondary border border-secondary/30">
                      {intel.tag || "INTEL"}
                    </span>
                    <p className="text-[11px] text-text/85 leading-snug line-clamp-2">
                      {intel.text}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-muted py-2">Transfer and squad intel synchronizing...</p>
              )}
            </div>
          </div>

          {/* Card 3: Stat & Tactical Fact of the Day */}
          <div className="bg-card/70 border border-border/50 rounded-xl p-3.5 space-y-2.5 flex flex-col justify-between hover:border-primary/30 transition-colors">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-primary" />
                  Stat of the Day
                </span>
                <span className="text-[10px] text-primary font-bold">Tactical</span>
              </div>
              <p className="text-[11px] text-text/90 font-medium mt-2 leading-relaxed bg-primary/5 border border-primary/15 rounded-lg p-2.5">
                "{statOfTheDay}"
              </p>
            </div>

            <button
              onClick={() => handleAskCopilot(suggestedPrompt)}
              className="text-[10px] text-primary hover:text-primary/80 font-bold flex items-center justify-between pt-1 group cursor-pointer"
            >
              <span>{suggestedPrompt || "Ask Copilot for tactical breakdown"}</span>
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};
