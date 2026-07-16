import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/apiService';
import { FixtureCard } from '../components/football/FixtureCard';
import { Loading } from '../components/ui/Loading';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CalendarRange, Filter } from 'lucide-react';

export const Fixtures = () => {
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'live', 'upcoming', 'finished'
  const [leagueFilter, setLeagueFilter] = useState('all');

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: apiService.getMatches
  });

  const { data: leagues = [] } = useQuery({
    queryKey: ['leagues'],
    queryFn: apiService.getLeagues
  });

  const filteredMatches = matches.filter(m => {
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    const matchesLeague = leagueFilter === 'all' || m.leagueId === leagueFilter;
    return matchesStatus && matchesLeague;
  });

  if (isLoading) {
    return <Loading text="Fetching match calendar..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-border/40 pb-4">
        <div>
          <h2 className="font-display font-extrabold text-lg text-text flex items-center gap-2">
            <CalendarRange size={18} className="text-primary" /> Football Match Calendar
          </h2>
          <p className="text-xs text-muted">Filter upcoming predictions and finished match analyses across the FOS.</p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-4 bg-card/65 p-3 rounded-xl border border-border/50 text-xs">
        <span className="flex items-center gap-1.5 font-bold text-muted uppercase tracking-wider">
          <Filter size={13} /> Filters:
        </span>
        
        {/* Status Filter buttons */}
        <div className="flex items-center gap-1.5 border-r border-border pr-4">
          {['all', 'live', 'upcoming', 'finished'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wide cursor-pointer transition-colors ${
                statusFilter === s
                  ? 'bg-primary text-[#07120D]'
                  : 'text-muted hover:text-text hover:bg-border/20'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* League selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-muted font-semibold">League:</span>
          <select
            value={leagueFilter}
            onChange={(e) => setLeagueFilter(e.target.value)}
            className="bg-background border border-border/60 text-text rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/45 cursor-pointer text-xs"
          >
            <option value="all">All Leagues</option>
            {leagues.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Match Grid list */}
      {filteredMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatches.map(m => (
            <FixtureCard key={m.id} match={m} />
          ))}
        </div>
      ) : (
        <Card className="text-center py-16 text-muted text-xs border-dashed border-border">
          No matches found matching filter criteria.
        </Card>
      )}
    </div>
  );
};
export default Fixtures;
