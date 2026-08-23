import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLiveMatchesApi } from "../../api/football.api";
import { LEAGUE_FILTERS } from "../../constants/leagues";
import { ScoreCard } from "../../components/football/ScoreCard";
import { Loading } from "../../components/ui/Loading";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Zap, Clock, Filter } from "lucide-react";

export const LiveMatches = () => {
  const [leagueFilter, setLeagueFilter] = useState("all");
  const [isLeagueDropdownOpen, setIsLeagueDropdownOpen] = useState(false);

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["liveMatches", leagueFilter],
    queryFn: () =>
      getLiveMatchesApi({
        ...(leagueFilter !== "all" && { leagueId: leagueFilter }),
      }),
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const filteredMatches = matches.filter((m) => {
    return leagueFilter === "all" || m.leagueId === leagueFilter;
  });

  if (isLoading) {
    return <Loading text="Syncing live match telemetry..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-border/40 pb-4">
        <div>
          <h2 className="font-display font-extrabold text-lg text-text flex items-center gap-2">
            <Zap size={18} className="text-red-500 fill-current animate-pulse" />{" "}
            Live Telemetry Matrix
          </h2>
          <p className="text-xs text-muted">
            Real-time live matches with dynamic scorelines and telemetry feeds.
          </p>
        </div>
        <Badge
          variant="live"
          className="text-[10px] uppercase font-bold py-1 px-3 w-fit"
        >
          Status: Synchronized
        </Badge>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-4 bg-card/65 p-3 rounded-xl border border-border/50 text-xs">
        <span className="flex items-center gap-1.5 font-bold text-muted uppercase tracking-wider">
          <Filter size={13} /> Filters:
        </span>

        {/* League selector */}
        <div className="flex items-center gap-1.5 z-20">
          <span className="text-muted font-semibold">League:</span>
          <div className="relative w-44">
            <button
              onClick={() => setIsLeagueDropdownOpen(!isLeagueDropdownOpen)}
              className="w-full flex items-center justify-between bg-background border border-border/60 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-text focus:outline-none focus:border-primary/50 cursor-pointer"
            >
              {(() => {
                const activeLeague = LEAGUE_FILTERS.find(
                  (l) => l.code === leagueFilter,
                );
                return (
                  <span className="flex items-center gap-2 min-w-0">
                    {activeLeague?.logo && (
                      <div className="w-5 h-5 flex items-center justify-center bg-white rounded-full p-0.5 shadow-sm shrink-0">
                        <img
                          src={activeLeague.logo}
                          alt=""
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <span className="truncate">
                      {activeLeague ? activeLeague.name : "All Leagues"}
                    </span>
                  </span>
                );
              })()}
              <span className="text-muted text-[8px] ml-1 shrink-0">▼</span>
            </button>

            {isLeagueDropdownOpen && (
              <>
                {/* Backdrop Overlay */}
                <div
                  className="fixed inset-0 z-30 cursor-default"
                  onClick={() => setIsLeagueDropdownOpen(false)}
                />

                {/* Options Menu */}
                <div className="absolute right-0 mt-1 w-44 bg-card border border-border rounded-lg shadow-lg z-40 max-h-48 overflow-y-auto no-scrollbar">
                  <button
                    onClick={() => {
                      setLeagueFilter("all");
                      setIsLeagueDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-border/25 transition-colors cursor-pointer ${
                      leagueFilter === "all"
                        ? "bg-primary/10 text-primary font-bold"
                        : "text-text"
                    }`}
                  >
                    <span className="truncate">All Leagues</span>
                  </button>
                  {LEAGUE_FILTERS.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLeagueFilter(l.code);
                        setIsLeagueDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-border/25 transition-colors cursor-pointer ${
                        leagueFilter === l.code
                          ? "bg-primary/10 text-primary font-bold"
                          : "text-text"
                      }`}
                    >
                      {l.logo && (
                        <div className="w-5 h-5 flex items-center justify-center bg-white rounded-full p-0.5 shadow-sm shrink-0">
                          <img
                            src={l.logo}
                            alt=""
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      <span className="truncate">{l.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Live Match Grid */}
      {filteredMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatches.map((m) => (
            <ScoreCard key={m.id} match={m} />
          ))}
        </div>
      ) : (
        <Card className="text-center py-16 text-muted text-xs border-dashed border-border space-y-2">
          <Clock size={32} className="mx-auto text-border" />
          <p className="font-semibold text-text">No active games broadcasting.</p>
          <p>Please browse upcoming fixtures to preview prediction models.</p>
        </Card>
      )}
    </div>
  );
};
export default LiveMatches;
