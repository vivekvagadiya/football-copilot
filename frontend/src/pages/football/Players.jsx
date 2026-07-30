import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User, Trophy, Calendar } from "lucide-react";
import { Loading } from "../../components/ui/Loading";
import { PlayerCard } from "../../components/football/PlayerCard";
import { getPlayerLeaderboardApi } from "../../api/football.api";
import { LEAGUE_FILTERS } from "../../constants/leagues";

const SEASONS = [
  { label: "2025/26 Season", value: "2025" },
  { label: "2024/25 Season", value: "2024" },
  { label: "2023/24 Season", value: "2023" },
  { label: "2022/23 Season", value: "2022" },
  { label: "2021/22 Season", value: "2021" },
  { label: "2020/21 Season", value: "2020" },
];

export const Players = () => {
  const [league, setLeague] = useState("PL");
  const [season, setSeason] = useState("2025");

  const { data: players = [], isLoading } = useQuery({
    queryKey: ["players", league, season],
    queryFn: () => getPlayerLeaderboardApi(league, season),
    staleTime: 600000,
  });

  return (
    <div className="space-y-6">
      {/* Header with Season Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <h2 className="font-display font-extrabold text-lg text-text flex items-center gap-2">
            <Trophy size={18} className="text-primary" /> Top Scorers & Player
            Matrix
          </h2>
          <p className="text-xs text-muted">
            Browse official league goal leaders, assists, ratings, penalties,
            and squad statistics.
          </p>
        </div>

        {/* Season Selector */}
        <div className="flex items-center gap-2 bg-border/20 border border-border/60 rounded-xl px-3 py-1.5 shrink-0 self-start sm:self-auto">
          <Calendar size={14} className="text-primary" />
          <span className="text-xs text-muted font-medium">Season:</span>
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="bg-transparent text-xs font-bold text-text focus:outline-none cursor-pointer"
          >
            {SEASONS.map((s) => (
              <option
                key={s.value}
                value={s.value}
                className="bg-card text-text"
              >
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* League Selection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {LEAGUE_FILTERS.map((l) => (
          <button
            key={l.code}
            onClick={() => setLeague(l.code)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
              league === l.code
                ? "bg-primary/10 text-primary border-primary/40 shadow-xs"
                : "bg-border/20 text-muted border-border/40 hover:text-text hover:border-border"
            }`}
          >
            {l.logo && (
              <img src={l.logo} alt="" className="w-4 h-4 object-contain" />
            )}
            <span>{l.name}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <Loading text={`Retrieving top scorers for ${league} (${season})...`} />
      ) : players.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((p) => (
            <PlayerCard key={p.id} player={p} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-border/60 rounded-xl">
          <User size={32} className="mx-auto text-muted/50 mb-2" />
          <p className="text-sm font-semibold text-text">
            No player entries found
          </p>
          <p className="text-xs text-muted mt-1">
            No top scorers data available for season {season} in this
            competition.
          </p>
        </div>
      )}
    </div>
  );
};

export default Players;
