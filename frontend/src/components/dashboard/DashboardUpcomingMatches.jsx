import React from "react";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight } from "lucide-react";
import { FixtureCard } from "../football/FixtureCard";

export const DashboardUpcomingMatches = ({
  upcomingMatches = [],
  isLoading = false,
}) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-display font-extrabold text-sm text-text flex items-center gap-1.5">
          <Calendar size={14} className="text-muted" /> Upcoming Match Matrix
        </h3>
        <Link
          to="/fixtures"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          View Fixtures <ArrowRight size={12} />
        </Link>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 rounded-xl bg-card/60 border border-border/40 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {upcomingMatches.map((m) => (
            <FixtureCard key={m.id} match={m} />
          ))}
        </div>
      )}
    </div>
  );
};
