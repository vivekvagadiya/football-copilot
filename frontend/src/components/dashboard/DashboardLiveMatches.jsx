import React from "react";
import { Link } from "react-router-dom";
import { Zap, ArrowRight } from "lucide-react";
import { ScoreCard } from "../football/ScoreCard";
import { Card } from "../ui/Card";

export const DashboardLiveMatches = ({ liveMatches = [] }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-display font-extrabold text-sm text-text flex items-center gap-1.5">
          <Zap size={14} className="text-red-500 fill-current" /> Live Engines
        </h3>
        <Link
          to="/live"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          View all <ArrowRight size={12} />
        </Link>
      </div>
      {liveMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {liveMatches.map((m) => (
            <ScoreCard key={m.id} match={m} />
          ))}
        </div>
      ) : (
        <Card className="text-center py-8 text-xs text-muted border-dashed border-border">
          No matches live right now. Check back during match hours.
        </Card>
      )}
    </div>
  );
};
