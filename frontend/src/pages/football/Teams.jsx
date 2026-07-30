import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shield, Search } from "lucide-react";
import { Loading } from "../../components/ui/Loading";
import { TeamCard } from "../../components/football/TeamCard";
import { getTeamsApi } from "../../api/football.api";
import { LEAGUE_FILTERS } from "../../constants/leagues";

export const Teams = () => {
  const [selectedLeague, setSelectedLeague] = useState("PL");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: teamsList = [], isLoading } = useQuery({
    queryKey: ["teams", selectedLeague],
    queryFn: () => getTeamsApi(selectedLeague),
    staleTime: 600000, // 10 minutes cache
  });

  const filteredTeams = teamsList.filter((team) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const nameMatch = team.name?.toLowerCase().includes(term);
    const shortNameMatch = team.shortName?.toLowerCase().includes(term);
    const tlaMatch = team.tla?.toLowerCase().includes(term);
    const venueMatch = (team.venue || team.stadium)?.toLowerCase().includes(term);
    const coachMatch = (team.coach?.name || team.manager)?.toLowerCase().includes(term);
    return nameMatch || shortNameMatch || tlaMatch || venueMatch || coachMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <h2 className="font-display font-extrabold text-lg text-text flex items-center gap-2">
            <Shield size={18} className="text-primary" /> Clubs Matrix
          </h2>
          <p className="text-xs text-muted">
            Browse official football clubs, venue structures, coach info, and squad registries.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search clubs, manager, stadium..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-border/20 border border-border/60 rounded-lg pl-9 pr-3 py-1.5 text-xs text-text placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      {/* League Selection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {LEAGUE_FILTERS.map((league) => (
          <button
            key={league.code}
            onClick={() => setSelectedLeague(league.code)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedLeague === league.code
                ? "bg-primary/10 text-primary border-primary/40 shadow-xs"
                : "bg-border/20 text-muted border-border/40 hover:text-text hover:border-border"
            }`}
          >
            {league.logo && (
              <img src={league.logo} alt="" className="w-4 h-4 object-contain" />
            )}
            <span>{league.name}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <Loading text={`Retrieving ${selectedLeague} club registries...`} />
      ) : filteredTeams.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((t) => (
            <TeamCard key={t.id} team={t} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-border/60 rounded-xl">
          <Shield size={32} className="mx-auto text-muted/50 mb-2" />
          <p className="text-sm font-semibold text-text">No clubs found</p>
          <p className="text-xs text-muted mt-1">
            {searchTerm
              ? `No club matching "${searchTerm}" in selected league.`
              : "No team registry available for this competition."}
          </p>
        </div>
      )}
    </div>
  );
};

export default Teams;
