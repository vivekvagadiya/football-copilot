import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Calendar, Award, Compass, Star, TrendingUp, Sparkles } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { apiService } from '../../services/apiService';
import { Loading } from '../../components/ui/Loading';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { useApp } from '../../context/AppContext';

export const PlayerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('career');
  const { toggleFavorite, isFavorite } = useApp();

  const isFavorited = isFavorite('players', id);

  const { data: player, isLoading } = useQuery({
    queryKey: ['player', id],
    queryFn: () => apiService.getPlayer(id),
    enabled: !!id
  });

  if (isLoading) {
    return <Loading text="Decoding scouting data metrics..." />;
  }

  if (!player) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-muted">Player profile not found in register.</p>
        <button onClick={() => navigate('/players')} className="text-primary hover:underline text-xs font-bold">Back to Players</button>
      </div>
    );
  }

  const { name, position, number, flag, age, height, weight, preferredFoot, value, stats = {}, career = [], team } = player;

  const tabOptions = [
    { id: 'career', label: 'Career History' },
    { id: 'insights', label: 'Scout Insights' }
  ];

  // Scout parameters radar data
  const radarData = [
    { subject: 'Passing', value: stats.passAccuracy || 80, fullMark: 100 },
    { subject: 'Shooting', value: stats.goals > 15 ? 90 : 75, fullMark: 100 },
    { subject: 'Dribbling', value: position.includes('Winger') ? 92 : 82, fullMark: 100 },
    { subject: 'Pace', value: position.includes('Winger') ? 88 : 78, fullMark: 100 },
    { subject: 'Minutes', value: (stats.minutesPlayed / 2500) * 100, fullMark: 100 }
  ];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button 
        onClick={() => navigate('/players')} 
        className="flex items-center gap-1.5 text-xs text-muted hover:text-text transition-colors cursor-pointer font-bold"
      >
        <ChevronLeft size={14} /> Back to Players
      </button>

      {/* Main Profile Header card */}
      <Card className="border border-border/80 p-6 relative overflow-hidden bg-card">
        <div className="absolute top-0 right-0 h-32 w-32 bg-primary/5 rounded-bl-full pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          <Avatar src={player.photo} fallback={name[0]} size="xl" className="shrink-0 border-2 border-primary/25" />
          
          <div className="flex-1 min-w-0 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <h2 className="font-display font-black text-xl text-text leading-tight">{name}</h2>
              <div className="flex justify-center md:justify-start items-center gap-1.5">
                <button
                  onClick={() => toggleFavorite('players', id)}
                  className={`p-1.5 rounded-full hover:bg-border/30 transition-colors ${
                    isFavorited ? 'text-primary' : 'text-muted hover:text-text'
                  }`}
                >
                  <Star size={14} className={isFavorited ? 'fill-current' : ''} />
                </button>
                <Badge variant="default" className="text-[9px] uppercase tracking-wide">
                  #{number}
                </Badge>
              </div>
            </div>

            <p className="text-xs text-muted">
              {position} • {team ? `${team.logo} ${team.name}` : 'Free Agent'}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
              <div className="bg-background/45 p-2 rounded-lg border border-border/25">
                <span className="text-[10px] text-muted block">Nationality</span>
                <span className="font-semibold text-text">{flag} {player.nationality}</span>
              </div>
              <div className="bg-background/45 p-2 rounded-lg border border-border/25">
                <span className="text-[10px] text-muted block">Preferred Foot</span>
                <span className="font-semibold text-text">{preferredFoot}</span>
              </div>
              <div className="bg-background/45 p-2 rounded-lg border border-border/25">
                <span className="text-[10px] text-muted block">Physical Spec</span>
                <span className="font-semibold text-text">{height} / {weight}</span>
              </div>
              <div className="bg-background/45 p-2 rounded-lg border border-border/25">
                <span className="text-[10px] text-muted block">Market Valuation</span>
                <span className="font-semibold text-primary">{value}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card hover={false} className="p-4 border border-border text-center">
          <span className="text-[10px] text-muted block uppercase tracking-wider mb-0.5">Appearances</span>
          <span className="font-display font-extrabold text-lg text-text">{stats.appearances}</span>
        </Card>
        <Card hover={false} className="p-4 border border-border text-center">
          <span className="text-[10px] text-muted block uppercase tracking-wider mb-0.5">Goals</span>
          <span className="font-display font-extrabold text-lg text-primary">{stats.goals}</span>
        </Card>
        <Card hover={false} className="p-4 border border-border text-center">
          <span className="text-[10px] text-muted block uppercase tracking-wider mb-0.5">Assists</span>
          <span className="font-display font-extrabold text-lg text-secondary">{stats.assists}</span>
        </Card>
        <Card hover={false} className="p-4 border border-border text-center">
          <span className="text-[10px] text-muted block uppercase tracking-wider mb-0.5">Copilot Rating</span>
          <span className="font-display font-extrabold text-lg text-primary">{stats.rating?.toFixed(2)}</span>
        </Card>
      </div>

      <Tabs tabs={tabOptions} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-4">
        {/* CAREER HISTORY TAB */}
        {activeTab === 'career' && (
          <Card className="p-4 border border-border bg-card">
            <h4 className="font-display font-bold text-xs text-text mb-3 flex items-center gap-1.5">
              <Calendar size={14} className="text-muted" /> historical Season Statistics
            </h4>
            <div className="overflow-x-auto text-xs">
              <div className="min-w-[500px]">
                <div className="grid grid-cols-5 font-bold text-muted border-b border-border/40 pb-2 mb-2 px-2">
                  <span>Season</span>
                  <span>Club</span>
                  <span className="text-center">Appearances</span>
                  <span className="text-center">Goals</span>
                  <span className="text-center">Assists</span>
                </div>
                {career.map((c, idx) => (
                  <div key={idx} className="grid grid-cols-5 py-2 px-2 hover:bg-border/10 rounded transition-all text-text">
                    <span className="font-medium">{c.season}</span>
                    <span className="font-semibold">{c.club}</span>
                    <span className="text-center">{c.apps}</span>
                    <span className="text-center text-primary font-semibold">{c.goals}</span>
                    <span className="text-center text-secondary font-semibold">{c.assists}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* SCOUT INSIGHTS TAB */}
        {activeTab === 'insights' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4 border border-border bg-card flex flex-col items-center">
              <h4 className="font-display font-bold text-xs text-text self-start mb-4">Attribute Octagon Radar</h4>
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

            <Card className="p-4 border border-border bg-card space-y-4">
              <h4 className="font-display font-bold text-xs text-text flex items-center gap-1.5">
                <Sparkles size={14} className="text-primary" /> Copilot scouting report
              </h4>
              <div className="space-y-3.5 text-xs text-muted leading-relaxed">
                <p>
                  {name} plays as a dynamic **{position}** for **{team?.name}**. In the current campaign, he has participated in **{stats.appearances}** matches, contributing to **{stats.goals}** goals and **{stats.assists}** assists.
                </p>
                <p>
                  His pass escape accuracy stands at **{stats.passAccuracy}%**, suggesting an elite capability to navigate high-press areas. Preferred foot **{preferredFoot}** allows him to drop narrow or expand attacks down the wing channels.
                </p>
                <div className="border-t border-border/40 pt-3 text-[10px] text-muted">
                  Scouting insights automatically compiled based on expected performance parameters (xP) and positional overlays in matches.
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
export default PlayerProfile;
