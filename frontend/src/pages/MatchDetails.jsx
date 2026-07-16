import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Shield, Clock, MapPin, Activity, ListFilter, ClipboardList } from 'lucide-react';
import { apiService } from '../services/apiService';
import { Loading } from '../components/ui/Loading';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';

export const MatchDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: match, isLoading } = useQuery({
    queryKey: ['match', id],
    queryFn: () => apiService.getMatch(id),
    enabled: !!id
  });

  if (isLoading) {
    return <Loading text="Decompressing match stats and lineups..." />;
  }

  if (!match) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-muted">Match statistics could not be loaded.</p>
        <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
      </div>
    );
  }

  const { homeTeam, awayTeam, leagueName, status, minute, events = [], lineups = {}, date } = match;

  const tabOptions = [
    { id: 'overview', label: 'Overview' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'statistics', label: 'Statistics' },
    { id: 'lineups', label: 'Lineups' }
  ];

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-1.5 text-xs text-muted hover:text-text transition-colors cursor-pointer font-bold"
      >
        <ChevronLeft size={14} /> Back to previous view
      </button>

      {/* Main Scoreboard Header */}
      <Card className="border border-border/80 p-6 relative overflow-hidden bg-card">
        {/* Subtle field marks inside card background */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e3528_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="text-[10px] text-primary uppercase font-bold tracking-wider">{leagueName}</div>
          
          <div className="flex items-center justify-center gap-8 sm:gap-12 w-full max-w-lg">
            {/* Home Team */}
            <div className="flex-1 flex flex-col items-center min-w-0">
              <span className="text-4xl leading-none mb-2">{homeTeam.logo}</span>
              <span className="font-display font-bold text-sm sm:text-base text-text truncate w-full">{homeTeam.name}</span>
              {homeTeam.xG && (
                <span className="text-[9px] text-muted font-mono mt-0.5">xG: {homeTeam.xG.toFixed(2)}</span>
              )}
            </div>

            {/* Score box */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-3">
                <span className="font-display font-black text-3xl sm:text-4xl text-text">
                  {status === 'upcoming' ? '-' : homeTeam.score}
                </span>
                <span className="text-muted font-bold text-lg">:</span>
                <span className="font-display font-black text-3xl sm:text-4xl text-text">
                  {status === 'upcoming' ? '-' : awayTeam.score}
                </span>
              </div>
              {status === 'live' ? (
                <Badge variant="live" className="text-[9px] mt-2 px-2 py-0.5">
                  LIVE • {minute}'
                </Badge>
              ) : status === 'finished' ? (
                <Badge variant="outline" className="text-[9px] mt-2 bg-border/20 border-transparent text-muted uppercase font-bold">
                  Finished
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[9px] mt-2 font-medium">
                  {date}
                </Badge>
              )}
            </div>

            {/* Away Team */}
            <div className="flex-1 flex flex-col items-center min-w-0">
              <span className="text-4xl leading-none mb-2">{awayTeam.logo}</span>
              <span className="font-display font-bold text-sm sm:text-base text-text truncate w-full">{awayTeam.name}</span>
              {awayTeam.xG && (
                <span className="text-[9px] text-muted font-mono mt-0.5">xG: {awayTeam.xG.toFixed(2)}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-[10px] text-muted border-t border-border/40 pt-3 w-full max-w-sm justify-center">
            {match.venue && (
              <span className="flex items-center gap-1">
                <MapPin size={11} /> {match.venue}
              </span>
            )}
            {match.referee && (
              <span className="flex items-center gap-1">
                ⚖️ Referee: {match.referee}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs tabs={tabOptions} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Contents */}
      <div className="mt-4">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Prediction / Stats meter */}
            <Card className="md:col-span-2 border border-border p-4 space-y-4">
              <h4 className="font-display font-bold text-xs text-text flex items-center gap-1.5 border-b border-border/40 pb-2">
                <Activity size={14} className="text-muted" /> Live Commentary Feed
              </h4>
              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                {events.length > 0 ? (
                  events.map((e, idx) => (
                    <div key={idx} className="flex gap-3 text-xs leading-relaxed border-l-2 border-border pl-3.5 relative py-1">
                      <span className="absolute -left-1.5 top-2.5 w-3 h-3 rounded-full bg-border flex items-center justify-center font-bold text-[7px] text-white">
                        {e.minute}
                      </span>
                      <div>
                        <div className="font-bold text-text flex items-center gap-1.5">
                          {e.type === 'goal' ? '⚽ Goal! ' : '🟨 Card! '} 
                          <span className="text-muted font-medium">({e.minute}')</span>
                        </div>
                        <p className="text-text/90 mt-0.5">{e.player} - {e.detail}</p>
                        {e.assist && <p className="text-[10px] text-muted mt-0.5">Key contribution assist: {e.assist}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted py-4 text-center">No commentary events recorded. Wait for match kick-off.</p>
                )}
              </div>
            </Card>

            {/* Match Information sidebar */}
            <Card className="border border-border p-4 space-y-4">
              <h4 className="font-display font-bold text-xs text-text border-b border-border/40 pb-2">
                ℹ️ Match Profile
              </h4>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted">Home Win model</span>
                  <span className="font-semibold text-text">{match.prediction ? `${match.prediction.homeWin}%` : '50%'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Draw probability</span>
                  <span className="font-semibold text-text">{match.prediction ? `${match.prediction.draw}%` : '25%'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Away Win model</span>
                  <span className="font-semibold text-text">{match.prediction ? `${match.prediction.awayWin}%` : '25%'}</span>
                </div>
                <div className="border-t border-border/40 pt-3">
                  <p className="text-[10px] text-muted leading-relaxed">
                    Statistical predictions compiled via internal tactical parameters modeling team defensive structures and expected score matrices.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* TIMELINE TAB */}
        {activeTab === 'timeline' && (
          <Card className="border border-border p-5 space-y-4">
            <h4 className="font-display font-bold text-xs text-text flex items-center gap-1.5 border-b border-border/40 pb-2">
              ⏱️ Minute-by-Minute Action Timeline
            </h4>
            <div className="space-y-4">
              {events.length > 0 ? (
                events.map((e, idx) => (
                  <div key={idx} className="flex gap-4 text-xs py-2 border-b border-border/20 last:border-b-0 items-center">
                    <span className="font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded shrink-0">
                      {e.minute}'
                    </span>
                    <div className="flex-1">
                      <span className="font-extrabold uppercase text-[10px] text-text mr-1.5">
                        {e.type === 'goal' ? '⚽ GOAL' : '🟨 YELLOW CARD'}
                      </span>
                      <span className="font-semibold text-text">{e.player}</span>
                      <p className="text-[10px] text-muted mt-0.5">{e.detail} {e.assist ? `• Assisted by ${e.assist}` : ''}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted text-center py-8">Action log is empty. This game has not kicked off.</p>
              )}
            </div>
          </Card>
        )}

        {/* STATISTICS TAB */}
        {activeTab === 'statistics' && (
          <Card className="border border-border p-5 space-y-6">
            <h4 className="font-display font-bold text-xs text-text border-b border-border/40 pb-2">
              📊 Core Telemetry Metrics Comparison
            </h4>
            
            {match.possession ? (
              <div className="space-y-5 text-xs max-w-xl mx-auto">
                {/* Possession Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-semibold">
                    <span>Possession {match.possession.home}%</span>
                    <span>{match.possession.away}% Possession</span>
                  </div>
                  <div className="h-2 bg-border/45 rounded-full overflow-hidden flex">
                    <div className="h-full bg-primary" style={{ width: `${match.possession.home}%` }} />
                    <div className="h-full bg-secondary" style={{ width: `${match.possession.away}%` }} />
                  </div>
                </div>

                {/* Shots Comparison */}
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span>Shots {match.shots?.home.total || 0}</span>
                    <span className="text-muted text-[10px] font-normal">Total Shots</span>
                    <span>{match.shots?.away.total || 0} Shots</span>
                  </div>
                  <div className="h-2 bg-border/45 rounded-full overflow-hidden flex">
                    <div className="h-full bg-primary" style={{ width: `${((match.shots?.home.total || 1) / ((match.shots?.home.total || 1) + (match.shots?.away.total || 1))) * 100}%` }} />
                    <div className="h-full bg-secondary" style={{ width: `${((match.shots?.away.total || 1) / ((match.shots?.home.total || 1) + (match.shots?.away.total || 1))) * 100}%` }} />
                  </div>
                </div>

                {/* Corners */}
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span>Corners {match.corners?.home || 0}</span>
                    <span className="text-muted text-[10px] font-normal">Corners</span>
                    <span>{match.corners?.away || 0} Corners</span>
                  </div>
                  <div className="h-2 bg-border/45 rounded-full overflow-hidden flex">
                    <div className="h-full bg-primary" style={{ width: `${((match.corners?.home || 1) / ((match.corners?.home || 1) + (match.corners?.away || 1))) * 100}%` }} />
                    <div className="h-full bg-secondary" style={{ width: `${((match.corners?.away || 1) / ((match.corners?.home || 1) + (match.corners?.away || 1))) * 100}%` }} />
                  </div>
                </div>

                {/* Cards */}
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span>Yellows {match.cards?.home.yellow || 0}</span>
                    <span className="text-muted text-[10px] font-normal">Cards</span>
                    <span>{match.cards?.away.yellow || 0} Yellows</span>
                  </div>
                  <div className="h-2 bg-border/45 rounded-full overflow-hidden flex">
                    <div className="h-full bg-primary" style={{ width: `${((match.cards?.home.yellow || 1) / ((match.cards?.home.yellow || 1) + (match.cards?.away.yellow || 1))) * 100}%` }} />
                    <div className="h-full bg-secondary" style={{ width: `${((match.cards?.away.yellow || 1) / ((match.cards?.home.yellow || 1) + (match.cards?.away.yellow || 1))) * 100}%` }} />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted text-center py-8">Stats matrices unavailable for upcoming fixtures.</p>
            )}
          </Card>
        )}

        {/* LINEUPS TAB */}
        {activeTab === 'lineups' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual tactical soccer pitch mock */}
            <Card className="lg:col-span-2 border border-border p-4 bg-card flex flex-col items-center">
              <h4 className="font-display font-bold text-xs text-text mb-3 flex items-center gap-1.5 self-start">
                <ClipboardList size={14} /> Tactical Grid Layout ({lineups.home ? lineups.home.formation : '4-3-3'})
              </h4>
              
              {/* CSS Tactical Soccer Field Pitch */}
              <div className="w-full max-w-[420px] aspect-[3/4] bg-emerald-950 border-2 border-border/80 rounded-lg relative overflow-hidden flex flex-col justify-between py-6 px-4">
                {/* Center Circle & Lines */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-border/40" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 border-border/40" />
                
                {/* Home Goalkeeper dot */}
                <div className="flex justify-center">
                  <div className="bg-primary text-[#07120D] text-[9px] font-extrabold w-6 h-6 rounded-full flex items-center justify-center border border-border flex-col relative">
                    GK <span className="absolute top-7 font-sans font-semibold text-[8px] text-white whitespace-nowrap bg-[#0D1B15]/80 px-1 rounded">Raya</span>
                  </div>
                </div>

                {/* Home Defenders row */}
                <div className="flex justify-around">
                  {['Saliba', 'Gabriel', 'Timber'].map((name, idx) => (
                    <div key={idx} className="bg-primary text-[#07120D] text-[9px] font-extrabold w-6 h-6 rounded-full flex items-center justify-center border border-border relative">
                      DF <span className="absolute top-7 font-sans font-semibold text-[8px] text-white whitespace-nowrap bg-[#0D1B15]/80 px-1 rounded">{name}</span>
                    </div>
                  ))}
                </div>

                {/* Midfield row */}
                <div className="flex justify-around">
                  {['Rice', 'Ødegaard'].map((name, idx) => (
                    <div key={idx} className="bg-primary text-[#07120D] text-[9px] font-extrabold w-6 h-6 rounded-full flex items-center justify-center border border-border relative">
                      MF <span className="absolute top-7 font-sans font-semibold text-[8px] text-white whitespace-nowrap bg-[#0D1B15]/80 px-1 rounded">{name}</span>
                    </div>
                  ))}
                </div>

                {/* Forwards row */}
                <div className="flex justify-around">
                  {['Saka', 'Havertz', 'Martinelli'].map((name, idx) => (
                    <div key={idx} className="bg-primary text-[#07120D] text-[9px] font-extrabold w-6 h-6 rounded-full flex items-center justify-center border border-border relative">
                      FW <span className="absolute top-7 font-sans font-semibold text-[8px] text-white whitespace-nowrap bg-[#0D1B15]/80 px-1 rounded">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Tactical Squad list side panel */}
            <Card className="border border-border p-4 space-y-4">
              <h4 className="font-display font-bold text-xs text-text border-b border-border/40 pb-2">
                📋 Roster Breakdown
              </h4>
              {lineups.home ? (
                <div className="space-y-4 text-xs">
                  <div>
                    <h5 className="font-bold text-primary mb-2 flex justify-between">
                      <span>{homeTeam.name} Starting XI</span>
                      <span className="text-[10px] text-muted">{lineups.home.formation}</span>
                    </h5>
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {lineups.home.starting.map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between text-muted hover:text-text py-0.5">
                          <span className="font-medium text-text">{p.name}</span>
                          <span className="text-[9px] bg-border/30 px-1 rounded font-bold uppercase">{p.position} • #{p.number}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-border/40 pt-3">
                    <h5 className="font-bold text-secondary mb-2 flex justify-between">
                      <span>{awayTeam.name} Starting XI</span>
                      <span className="text-[10px] text-muted">{lineups.away.formation}</span>
                    </h5>
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {lineups.away.starting.map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between text-muted hover:text-text py-0.5">
                          <span className="font-medium text-text">{p.name}</span>
                          <span className="text-[9px] bg-border/30 px-1 rounded font-bold uppercase">{p.position} • #{p.number}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted text-center py-8">Lineups not yet submitted by managers.</p>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
export default MatchDetails;
