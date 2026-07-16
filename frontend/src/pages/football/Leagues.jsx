import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Award, Shield, ChevronRight } from 'lucide-react';
import { apiService } from '../../services/apiService';
import { Loading } from '../../components/ui/Loading';
import { Card } from '../../components/ui/Card';

export const Leagues = () => {
  const navigate = useNavigate();

  const { data: leagues = [], isLoading } = useQuery({
    queryKey: ['leagues'],
    queryFn: apiService.getLeagues
  });

  if (isLoading) {
    return <Loading text="Accessing league files..." />;
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-border/40 pb-4">
        <h2 className="font-display font-extrabold text-lg text-text flex items-center gap-2">
          <Award size={18} className="text-primary" /> Supported Competitions
        </h2>
        <p className="text-xs text-muted">Browse leagues, cup standings, mock fixtures, and tactical club logs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leagues.map((l) => (
          <Card
            key={l.id}
            onClick={() => navigate(`/league/${l.id}`)}
            className="border border-border hover:border-primary/40 transition-all p-5 flex flex-col justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-4 mb-4">
              <span className="text-4xl leading-none">{l.logo}</span>
              <div>
                <h3 className="font-display font-bold text-text group-hover:text-primary transition-colors text-sm">{l.name}</h3>
                <p className="text-[10px] text-muted">{l.country}</p>
              </div>
            </div>

            <div className="flex justify-between items-center text-[10px] text-muted border-t border-border/40 pt-3">
              <span>Season: <strong className="text-text">{l.season}</strong></span>
              <span className="flex items-center gap-1">
                {l.teamsCount} Teams <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
export default Leagues;
