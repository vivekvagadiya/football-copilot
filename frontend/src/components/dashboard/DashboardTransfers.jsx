import React from "react";
import { Link } from "react-router-dom";
import { ArrowRightLeft, ArrowRight } from "lucide-react";
import { TransferCard } from "../football/TransferCard";

export const DashboardTransfers = ({ transfers = [], isLoading = false }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-2.5">
        <h3 className="font-display font-extrabold text-sm text-text flex items-center gap-1.5">
          <ArrowRightLeft size={14} className="text-muted" /> Hot Transfer Feeds
        </h3>
        <Link
          to="/transfers"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          All transfers <ArrowRight size={12} />
        </Link>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-xl bg-card/60 border border-border/40 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {transfers.slice(0, 2).map((t) => (
            <TransferCard key={t.id} transfer={t} />
          ))}
        </div>
      )}
    </div>
  );
};
