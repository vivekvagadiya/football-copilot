import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FixtureCard } from "../../components/football/FixtureCard";
import { Loading } from "../../components/ui/Loading";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { CalendarRange, Filter } from "lucide-react";
import { getUpcomingMatchesApi } from "../../api/football.api";
import { LEAGUE_FILTERS } from "../../constants/leagues";

const statusFilters = [
  { value: "all", label: "All" },
  { value: "LIVE", label: "Live" },
  { value: "SCHEDULED", label: "Upcoming" },
  { value: "FINISHED", label: "Finished" },
];
export const Fixtures = () => {
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'live', 'upcoming', 'finished'
  const [leagueFilter, setLeagueFilter] = useState("all");
  const [isLeagueDropdownOpen, setIsLeagueDropdownOpen] = useState(false);

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["matches"],
    queryFn: () => getUpcomingMatchesApi(),
    //   {
    //   ...(statusFilter !== "all" && { status: statusFilter }),
    //   ...(leagueFilter !== "all" && { leagueId: leagueFilter }),
    // }
  });



  const filteredMatches = matches.filter((m) => {
    const matchesStatus = statusFilter === "all" || m.status === statusFilter;
    const matchesLeague = leagueFilter === "all" || m.leagueId === leagueFilter;
    return matchesStatus && matchesLeague;
  });

  if (isLoading) {
    return <Loading text="Fetching match calendar..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-border/40 pb-4">
        <div>
          <h2 className="font-display font-extrabold text-lg text-text flex items-center gap-2">
            <CalendarRange size={18} className="text-primary" /> Football Match
            Calendar
          </h2>
          <p className="text-xs text-muted">
            Filter upcoming predictions and finished match analyses across the
            FOS.
          </p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-4 bg-card/65 p-3 rounded-xl border border-border/50 text-xs">
        <span className="flex items-center gap-1.5 font-bold text-muted uppercase tracking-wider">
          <Filter size={13} /> Filters:
        </span>

        {/* Status Filter buttons */}
        <div className="flex items-center gap-1.5 border-r border-border pr-4">
          {statusFilters.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wide cursor-pointer transition-colors ${
                statusFilter === s.value
                  ? "bg-primary text-[#07120D]"
                  : "text-muted hover:text-text hover:bg-border/20"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

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
                {/* Backdrop Overlay to handle clicking away */}
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

      {/* Match Grid list */}
      {filteredMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatches.map((m) => (
            <FixtureCard key={m.id} match={m} />
          ))}
        </div>
      ) : (
        <Card className="text-center py-16 text-muted text-xs border-dashed border-border">
          No matches found matching filter criteria.
        </Card>
      )}
    </div>
  );
};
export default Fixtures;
