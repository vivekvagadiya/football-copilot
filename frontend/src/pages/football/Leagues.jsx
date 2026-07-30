import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Award, Shield, ChevronRight } from "lucide-react";
import { apiService } from "../../services/apiService";
import { Loading } from "../../components/ui/Loading";
import { Card } from "../../components/ui/Card";
import { LEAGUE_FILTERS } from "../../constants/leagues";
import { getCompetationApi } from "../../api/football.api";
import { useApp } from "../../context/AppContext";
import FavoriteButton from "../../components/common/FavoriteButton";

export const Leagues = () => {
  const navigate = useNavigate();
  const { isFavorite } = useApp();

  const { data: leagues = [], isLoading } = useQuery({
    queryKey: ["leagues"],
    queryFn: getCompetationApi,
    staleTime: 600000, // Caches data for 10 minutes to prevent duplicate API fetches during re-renders
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
        <p className="text-xs text-muted">
          Browse leagues, cup standings, mock fixtures, and tactical club logs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leagues.map((l) => {
          const filter = LEAGUE_FILTERS.find((f) => f.code.toUpperCase() === l.code.toUpperCase()) || {};
          const isLeagueFavorited = isFavorite("leagues", l.code);

          return (
            <Card
              key={l.code}
              onClick={() => navigate(`/league/${l.code}`)}
              className="relative border border-border hover:border-primary/40 transition-all p-5 flex flex-col justify-between group cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4 mb-4 pr-6">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 flex items-center justify-center bg-white rounded-full p-1 shadow-sm shrink-0 border border-border/40">
                    <img
                      src={l.emblem || filter.logo}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-text group-hover:text-primary transition-colors text-sm truncate">
                      {l.name}
                    </h3>
                    <p className="text-[10px] text-muted flex items-center gap-1.5 mt-0.5 truncate">
                      {l.areaFlag && (
                        <img
                          src={l.areaFlag}
                          alt=""
                          className="w-4 h-2.5 object-contain rounded-sm shrink-0 border border-border/10 shadow-sm"
                        />
                      )}
                      {l.area}
                    </p>
                  </div>
                </div>

                <div className="absolute top-3 right-3 z-10">
                  <FavoriteButton
                    itemType="LEAGUE"
                    externalId={l.code}
                    iconType="star"
                    meta={{
                      name: l.name,
                      badgeUrl: l.emblem || filter.logo || "",
                      subtitle: l.area || "",
                    }}
                    isFavoriteInitial={isLeagueFavorited}
                    size={16}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-muted border-t border-border/40 pt-3">
                <span>
                  Season: <strong className="text-text">{l.season || filter.season || "2025/26"}</strong>
                </span>
                <span className="flex items-center gap-1">
                  {l.teamCount || filter.teamCount || 20} Teams{" "}
                  <ChevronRight
                    size={12}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
export default Leagues;
