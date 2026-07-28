import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Clock, Shield } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { TeamLogo } from './TeamLogo';

export const ScoreCard = ({ match }) => {
  const navigate = useNavigate();
  const { id, status, minute, homeTeam, awayTeam, leagueName, leagueLogo, date } = match;

  const isLive = status === 'live';
  const isUpcoming = status === 'upcoming';
  const isFinished = status === 'finished';

  const handleCardClick = () => {
    navigate(`/match/${id}`);
  };

  return (
    <Card 
      onClick={handleCardClick}
      className="relative overflow-hidden border border-border hover:border-primary/40 transition-all shadow-sm"
    >
      {/* Background Subtle Accent */}
      {isLive && (
        <div className="absolute top-0 right-0 h-1.5 w-1.5 rounded-bl-full bg-red-500" />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <span className="text-[10px] text-muted font-bold uppercase tracking-wider flex items-center gap-1.5">
          {leagueLogo ? (
            <div className="w-4 h-4 flex items-center justify-center bg-white rounded-full p-0.5 shadow-sm shrink-0">
              <img src={leagueLogo} alt="" className="w-full h-full object-contain" />
            </div>
          ) : (
            <Shield size={11} className="text-muted" />
          )}
          {leagueName}
        </span>

        {isLive && (
          <Badge variant="live" className="gap-1 px-1.5 py-0.5 text-[10px]">
            <Zap size={10} className="fill-current text-white animate-pulse" />
            LIVE • {minute}'
          </Badge>
        )}

        {isUpcoming && (
          <Badge variant="secondary" className="text-[10px] font-medium">
            <Clock size={10} className="mr-1 inline-block" /> {date}
          </Badge>
        )}

        {isFinished && (
          <Badge variant="outline" className="text-[10px] bg-border/20 border-transparent text-muted">
            FT
          </Badge>
        )}
      </div>

      {/* Team rows */}
      <div className="space-y-2.5 mb-4">
        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <TeamLogo logo={homeTeam.logo} name={homeTeam.name} className="w-5 h-5" fallbackSize="text-lg" />
            <span className="text-sm font-semibold text-text truncate max-w-[140px]">{homeTeam.name}</span>
          </div>
          <span className="text-base font-display font-extrabold text-text">
            {isUpcoming ? '-' : homeTeam.score}
          </span>
        </div>

        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <TeamLogo logo={awayTeam.logo} name={awayTeam.name} className="w-5 h-5" fallbackSize="text-lg" />
            <span className="text-sm font-semibold text-text truncate max-w-[140px]">{awayTeam.name}</span>
          </div>
          <span className="text-base font-display font-extrabold text-text">
            {isUpcoming ? '-' : awayTeam.score}
          </span>
        </div>
      </div>

      {/* xG details if live/finished */}
      {!isUpcoming && (homeTeam.xG !== undefined && awayTeam.xG !== undefined) && (
        <div className="flex items-center justify-between text-[10px] text-muted border-t border-border/40 pt-2 bg-background/20 px-2 rounded">
          <span>Expected Goals (xG)</span>
          <span className="font-semibold text-text">
            {homeTeam.xG.toFixed(2)} - {awayTeam.xG.toFixed(2)}
          </span>
        </div>
      )}

      {/* Prediction meter for upcoming */}
      {isUpcoming && match.prediction && (
        <div className="text-[10px] text-muted border-t border-border/40 pt-2 space-y-1">
          <div className="flex justify-between font-medium">
            <span>Home Win: {match.prediction.homeWin}%</span>
            <span>Away: {match.prediction.awayWin}%</span>
          </div>
          <div className="w-full h-1 bg-border/45 rounded-full overflow-hidden flex">
            <div className="h-full bg-primary" style={{ width: `${match.prediction.homeWin}%` }} />
            <div className="h-full bg-muted/40" style={{ width: `${match.prediction.draw}%` }} />
            <div className="h-full bg-secondary" style={{ width: `${match.prediction.awayWin}%` }} />
          </div>
        </div>
      )}
    </Card>
  );
};
