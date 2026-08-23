import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Volleyball } from "lucide-react";
import { Card } from "../ui/Card";
import { getPlayerLeaderboardApi } from "../../api/football.api";
import { LEAGUE_FILTERS } from "../../constants/leagues";

const SEASONS = [
  { value: "2026", label: "2026/2027" },
  { value: "2025", label: "2025/2026" },
  { value: "2024", label: "2024/2025" },
  { value: "2023", label: "2023/2024" },
  { value: "2022", label: "2022/2023" },
  { value: "2021", label: "2021/2022" },
];

export const DashboardLeaderboard = () => {
  const navigate = useNavigate();
  const [selectedScorerLeague, setSelectedScorerLeague] = useState("PL");
  const [selectedScorerSeason, setSelectedScorerSeason] = useState("2026");
  const [isScorerLeagueDropdownOpen, setIsScorerLeagueDropdownOpen] =
    useState(false);

  // Fetch top scorers leaderboard - cache for 30 minutes
  const { data: topScorers = [], isLoading: loadingLeaderboard } = useQuery({
    queryKey: ["playerLeaderboard", selectedScorerLeague, selectedScorerSeason],
    queryFn: () =>
      getPlayerLeaderboardApi(selectedScorerLeague, selectedScorerSeason),
    staleTime: 1800000,
  });

  return (
    <Card className="p-4 border border-border">
      <h4 className="font-display font-bold text-xs text-text flex items-center gap-1.5 mb-3">
        <Volleyball size={14} className="text-muted" /> Golden Boot Leaderboard
      </h4>

      {/* Dropdown Filters Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3.5">
        {/* Custom League Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() =>
              setIsScorerLeagueDropdownOpen(!isScorerLeagueDropdownOpen)
            }
            className="w-full flex items-center justify-between bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs font-semibold text-text focus:outline-none focus:border-primary/50 cursor-pointer"
          >
            {(() => {
              const activeLeague = LEAGUE_FILTERS.find(
                (l) => l.code === selectedScorerLeague,
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
                    {activeLeague ? activeLeague.name : "Select League"}
                  </span>
                </span>
              );
            })()}
            <span className="text-muted text-[8px] ml-1 shrink-0">▼</span>
          </button>

          {isScorerLeagueDropdownOpen && (
            <>
              {/* Backdrop Overlay to handle clicking away */}
              <div
                className="fixed inset-0 z-30 cursor-default"
                onClick={() => setIsScorerLeagueDropdownOpen(false)}
              />

              {/* Options Menu */}
              <div className="absolute left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-40 max-h-48 overflow-y-auto no-scrollbar">
                {LEAGUE_FILTERS.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setSelectedScorerLeague(l.code);
                      setIsScorerLeagueDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-border/25 transition-colors cursor-pointer ${
                      selectedScorerLeague === l.code
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

        {/* Season Selector Dropdown */}
        <div>
          <select
            value={selectedScorerSeason}
            onChange={(e) => setSelectedScorerSeason(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs font-semibold text-text focus:outline-none focus:border-primary/50 cursor-pointer"
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

      <div className="">
        {loadingLeaderboard ? (
          <div className="space-y-3 py-4 px-2">
            <div className="h-4 bg-border/20 rounded animate-pulse w-full" />
            <div className="h-4 bg-border/20 rounded animate-pulse w-full" />
            <div className="h-4 bg-border/20 rounded animate-pulse w-full" />
            <div className="h-4 bg-border/20 rounded animate-pulse w-full" />
          </div>
        ) : topScorers.length > 0 ? (
          topScorers.slice(0, 10).map((player, idx) => (
            <div
              key={player.id}
              onClick={() => navigate(`/player/${player.id}`)}
              className="flex items-center justify-between hover:bg-border/25 p-1.5 rounded cursor-pointer transition-all"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-muted w-4">
                  {idx + 1}
                </span>
                <div className="w-5 h-5 flex items-center justify-center bg-white rounded-full p-0.5 shadow-sm shrink-0">
                  <img
                    src={player.flag}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-text truncate leading-tight">
                    {player.name}
                  </p>
                  <p className="text-[9px] text-muted">
                    {player.teamName} • {player.position}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-display font-extrabold text-xs text-primary">
                  {player.stats.goals}
                </span>
                <span className="text-[8px] text-muted block">goals</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-xs text-muted">
            No scorer data available for this season.
          </div>
        )}
      </div>
    </Card>
  );
};
