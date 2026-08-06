import React from "react";
import { Link } from "react-router-dom";
import { ArrowRightLeft, ArrowRight } from "lucide-react";
import { TransferCard } from "../football/TransferCard";

export const DashboardTransfers = ({ transfers = [] }) => {
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
      <div className="space-y-3">
        {transfers.slice(0, 2).map((t) => (
          <TransferCard key={t.id} transfer={t} />
        ))}
      </div>
    </div>
  );
};
