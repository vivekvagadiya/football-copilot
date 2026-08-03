import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Newspaper, Eye, ChevronDown, ChevronUp, Sparkles, Cpu } from 'lucide-react';
import { NEWS } from '../../constants/mockData';
import { getNewsApi, getNewsSummaryApi } from '../../api/football.api';
import { Loading } from '../../components/ui/Loading';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { AIResponseCard } from '../../components/ai/AIResponseCard';

const NewsCard = ({ item }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mode, setMode] = useState('standard'); // 'standard' | 'ai'

  const { data: aiSummaryData, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['newsSummary', item.id],
    queryFn: () => getNewsSummaryApi(item.id),
    enabled: mode === 'ai' && isExpanded,
    staleTime: 5 * 60 * 1000
  });

  return (
    <Card 
      hover={false}
      className="border border-border p-5 bg-card transition-colors flex flex-col md:flex-row gap-5 items-start"
    >
      <img 
        src={item.image} 
        alt={item.title} 
        className="w-full md:w-44 h-32 object-cover rounded-xl border border-border shrink-0" 
      />
      
      <div className="flex-1 space-y-2 min-w-0 w-full text-left">
        <div className="flex items-center justify-between gap-3 text-[10px] uppercase font-bold w-full">
          <div className="flex items-center gap-3 text-primary">
            <span>{item.date}</span>
            <span className="text-muted flex items-center gap-1">
              <Eye size={12} /> {item.reads}
            </span>
          </div>

          {/* Option 3 Segmented Toggle */}
          <div className="flex bg-background border border-border rounded-lg p-0.5 select-none">
            <button
              onClick={() => setMode('standard')}
              className={`px-2.5 py-1 rounded cursor-pointer transition-all ${
                mode === 'standard' ? 'bg-primary/10 text-primary font-extrabold' : 'text-muted'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => setMode('ai')}
              className={`px-2.5 py-1 rounded cursor-pointer transition-all flex items-center gap-1 ${
                mode === 'ai' ? 'bg-primary/10 text-primary font-extrabold' : 'text-muted'
              }`}
            >
              <Sparkles size={10} /> AI Briefing
            </button>
          </div>
        </div>
        
        <h3 className="font-display font-bold text-text text-base leading-tight">
          {item.title}
        </h3>
        
        {mode === 'standard' ? (
          <p className="text-xs text-muted leading-relaxed">
            {isExpanded ? item.content : item.summary}
          </p>
        ) : (
          <div className="space-y-2">
            {!isExpanded ? (
              <p className="text-xs text-muted leading-relaxed italic">
                {item.summary} (Click expand for full AI Briefing analysis...)
              </p>
            ) : isSummaryLoading ? (
              <div className="py-2 flex gap-3 items-start animate-pulse">
                <div className="p-2 bg-primary/10 rounded border border-primary/20 text-primary shrink-0">
                  <Cpu size={14} />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-border/20 rounded w-1/4" />
                  <div className="h-4 bg-border/20 rounded w-full" />
                  <div className="h-4 bg-border/20 rounded w-5/6" />
                </div>
              </div>
            ) : aiSummaryData?.aiSummary ? (
              // Option 1 Render AI response card inside the expanded accordion
              <AIResponseCard content={aiSummaryData.aiSummary} />
            ) : (
              <p className="text-xs text-muted">Failed to generate AI briefing.</p>
            )}
          </div>
        )}

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsExpanded(prev => !prev)}
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
};

export const News = () => {
  const { data: news = [], isLoading } = useQuery({
    queryKey: ['news'],
    queryFn: () => getNewsApi(1)
  });

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
        {news.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};
export default News;
