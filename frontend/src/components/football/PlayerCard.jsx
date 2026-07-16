import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Award, TrendingUp } from 'lucide-react';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { useApp } from '../../context/AppContext';

export const PlayerCard = ({ player }) => {
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useApp();
  const { id, name, position, number, flag, teamName, value, stats } = player;

  const isFavorited = isFavorite('players', id);

  const handleCardClick = () => {
    navigate(`/player/${id}`);
  };

  return (
    <Card
      onClick={handleCardClick}
      className="relative flex flex-col justify-between overflow-hidden border border-border hover:border-primary/40 transition-all p-4 group"
    >
      {/* Favorite absolute button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite('players', id);
        }}
        className={`absolute top-3 right-3 p-1.5 rounded-full hover:bg-border/30 z-10 transition-colors ${
          isFavorited ? 'text-primary' : 'text-muted hover:text-text'
        }`}
      >
        <Star size={13} className={isFavorited ? 'fill-current' : ''} />
      </button>

      <div className="flex items-start gap-3.5 mb-3">
        {/* Avatar / Profile photo */}
        <Avatar src={player.photo} fallback={name[0]} size="lg" className="shrink-0 group-hover:scale-105 transition-transform" />
        
        {/* Identity Details */}
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted">{flag}</span>
            <span className="text-[10px] text-muted truncate">{teamName}</span>
          </div>
          <h4 className="font-display font-bold text-text group-hover:text-primary transition-colors truncate text-sm">
            {name}
          </h4>
          <p className="text-[10px] text-muted">{position} • #{number}</p>
        </div>
      </div>

      {/* Basic Metrics mini panel */}
      {stats && (
        <div className="grid grid-cols-3 gap-1 bg-background/55 p-2 rounded-lg text-center border border-border/30 mb-3 text-[10px]">
          <div>
            <span className="block text-muted">Goals</span>
            <span className="font-display font-bold text-text">{stats.goals}</span>
          </div>
          <div>
            <span className="block text-muted">Assists</span>
            <span className="font-display font-bold text-text">{stats.assists}</span>
          </div>
          <div>
            <span className="block text-muted">Rating</span>
            <span className="font-display font-bold text-primary">{stats.rating.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Value Tag Footer */}
      <div className="flex items-center justify-between border-t border-border/40 pt-2 text-[10px] text-muted">
        <span className="flex items-center gap-1">
          <TrendingUp size={11} className="text-primary" /> Market Value
        </span>
        <span className="font-semibold text-text">{value}</span>
      </div>
    </Card>
  );
};
