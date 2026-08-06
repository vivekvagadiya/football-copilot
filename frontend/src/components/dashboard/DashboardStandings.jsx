import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { Trophy } from "lucide-react";
import { Card } from "../ui/Card";
import { TeamLogo } from "../football/TeamLogo";
import { getStandingsApi } from "../../api/football.api";
import { LEAGUE_FILTERS } from "../../constants/leagues";

const SEASONS = [
  { value: "2025", label: "2025/2026" },
  { value: "2024", label: "2024/2025" },
  { value: "2023", label: "2023/2024" },
  { value: "2022", label: "2022/2023" },
  { value: "2021", label: "2021/2022" },
];

export const DashboardStandings = () => {
  const navigate = useNavigate();
  const [selectedLeague, setSelectedLeague] = useState("PL");
  const [selectedSeason, setSelectedSeason] = useState("2025");
  const [isLeagueDropdownOpen, setIsLeagueDropdownOpen] = useState(false);

  // Fetch standings preview - cache for 30 minutes
  const { data: plTeamsRaw = [], isLoading: loadingStandings } = useQuery({
    queryKey: ["standingsPreview", selectedLeague, selectedSeason],
    queryFn: () => getStandingsApi(selectedLeague, selectedSeason),
    staleTime: 1800000,
  });

  const plTeams = plTeamsRaw.slice(0, 10);

  return (
    <Card className="p-4 border border-border">
      <div className="flex justify-between items-center mb-2.5">
        <h4 className="font-display font-bold text-xs text-text flex items-center gap-1.5">
          <Trophy size={14} className="text-muted" /> Standings Preview
        </h4>
        <Link
          to={`/league/${selectedLeague}`}
          className="text-[10px] text-primary hover:underline"
        >
          Full Table
        </Link>
      </div>

      {/* Dropdown Filters Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* Custom League Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsLeagueDropdownOpen(!isLeagueDropdownOpen)}
            className="w-full flex items-center justify-between bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs font-semibold text-text focus:outline-none focus:border-primary/50 cursor-pointer"
          >
            {(() => {
              const activeLeague = LEAGUE_FILTERS.find(
                (l) => l.code === selectedLeague,
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

          {isLeagueDropdownOpen && (
            <>
              {/* Backdrop Overlay to handle clicking away */}
              <div
                className="fixed inset-0 z-30 cursor-default"
                onClick={() => setIsLeagueDropdownOpen(false)}
              />

              {/* Options Menu */}
              <div className="absolute left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-40 max-h-48 overflow-y-auto no-scrollbar">
                {LEAGUE_FILTERS.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setSelectedLeague(l.code);
                      setIsLeagueDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-border/25 transition-colors cursor-pointer ${
                      selectedLeague === l.code
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
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
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

      <div className="space-y-2">
        <div className="grid grid-cols-6 text-[10px] font-bold text-muted px-2 border-b border-border/40 pb-1">
          <span className="col-span-3">Club</span>
          <span className="text-center">PL</span>
          <span className="text-center">GD</span>
          <span className="text-center">PTS</span>
        </div>

        {loadingStandings ? (
          <div className="space-y-3 py-4 px-2">
            <div className="h-4 bg-border/20 rounded animate-pulse w-full" />
            <div className="h-4 bg-border/20 rounded animate-pulse w-full" />
            <div className="h-4 bg-border/20 rounded animate-pulse w-full" />
            <div className="h-4 bg-border/20 rounded animate-pulse w-full" />
          </div>
        ) : plTeams.length > 0 ? (
          plTeams.map((team, idx) => (
            <div
              key={team.id}
              onClick={() => navigate(`/team/${team.id}`)}
              className="grid grid-cols-6 text-xs text-text py-1.5 px-2 hover:bg-border/20 rounded cursor-pointer transition-all items-center"
            >
              <span className="col-span-3 font-semibold flex items-center gap-1.5 truncate">
                <span className="text-muted text-[10px]">{idx + 1}</span>
                <TeamLogo
                  logo={team.logo}
                  name={team.name}
                  className="w-4 h-4"
                  fallbackSize="text-sm"
                />
                <span className="truncate">{team.name}</span>
              </span>
              <span className="text-center text-[10px] font-medium text-muted">
                {team.played}
              </span>
              <span className="text-center text-[10px] font-medium text-muted">
                +{team.gd}
              </span>
              <span className="text-center font-bold text-primary">
                {team.points}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-xs text-muted">
            No standings data available for this season.
          </div>
        )}
      </div>
    </Card>
  );
};
