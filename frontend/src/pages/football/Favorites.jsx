import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star, Shield, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/apiService';
import { Loading } from '../../components/ui/Loading';
import { Card } from '../../components/ui/Card';
import { TeamCard } from '../../components/football/TeamCard';
import { PlayerCard } from '../../components/football/PlayerCard';

export const Favorites = () => {
  const { favorites } = useApp();

  const { data: teams = [], isLoading: loadingTeams } = useQuery({
    queryKey: ['teams'],
    queryFn: apiService.getTeams
  });

  const { data: players = [], isLoading: loadingPlayers } = useQuery({
    queryKey: ['players'],
    queryFn: apiService.getPlayers
  });

  const favTeams = teams.filter(t => favorites.teams.includes(t.id));
  const favPlayers = players.filter(p => favorites.players.includes(p.id));

  const isLoading = loadingTeams || loadingPlayers;

  if (isLoading) {
    return <Loading text="Retrieving bookmarked dossiers..." />;
  }

  const hasFavorites = favTeams.length > 0 || favPlayers.length > 0;

  return (
    <div className="space-y-6">
      <div className="border-b border-border/40 pb-4">
        <h2 className="font-display font-extrabold text-lg text-text flex items-center gap-2">
          <Star size={18} className="text-primary fill-current" /> Favorites Console
        </h2>
        <p className="text-xs text-muted">Quick access to bookmarked teams, players, and custom scout lists.</p>
      </div>

      {!hasFavorites ? (
        <Card className="text-center py-16 text-xs text-muted border-dashed border-border space-y-2">
          <Star size={32} className="mx-auto text-border" />
          <p className="font-semibold text-text">No favorites bookmarked.</p>
          <p>Click the star icon on any player profile or club card to pin it here.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Favorite Clubs */}
          {favTeams.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-display font-bold text-xs text-text flex items-center gap-1.5 px-1 uppercase tracking-wider text-muted">
                <Shield size={12} /> Bookmarked Clubs
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {favTeams.map(t => (
                  <TeamCard key={t.id} team={t} />
                ))}
              </div>
            </div>
          )}

          {/* Favorite Players */}
          {favPlayers.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-display font-bold text-xs text-text flex items-center gap-1.5 px-1 uppercase tracking-wider text-muted">
                <User size={12} /> Bookmarked Players
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {favPlayers.map(p => (
                  <PlayerCard key={p.id} player={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default Favorites;
