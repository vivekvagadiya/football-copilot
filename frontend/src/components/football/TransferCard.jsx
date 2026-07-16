import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { TrendingUp, ArrowRightLeft } from 'lucide-react';

export const TransferCard = ({ transfer }) => {
  const { player, position, fromClub, toClub, fee, status, confidence, date } = transfer;

  const getStatusVariant = (s) => {
    switch (s.toLowerCase()) {
      case 'done deal': return 'success';
      case 'here we go': return 'warning';
      case 'rumor': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <Card hover={false} className="border border-border p-4 bg-card shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-display font-semibold text-text text-sm">{player}</h4>
          <p className="text-[10px] text-muted">{position}</p>
        </div>
        <Badge variant={getStatusVariant(status)} className="text-[9px] uppercase tracking-wide">
          {status}
        </Badge>
      </div>

      <div className="flex items-center justify-between bg-background/50 p-2.5 rounded-lg border border-border/30 mb-3 text-xs">
        <div className="text-center flex-1">
          <span className="text-[10px] text-muted block mb-0.5">From</span>
          <span className="font-medium text-text truncate max-w-[100px] block mx-auto">{fromClub}</span>
        </div>
        <ArrowRightLeft size={12} className="text-muted mx-2 shrink-0" />
        <div className="text-center flex-1">
          <span className="text-[10px] text-muted block mb-0.5">To</span>
          <span className="font-medium text-text truncate max-w-[100px] block mx-auto">{toClub}</span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/40 pt-2.5 text-[10px]">
        <span className="text-muted">Fee: <strong className="text-text">{fee}</strong></span>
        <div className="flex items-center gap-1.5">
          <span className="text-muted">Confidence:</span>
          <div className="flex items-center gap-1">
            <div className="w-12 h-1 bg-border/45 rounded-full overflow-hidden">
              <div 
                className={`h-full ${confidence > 80 ? 'bg-green-500' : confidence > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${confidence}%` }}
              />
            </div>
            <span className="font-bold text-text">{confidence}%</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
