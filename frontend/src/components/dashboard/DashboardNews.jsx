import React from "react";
import { Link } from "react-router-dom";
import { Newspaper, ArrowRight } from "lucide-react";
import { Card } from "../ui/Card";

export const DashboardNews = ({ news = [], onSelectNews }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-display font-extrabold text-sm text-text flex items-center gap-1.5">
          <Newspaper size={14} className="text-muted" /> News Intelligence
        </h3>
        <Link
          to="/news"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          More news <ArrowRight size={12} />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {news.slice(0, 8).map((n) => (
          <Card
            key={n.id}
            onClick={() => onSelectNews(n)}
            className="cursor-pointer hover:border-primary/20 transition-all flex gap-4 p-4 items-start"
          >
            <img
              src={n.image}
              alt={n.title}
              className="w-16 h-16 object-cover rounded-lg shrink-0 border border-border"
            />
            <div className="space-y-1 min-w-0">
              <span className="text-[9px] text-primary font-bold uppercase">
                {n.date}
              </span>
              <h4 className="font-semibold text-text text-xs leading-snug line-clamp-2">
                {n.title}
              </h4>
              <p className="text-[10px] text-muted line-clamp-1">
                {n.summary}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
