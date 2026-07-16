import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Award, Calendar, ListOrdered, Shield } from 'lucide-react';
import { apiService } from '../services/apiService';
import { Loading } from '../components/ui/Loading';
import { Card } from '../components/ui/Card';
import { Tabs } from '../components/ui/Tabs';
import { FixtureCard } from '../components/football/FixtureCard';

export const LeagueDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('table');

  const { data: league, isLoading } = useQuery({
    queryKey: ['league', id],
    queryFn: () => apiService.getLeague(id),
    enabled: !!id
  });

  if (isLoading) {
    return <Loading text="Decompressing league roster and standings..." />;
  }

  if (!league) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-muted">League profile not found.</p>
        <button onClick={() => navigate('/leagues')} className="text-primary hover:underline text-xs font-bold">Back to Leagues</button>
      </div>
    );
  }

  const { name, logo, country, season, teams = [], matches = [] } = league;

  const tabOptions = [
    { id: 'table', label: 'Standings Table' },
    { id: 'matches', label: 'Match Schedule' }
  ];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button 
        onClick={() => navigate('/leagues')} 
        className="flex items-center gap-1.5 text-xs text-muted hover:text-text transition-colors cursor-pointer font-bold"
      >
        <ChevronLeft size={14} /> Back to Competitions
      </button>

      {/* Header Profile card */}
      <Card className="border border-border/80 p-5 bg-card flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-5xl leading-none">{logo}</span>
          <div>
            <h2 className="font-display font-extrabold text-lg text-text">{name}</h2>
            <p className="text-xs text-muted">{country} • Season {season}</p>
          </div>
        </div>
        <span className="text-xs font-bold font-mono bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-lg shrink-0">
          OS Registered
        </span>
      </Card>

      <Tabs tabs={tabOptions} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-4">
        {/* STANDINGS TABLE TAB */}
        {activeTab === 'table' && (
          <Card className="p-4 border border-border bg-card overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="grid grid-cols-12 text-[10px] font-bold text-muted px-2 border-b border-border/40 pb-2 mb-2">
                <span className="col-span-1">Rank</span>
                <span className="col-span-4">Club Name</span>
                <span className="text-center">Played</span>
                <span className="text-center">Won</span>
                <span className="text-center">Drawn</span>
                <span className="text-center">Lost</span>
                <span className="text-center">GD</span>
                <span className="text-center col-span-2">Form</span>
                <span className="text-center">PTS</span>
              </div>

              {teams.length > 0 ? (
                teams.map((t, idx) => (
                  <div 
                    key={t.id}
                    onClick={() => navigate(`/team/${t.id}`)}
                    className="grid grid-cols-12 text-xs py-2 px-2 hover:bg-border/20 rounded cursor-pointer transition-all items-center"
                  >
                    <span className="col-span-1 font-bold text-muted">{idx + 1}</span>
                    <span className="col-span-4 font-semibold flex items-center gap-2 text-text">
                      <span className="text-lg leading-none">{t.logo}</span>
                      <span>{t.name}</span>
                    </span>
                    <span className="text-center font-medium text-muted">{t.played}</span>
                    <span className="text-center font-medium text-muted">{t.won}</span>
                    <span className="text-center font-medium text-muted">{t.drawn}</span>
                    <span className="text-center font-medium text-muted">{t.lost}</span>
                    <span className="text-center font-medium text-muted">{t.gd > 0 ? `+${t.gd}` : t.gd}</span>
                    
                    {/* Form indicator */}
                    <span className="col-span-2 flex justify-center gap-1">
                      {t.form.map((letter, formIdx) => (
                        <span
                          key={formIdx}
                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold text-[7px] text-white shrink-0 ${
                            letter === 'W'
                              ? 'bg-green-500'
                              : letter === 'D'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                        >
                          {letter}
                        </span>
                      ))}
                    </span>

                    <span className="text-center font-bold text-primary">{t.points}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted text-center py-6">No squad standings found inside database.</p>
              )}
            </div>
          </Card>
        )}

        {/* MATCHES SCHEDULE TAB */}
        {activeTab === 'matches' && (
          <div className="space-y-4">
            {matches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matches.map(m => (
                  <FixtureCard key={m.id} match={m} />
                ))}
              </div>
            ) : (
              <Card className="text-center py-12 text-xs text-muted border-dashed border-border">
                No fixtures found for this tournament schedule.
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default LeagueDetails;
