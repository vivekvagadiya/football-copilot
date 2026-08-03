import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Newspaper, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { apiService } from '../../services/apiService';
import { NEWS } from '../../constants/mockData';
import { getMarketValueTransfersApi } from '../../api/football.api';
import { Loading } from '../../components/ui/Loading';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const News = () => {
  const [expandedId, setExpandedId] = useState(null);

  const { data: mvTransfersRaw = [], isLoading } = useQuery({
    queryKey: ['newsTransfers'],
    queryFn: () => getMarketValueTransfersApi(1)
  });

  const news = mvTransfersRaw.length > 0
    ? mvTransfersRaw.map((t, idx) => ({
        id: t.id || `news-${idx}`,
        title: `${t.player} Market Value Transfer Update`,
        summary: `${t.player} has moved from ${t.fromClub} to ${t.toClub} for a fee of ${t.fee}.`,
        content: `${t.player} completed a transfer from ${t.fromClub} to ${t.toClub} for a fee of ${t.fee}.`,
        date: t.date || "Recent",
        reads: `${Math.floor(Math.random() * 20) + 5}K reads`,
        image: idx % 2 === 0
          ? "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop"
          : "https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=600&auto=format&fit=crop",
      }))
    : NEWS;

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  if (isLoading) {
    return <Loading text="Syncing news networks..." />;
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-border/40 pb-4">
        <h2 className="font-display font-extrabold text-lg text-text flex items-center gap-2">
          <Newspaper size={18} className="text-primary" /> Intelligence News Briefs
        </h2>
        <p className="text-xs text-muted">Tactical reviews, squad injury logs, and match briefing bulletins.</p>
      </div>

      <div className="space-y-4">
        {news.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <Card 
              key={item.id} 
              hover={false}
              className="border border-border p-5 bg-card transition-colors flex flex-col md:flex-row gap-5 items-start"
            >
              <img 
                src={item.image} 
                alt={item.title} 
                className="w-full md:w-44 h-32 object-cover rounded-xl border border-border shrink-0" 
              />
              
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex items-center gap-3 text-[10px] text-primary uppercase font-bold">
                  <span>{item.date}</span>
                  <span className="text-muted flex items-center gap-1">
                    <Eye size={12} /> {item.reads}
                  </span>
                </div>
                
                <h3 className="font-display font-bold text-text text-base leading-tight">
                  {item.title}
                </h3>
                
                <p className="text-xs text-muted leading-relaxed">
                  {isExpanded ? item.content : item.summary}
                </p>

                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => toggleExpand(item.id)}
                  className="text-[10px] uppercase font-bold tracking-wide mt-2"
                >
                  {isExpanded ? (
                    <>Collapse briefing <ChevronUp size={12} /></>
                  ) : (
                    <>Expand briefing <ChevronDown size={12} /></>
                  )}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
export default News;
