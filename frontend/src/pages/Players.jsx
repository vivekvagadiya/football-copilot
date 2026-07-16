import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { User } from 'lucide-react';
import { apiService } from '../services/apiService';
import { Loading } from '../components/ui/Loading';
import { PlayerCard } from '../components/football/PlayerCard';

export const Players = () => {
  const { data: players = [], isLoading } = useQuery({
    queryKey: ['players'],
    queryFn: apiService.getPlayers
  });

  if (isLoading) {
    return <Loading text="Retrieving player index catalogs..." />;
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-border/40 pb-4">
        <h2 className="font-display font-extrabold text-lg text-text flex items-center gap-2">
          <User size={18} className="text-primary" /> Squad Players Database
        </h2>
        <p className="text-xs text-muted">Browse league player parameters, goal statistics, assists, and market evaluations.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {players.map(p => (
          <PlayerCard key={p.id} player={p} />
        ))}
      </div>
    </div>
  );
};
export default Players;
