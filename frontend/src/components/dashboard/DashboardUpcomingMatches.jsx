import React from "react";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight } from "lucide-react";
import { FixtureCard } from "../football/FixtureCard";

export const DashboardUpcomingMatches = ({ upcomingMatches = [] }) => {
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
      <div className="space-y-3">
        {upcomingMatches.map((m) => (
          <FixtureCard key={m.id} match={m} />
        ))}
      </div>
    </div>
  );
};
