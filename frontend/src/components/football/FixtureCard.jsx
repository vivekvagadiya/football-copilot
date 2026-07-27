import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, Star } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { TeamLogo } from './TeamLogo';

export const FixtureCard = ({ match }) => {
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useApp();
  const { id, homeTeam, awayTeam, leagueName, date, status, minute } = match;

  const isFavorited = isFavorite('teams', homeTeam.id) || isFavorite('teams', awayTeam.id);

  const handleDetailsClick = (e) => {
    e.stopPropagation();
    navigate(`/match/${id}`);
  };

  return (
    <div 
      onClick={handleDetailsClick}
      className="flex items-center justify-between p-3.5 bg-card border border-border rounded-xl hover:border-primary/30 transition-all cursor-pointer group"
    >
      {/* Time & League */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center justify-center border-r border-border pr-3 min-w-[70px]">
          {status === 'live' ? (
            <span className="text-xs text-red-500 font-extrabold animate-pulse uppercase">Live {minute}'</span>
          ) : (
            <span className="text-xs text-muted font-semibold">{date}</span>
          )}
          <span className="text-[9px] text-muted uppercase mt-0.5 truncate max-w-[65px]">{leagueName}</span>
        </div>

        {/* Home vs Away */}
        <div className="flex flex-col space-y-1">
          <div className="flex items-center gap-2">
            <TeamLogo logo={homeTeam.logo} name={homeTeam.name} className="w-4 h-4" fallbackSize="text-base" />
            <span className="text-sm font-semibold text-text group-hover:text-primary transition-colors">{homeTeam.name}</span>
            {match.status !== 'upcoming' && (
              <span className="text-sm font-bold ml-auto">{homeTeam.score}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <TeamLogo logo={awayTeam.logo} name={awayTeam.name} className="w-4 h-4" fallbackSize="text-base" />
            <span className="text-sm font-semibold text-text group-hover:text-primary transition-colors">{awayTeam.name}</span>
            {match.status !== 'upcoming' && (
              <span className="text-sm font-bold ml-auto">{awayTeam.score}</span>
            )}
          </div>
        </div>
      </div>

      {/* Action / Favorite */}
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite('teams', homeTeam.id);
          }}
          className={`p-1.5 rounded-full hover:bg-border/30 transition-colors ${
            isFavorited ? 'text-primary' : 'text-muted hover:text-text'
          }`}
        >
          <Star size={14} className={isFavorited ? 'fill-current' : ''} />
        </button>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleDetailsClick}
          className="rounded-full w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ArrowRight size={14} />
        </Button>
      </div>
    </div>
  );
};
