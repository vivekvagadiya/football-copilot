import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Info, Calendar, Users, BarChart2, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { apiService } from '../../services/apiService';
import { Loading } from '../../components/ui/Loading';
import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { FixtureCard } from '../../components/football/FixtureCard';
import { useApp } from '../../context/AppContext';

export const TeamDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('squad');
  const { toggleFavorite, isFavorite } = useApp();

  const isFavorited = isFavorite('teams', id);

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: () => apiService.getTeam(id),
    enabled: !!id
  });

  if (isLoading) {
    return <Loading text="Fetching club roster and telemetry charts..." />;
  }

  if (!team) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-muted">Club file could not be retrieved.</p>
        <button onClick={() => navigate('/teams')} className="text-primary hover:underline text-xs font-bold">Back to Clubs</button>
      </div>
    );
  }

  const { name, logo, cover, manager, stadium, founded, rank, points, form, players = [], fixtures = [], stats = {} } = team;

  const tabOptions = [
    { id: 'squad', label: 'Squad Roster' },
    { id: 'fixtures', label: 'Fixtures & Schedule' },
    { id: 'stats', label: 'Club Statistics' }
  ];

  // Recharts Chart datasets
  const chartData = [
    { name: 'Goals Scored', value: stats.goalsScored || 0 },
    { name: 'Goals Conceded', value: stats.goalsConceded || 0 },
    { name: 'Clean Sheets', value: stats.cleanSheets || 0 }
  ];

  const radarData = [
    { subject: 'Possession %', value: stats.possession || 50, fullMark: 100 },
    { subject: 'Pass Accuracy %', value: stats.passAccuracy || 70, fullMark: 100 },
    { subject: 'Goals Scored x10', value: (stats.goalsScored || 50) / 10, fullMark: 100 },
    { subject: 'Clean Sheets x5', value: (stats.cleanSheets || 10) * 5, fullMark: 100 }
  ];

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <button 
        onClick={() => navigate('/teams')} 
        className="flex items-center gap-1.5 text-xs text-muted hover:text-text transition-colors cursor-pointer font-bold"
      >
        <ChevronLeft size={14} /> Back to Clubs
      </button>

      {/* Hero Cover Card */}
      <div className="relative rounded-2xl overflow-hidden border border-border shadow-md bg-card">
        <img src={cover} alt="Cover image" className="w-full h-40 object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/70 to-transparent" />
        
        {/* Info Overlay */}
        <div className="absolute bottom-4 inset-x-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-5xl bg-card border border-border/80 p-2.5 rounded-xl shadow-lg shrink-0 select-none">
              {logo}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-xl text-text leading-tight">{name}</h2>
                <button
                  onClick={() => toggleFavorite('teams', id)}
                  className={`p-1.5 rounded-full hover:bg-border/30 transition-colors ${
                    isFavorited ? 'text-primary' : 'text-muted hover:text-text'
                  }`}
                >
                  <Star size={14} className={isFavorited ? 'fill-current' : ''} />
                </button>
              </div>
              <p className="text-xs text-muted">Founded in {founded} • Home Ground: {stadium}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-xs">
            <div>
              <span className="text-muted block text-[10px]">Manager</span>
              <strong className="text-text font-semibold">{manager}</strong>
            </div>
            <div className="border-l border-border pl-3">
              <span className="text-muted block text-[10px]">Rank</span>
              <strong className="text-primary font-bold">#{rank} ({points} pts)</strong>
            </div>
          </div>
        </div>
      </div>

      <Tabs tabs={tabOptions} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-4">
        {/* SQUAD ROSTER TAB */}
        {activeTab === 'squad' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.map(p => (
              <Card
                key={p.id}
                onClick={() => navigate(`/player/${p.id}`)}
                className="p-3.5 border border-border hover:border-primary/45 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={p.photo} fallback={p.name[0]} size="md" className="shrink-0 group-hover:scale-105 transition-transform" />
                  <div className="min-w-0">
                    <h5 className="font-bold text-text group-hover:text-primary transition-colors text-xs truncate">{p.name}</h5>
                    <p className="text-[10px] text-muted">{p.position} • #{p.number}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-primary font-bold font-display">{p.value}</span>
                  <span className="text-[8px] text-muted block">value</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* SCHEDULE TAB */}
        {activeTab === 'fixtures' && (
          <div className="space-y-4">
            {fixtures.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fixtures.map(m => (
                  <FixtureCard key={m.id} match={m} />
                ))}
              </div>
            ) : (
              <Card className="text-center py-12 text-xs text-muted border-dashed border-border">
                No active match logs found for this club.
              </Card>
            )}
          </div>
        )}

        {/* STATISTICS TAB */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recharts Bar chart */}
            <Card className="p-4 border border-border bg-card">
              <h4 className="font-display font-bold text-xs text-text mb-4">Goal Scoring & Defensive Records</h4>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="var(--muted)" fontSize={10} tickLine={false} />
                    <YAxis stroke="var(--muted)" fontSize={10} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                      labelStyle={{ color: 'var(--text)', fontSize: 11, fontWeight: 'bold' }}
                      itemStyle={{ color: 'var(--primary)', fontSize: 11 }}
                    />
                    <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={35} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Recharts Radar chart */}
            <Card className="p-4 border border-border bg-card flex flex-col items-center">
              <h4 className="font-display font-bold text-xs text-text self-start mb-4">Attribute Matrix Profile</h4>
              <div className="h-56 w-full flex justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="subject" stroke="var(--muted)" fontSize={9} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="var(--border)" fontSize={8} />
                    <Radar name={name} dataKey="value" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.25} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                      itemStyle={{ color: 'var(--primary)', fontSize: 11 }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
export default TeamDetails;
