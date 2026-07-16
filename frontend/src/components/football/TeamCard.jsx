import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ChevronRight, Star } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useApp } from '../../context/AppContext';

export const TeamCard = ({ team }) => {
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useApp();
  const { id, name, logo, manager, rank, points, form } = team;

  const isFavorited = isFavorite('teams', id);

  const handleCardClick = () => {
    navigate(`/team/${id}`);
  };

  return (
    <Card
      onClick={handleCardClick}
      className="relative flex flex-col justify-between overflow-hidden border border-border hover:border-primary/40 transition-all p-4 group"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite('teams', id);
        }}
        className={`absolute top-3 right-3 p-1.5 rounded-full hover:bg-border/30 z-10 transition-colors ${
          isFavorited ? 'text-primary' : 'text-muted hover:text-text'
        }`}
      >
        <Star size={13} className={isFavorited ? 'fill-current' : ''} />
      </button>

      <div className="flex items-center gap-3.5 mb-3">
        <span className="text-3xl leading-none">{logo}</span>
        <div className="min-w-0">
          <h4 className="font-display font-bold text-text group-hover:text-primary transition-colors truncate text-sm">
            {name}
          </h4>
          <p className="text-[10px] text-muted truncate">Manager: {manager}</p>
        </div>
      </div>

      <div className="flex justify-between items-center text-[10px] border-t border-border/40 pt-2.5">
        <div className="flex items-center gap-3">
          <div>
            <span className="text-muted block">Rank</span>
            <span className="font-semibold text-text">#{rank}</span>
          </div>
          <div>
            <span className="text-muted block">Points</span>
            <span className="font-semibold text-text">{points} pts</span>
          </div>
        </div>

        {/* Recent Form bubbles */}
        <div className="flex items-center gap-1">
          {form.map((letter, idx) => (
            <span
              key={idx}
              className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[8px] text-white ${
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
        </div>
      </div>
    </Card>
  );
};
