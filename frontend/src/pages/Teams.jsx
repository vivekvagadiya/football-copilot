import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield } from 'lucide-react';
import { apiService } from '../services/apiService';
import { Loading } from '../components/ui/Loading';
import { TeamCard } from '../components/football/TeamCard';

export const Teams = () => {
  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: apiService.getTeams
  });

  if (isLoading) {
    return <Loading text="Retrieving club registries..." />;
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-border/40 pb-4">
        <h2 className="font-display font-extrabold text-lg text-text flex items-center gap-2">
          <Shield size={18} className="text-primary" /> Clubs Matrix
        </h2>
        <p className="text-xs text-muted">Browse football clubs, form structures, and manager statistics details.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map(t => (
          <TeamCard key={t.id} team={t} />
        ))}
      </div>
    </div>
  );
};
export default Teams;
