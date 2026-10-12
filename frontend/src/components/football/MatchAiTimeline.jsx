import React, { useState } from 'react';
import { Sparkles, Activity, Flame, ShieldAlert, ArrowRightLeft, Clock, Zap, Filter, Award } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

export const MatchAiTimeline = ({ events = [], aiTimeline = null, isLoading = false, homeTeam, awayTeam, status }) => {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'turning-points', 'goals', 'cards'

  const turningPoints = aiTimeline?.turningPoints || [];
  const keyPhases = aiTimeline?.keyPhases || [];
  const verdict = aiTimeline?.overallTacticalVerdict;
  const tacticalTrends = aiTimeline?.tacticalTrends || [];

  // Map events and enrich with AI turning point intelligence
  const enrichedEvents = events.map((ev, index) => {
    // Find if this event matches a turning point
    const matchingTp = turningPoints.find(
      (tp) => Math.abs(tp.minute - ev.minute) <= 2 || (tp.player && ev.player && tp.player.toLowerCase().includes(ev.player.toLowerCase().split(' ')[0]))
    );
    return {
      ...ev,
      id: `ev-${index}`,
      isTurningPoint: !!matchingTp,
      tacticalContext: matchingTp?.tacticalContext,
      badge: matchingTp?.badge || (ev.type === 'goal' ? '🔥 Game Changer' : null),
      impact: matchingTp?.impact || (ev.type === 'goal' ? 'HIGH' : 'MEDIUM'),
      momentumShift: matchingTp?.momentumShift,
    };
  });

  // Filter events based on selected tab/filter
  const filteredEvents = enrichedEvents.filter((ev) => {
    if (activeFilter === 'turning-points') return ev.isTurningPoint || ev.type === 'goal';
    if (activeFilter === 'goals') return ev.type === 'goal';
    if (activeFilter === 'cards') return ev.type?.includes('card');
    return true;
  });

  const getEventIcon = (type, isTurningPoint) => {
    if (type === 'goal') return '⚽';
    if (type === 'redcard' || type === 'red_card') return '🟥';
    if (type === 'card' || type?.includes('yellow')) return '🟨';
    if (type === 'sub' || type === 'substitution') return '🔄';
    if (isTurningPoint) return '⚡';
    return '⏱️';
  };

  return (
    <div className="space-y-6">
      {/* AI Tactical Verdict Banner */}
      <Card className="border border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 p-5 relative overflow-hidden">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/25 text-primary shrink-0 mt-0.5">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                AI Tactical Timeline & Momentum Analysis
              </span>
              {status && (
                <Badge variant={status === 'live' || status === 'LIVE' ? 'live' : 'default'} className="text-[10px]">
                  {status}
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-text/90 leading-relaxed font-medium">
              {isLoading ? (
                <span className="text-muted animate-pulse">Analyzing pitch momentum, tactical adjustments, and decisive turning points...</span>
              ) : verdict ? (
                verdict
              ) : (
                `Tactical action feed synchronized for ${homeTeam?.name || 'Home'} vs ${awayTeam?.name || 'Away'}.`
              )}
            </p>

            {/* Tactical Trends Micro-tags */}
            {tacticalTrends.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
                {tacticalTrends.map((trend, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-[10px] font-medium text-muted bg-card/90 border border-border/60 px-2.5 py-1 rounded-md"
                  >
                    <Activity size={11} className="text-primary" />
                    {trend}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Match Key Phases & Dominance Meter */}
      {keyPhases.length > 0 && (
        <Card className="border border-border/70 p-4 space-y-3 bg-card/60">
          <h4 className="font-display font-bold text-xs text-text flex items-center gap-1.5 border-b border-border/40 pb-2">
            <Zap size={14} className="text-secondary" />
            Match Phases & Tactical Momentum Flow
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {keyPhases.map((phase, idx) => (
              <div
                key={idx}
                className="bg-card border border-border/50 rounded-lg p-3 space-y-2 relative overflow-hidden group hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {phase.phase}
                  </span>
                  <span className="text-[10px] font-bold text-muted truncate max-w-[110px]">
                    {phase.dominantTeam}
                  </span>
                </div>
                <p className="text-[11px] text-text/80 leading-snug line-clamp-3">
                  {phase.summary}
                </p>
                {phase.momentumScore && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[9px] text-muted font-mono">
                      <span>Intensity</span>
                      <span>{phase.momentumScore}%</span>
                    </div>
                    <div className="w-full bg-border/40 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(10, phase.momentumScore))}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filter Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card/40 p-2 rounded-lg border border-border/40">
        <div className="flex items-center gap-1.5 text-xs text-muted font-semibold pl-1">
          <Filter size={13} />
          <span>Timeline View:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-primary text-black font-bold'
                : 'bg-card border border-border text-muted hover:text-text'
            }`}
          >
            All Actions ({enrichedEvents.length})
          </button>
          <button
            onClick={() => setActiveFilter('turning-points')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1 transition-colors cursor-pointer ${
              activeFilter === 'turning-points'
                ? 'bg-secondary text-black font-bold'
                : 'bg-card border border-border text-muted hover:text-text'
            }`}
          >
            <Sparkles size={12} />
            Key Turning Points
          </button>
          <button
            onClick={() => setActiveFilter('goals')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeFilter === 'goals'
                ? 'bg-primary/20 text-primary border border-primary/40'
                : 'bg-card border border-border text-muted hover:text-text'
            }`}
          >
            ⚽ Goals Only
          </button>
          <button
            onClick={() => setActiveFilter('cards')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeFilter === 'cards'
                ? 'bg-primary/20 text-primary border border-primary/40'
                : 'bg-card border border-border text-muted hover:text-text'
            }`}
          >
            🟨 Disciplinary
          </button>
        </div>
      </div>

      {/* Action Events Feed */}
      <Card className="border border-border p-5 space-y-4">
        <h4 className="font-display font-bold text-xs text-text flex items-center justify-between border-b border-border/40 pb-2">
          <span className="flex items-center gap-1.5">
            ⏱️ Minute-by-Minute Action Timeline
          </span>
          <span className="text-[10px] text-muted font-normal">
            Showing {filteredEvents.length} events
          </span>
        </h4>

        <div className="space-y-3">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((e, idx) => (
              <div
                key={e.id || idx}
                className={`flex flex-col sm:flex-row gap-3 text-xs p-3.5 rounded-lg border transition-all ${
                  e.isTurningPoint
                    ? 'bg-primary/5 border-primary/30 shadow-sm'
                    : 'bg-card/40 border-border/30 hover:border-border/60'
                }`}
              >
                {/* Minute & Action Type Column */}
                <div className="flex items-center gap-2.5 sm:w-28 shrink-0">
                  <span className="font-mono font-bold text-primary bg-primary/10 border border-primary/25 px-2 py-0.5 rounded text-center shrink-0 min-w-[38px]">
                    {e.minute}'
                  </span>
                  <span className="text-base select-none">
                    {getEventIcon(e.type, e.isTurningPoint)}
                  </span>
                </div>

                {/* Event Details & AI Tactical Context */}
                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold uppercase text-[10px] text-text">
                      {e.type === 'goal' ? 'GOAL' : e.type?.toUpperCase() || 'ACTION'}
                    </span>
                    <span className="font-bold text-text text-xs sm:text-sm">{e.player}</span>
                    {e.badge && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-secondary/15 text-secondary border border-secondary/30">
                        {e.badge}
                      </span>
                    )}
                  </div>

                  {e.detail && (
                    <p className="text-[11px] text-muted">
                      {e.detail} {e.assist ? `• Assisted by ${e.assist}` : ''}
                    </p>
                  )}

                  {/* AI Tactical Context Card */}
                  {(e.tacticalContext || e.momentumShift) && (
                    <div className="bg-card/90 border border-primary/20 rounded-md p-2.5 mt-2 space-y-1">
                      {e.tacticalContext && (
                        <p className="text-[11px] text-text/90 font-medium flex items-start gap-1.5">
                          <Sparkles size={12} className="text-primary shrink-0 mt-0.5" />
                          <span><strong className="text-primary">Tactical Context:</strong> {e.tacticalContext}</span>
                        </p>
                      )}
                      {e.momentumShift && (
                        <p className="text-[10px] text-muted flex items-center gap-1.5 pl-4">
                          <Activity size={11} className="text-secondary shrink-0" />
                          <span><strong className="text-text">Momentum Impact:</strong> {e.momentumShift}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 space-y-2">
              <Clock className="w-8 h-8 text-muted mx-auto opacity-50" />
              <p className="text-xs text-muted">
                {activeFilter !== 'all'
                  ? 'No events match the selected filter.'
                  : 'Action log is empty. This match has not kicked off yet.'}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
