import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../../services/apiService';
import { ScoreCard } from '../../components/football/ScoreCard';
import { Loading } from '../../components/ui/Loading';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Zap, Clock, ShieldAlert } from 'lucide-react';

export const LiveMatches = () => {
  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: apiService.getMatches
  });

  const [liveList, setLiveList] = useState([]);

  // Sync matches list and setup simulated minute incrementing
  useEffect(() => {
    if (matches.length > 0) {
      setLiveList(matches.filter(m => m.status === 'live'));
    }
  }, [matches]);

  // Tick the minutes every 5 seconds to simulate high-fidelity live match feeds
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveList(prevList => 
        prevList.map(m => {
          if (m.minute < 90) {
            const nextMinute = m.minute + 1;
            // Occasional simulated goal event!
            let updatedScore = { ...m };
            if (nextMinute === 78) {
              updatedScore.homeTeam = { ...m.homeTeam, score: m.homeTeam.score + 1, xG: m.homeTeam.xG + 0.35 };
              updatedScore.events = [
                { type: 'goal', minute: 78, team: 'home', player: 'Martin Ødegaard', assist: 'Bukayo Saka', detail: 'Curling left footer' },
                ...m.events
              ];
            }
            return {
              ...updatedScore,
              minute: nextMinute
            };
          }
          return m;
        })
      );
    }, 6000);

    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    return <Loading text="Syncing live broadcast feed..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h2 className="font-display font-extrabold text-lg text-text flex items-center gap-2">
            <Zap size={18} className="text-red-500 fill-current animate-pulse" /> Live Telemetry Matrix
          </h2>
          <p className="text-xs text-muted">Real-time mock matches simulating telemetry feeds, goals, and xG updates.</p>
        </div>
        <Badge variant="live" className="text-[10px] uppercase font-bold py-1 px-3">
          Status: Synchronized
        </Badge>
      </div>

      {liveList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {liveList.map(m => (
            <div key={m.id} className="space-y-4">
              <ScoreCard match={m} />
              
              {/* Telemetry panel for live matches */}
              <Card className="border border-border/80 p-4 space-y-3.5 bg-card/50">
                <h4 className="text-[10px] text-muted uppercase font-bold tracking-wider border-b border-border/40 pb-1.5 flex items-center gap-1.5">
                  <ShieldAlert size={12} /> Match Feed Broadcast
                </h4>
                <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
                  {m.events.map((e, idx) => (
                    <div key={idx} className="flex gap-3 text-xs leading-relaxed">
                      <span className="font-mono text-[10px] text-primary bg-primary/10 px-1 rounded h-fit self-center">
                        {e.minute}'
                      </span>
                      <div>
                        <span className="font-bold text-text">
                          {e.type === 'goal' ? '⚽ Goal! ' : '🟨 Card! '} 
                        </span>
                        <span className="text-text/95">{e.player}</span>
                        {e.assist && <span className="text-muted text-[10px]"> (Assist: {e.assist})</span>}
                        <p className="text-[10px] text-muted">{e.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <Card className="text-center py-16 text-muted text-xs border-dashed border-border space-y-2">
          <Clock size={32} className="mx-auto text-border" />
          <p className="font-semibold text-text">No active games broadcasting.</p>
          <p>Please browse upcoming fixtures to preview prediction models.</p>
        </Card>
      )}
    </div>
  );
};
export default LiveMatches;
