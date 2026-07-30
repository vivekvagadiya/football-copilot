import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import {
  Zap,
  Calendar,
  Award,
  Newspaper,
  ArrowRightLeft,
  Cpu,
  Star,
  ArrowRight,
  User,
  Trophy,
  Volleyball,
} from "lucide-react";
import { apiService } from "../../services/apiService";
import { Card } from "../../components/ui/Card";
import { ScoreCard } from "../../components/football/ScoreCard";
import { FixtureCard } from "../../components/football/FixtureCard";
import { TransferCard } from "../../components/football/TransferCard";
import { TeamLogo } from "../../components/football/TeamLogo";
import { Loading } from "../../components/ui/Loading";
import { Button } from "../../components/ui/Button";
import {
  getLiveMatchesApi,
  getUpcomingMatchesApi,
  getStandingsApi,
  getPlayerLeaderboardApi,
} from "../../api/football.api";
import { LEAGUE_FILTERS } from "../../constants/leagues";

const SEASONS = [
  { value: "2025", label: "2025/2026" },
  { value: "2024", label: "2024/2025" },
  { value: "2023", label: "2023/2024" },
  { value: "2022", label: "2022/2023" },
  { value: "2021", label: "2021/2022" },
];

export const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedLeague, setSelectedLeague] = useState("PL");
  const [selectedSeason, setSelectedSeason] = useState("2025");
  const [isLeagueDropdownOpen, setIsLeagueDropdownOpen] = useState(false);

  const [selectedScorerLeague, setSelectedScorerLeague] = useState("PL");
  const [selectedScorerSeason, setSelectedScorerSeason] = useState("2025");
  const [isScorerLeagueDropdownOpen, setIsScorerLeagueDropdownOpen] =
    useState(false);

  // Fetch live matches - poll every 30s (Option B)
  const { data: liveMatches = [], isLoading: loadingLive } = useQuery({
    queryKey: ["liveMatches"],
    queryFn: getLiveMatchesApi,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // Fetch upcoming matches - cache for 10 minutes (Option B)
  const { data: upcomingMatchesRaw = [], isLoading: loadingUpcoming } =
    useQuery({
      queryKey: ["upcomingMatches", "SCHEDULED"],
      queryFn: () => getUpcomingMatchesApi({ status: "SCHEDULED" }),
      staleTime: 600000,
    });

  const upcomingMatches = upcomingMatchesRaw.slice(0, 4);

  // Fetch standings preview - cache for 30 minutes (Option B)
  const { data: plTeamsRaw = [], isLoading: loadingStandings } = useQuery({
    queryKey: ["standingsPreview", selectedLeague, selectedSeason],
    queryFn: () => getStandingsApi(selectedLeague, selectedSeason),
    staleTime: 1800000,
  });

  const plTeams = plTeamsRaw.slice(0, 10);

  // Fetch top scorers leaderboard - cache for 30 minutes (Option B)
  const { data: topScorers = [], isLoading: loadingLeaderboard } = useQuery({
    queryKey: ["playerLeaderboard", selectedScorerLeague, selectedScorerSeason],
    queryFn: () =>
      getPlayerLeaderboardApi(selectedScorerLeague, selectedScorerSeason),
    staleTime: 1800000,
  });

  // Keep news and transfers on local mock data
  const { data: news = [], isLoading: loadingNews } = useQuery({
    queryKey: ["news"],
    queryFn: apiService.getNews,
  });

  const { data: transfers = [], isLoading: loadingTransfers } = useQuery({
    queryKey: ["transfers"],
    queryFn: apiService.getTransfers,
  });

  const isLoading =
    loadingLive ||
    loadingUpcoming ||
    // loadingStandings ||
    // loadingLeaderboard ||
    loadingNews ||
    loadingTransfers;

  if (isLoading) {
    return <Loading text="Assembling tactical widgets..." />;
  }

  return (
    <div className="space-y-6">
      {/* AI Intelligence Brief Banner */}
      <Card className="border border-primary/20 bg-primary/5 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex gap-3 items-center">
          <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0 animate-pulse">
            <Cpu size={20} />
          </div>
          <div>
            <h3 className="font-display font-bold text-text text-sm flex items-center gap-2">
              Football Copilot Briefing
            </h3>
            <p className="text-xs text-muted max-w-xl">
              Arsenal takes on Manchester City today in the match of the season.
              Haaland leads goals with 28. Real Madrid closes in on Zubimendi.
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate("/ai")}
          className="text-xs shrink-0"
        >
          Ask Copilot
        </Button>
      </Card>

      {/* Grid Layout of widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Live & Fixtures) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live matches widgets */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-display font-extrabold text-sm text-text flex items-center gap-1.5">
                <Zap size={14} className="text-red-500 fill-current" /> Live
                Engines
              </h3>
              <Link
                to="/live"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>
            {liveMatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {liveMatches.map((m) => (
                  <ScoreCard key={m.id} match={m} />
                ))}
              </div>
            ) : (
              <Card className="text-center py-8 text-xs text-muted border-dashed border-border">
                No matches live right now. Check back during match hours.
              </Card>
            )}
          </div>

          {/* Today's Fixtures */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-display font-extrabold text-sm text-text flex items-center gap-1.5">
                <Calendar size={14} className="text-muted" /> Upcoming Match
                Matrix
              </h3>
              <Link
                to="/fixtures"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View Fixtures <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingMatches.map((m) => (
                <FixtureCard key={m.id} match={m} />
              ))}
            </div>
          </div>

          {/* Global News Card items */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-display font-extrabold text-sm text-text flex items-center gap-1.5">
                <Newspaper size={14} className="text-muted" /> News Intelligence
              </h3>
              <Link
                to="/news"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                More news <ArrowRight size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {news.slice(0, 2).map((n) => (
                <Card
                  key={n.id}
                  onClick={() => navigate("/news")}
                  className="cursor-pointer hover:border-primary/20 transition-all flex gap-4 p-4 items-start"
                >
                  <img
                    src={n.image}
                    alt={n.title}
                    className="w-16 h-16 object-cover rounded-lg shrink-0 border border-border"
                  />
                  <div className="space-y-1 min-w-0">
                    <span className="text-[9px] text-primary font-bold uppercase">
                      {n.date}
                    </span>
                    <h4 className="font-semibold text-text text-xs leading-snug line-clamp-2">
                      {n.title}
                    </h4>
                    <p className="text-[10px] text-muted line-clamp-1">
                      {n.summary}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Sidebar widgets: Standings, Scorers, Transfers) */}
        <div className="space-y-6">
          {/* League Table Preview */}
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
              {/* Reusable Premium Custom League Selector Dropdown */}
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

          {/* Top Scorers */}
          <Card className="p-4 border border-border">
            <h4 className="font-display font-bold text-xs text-text flex items-center gap-1.5 mb-3">
              <Volleyball size={14} className="text-muted" /> Golden Boot
              Leaderboard
            </h4>

            {/* Dropdown Filters Grid */}
            <div className="grid grid-cols-2 gap-2 mb-3.5">
              {/* Reusable Premium Custom League Selector Dropdown */}
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

            <div className="space-y-3">
              {loadingLeaderboard ? (
                <div className="space-y-3 py-4 px-2">
                  <div className="h-4 bg-border/20 rounded animate-pulse w-full" />
                  <div className="h-4 bg-border/20 rounded animate-pulse w-full" />
                  <div className="h-4 bg-border/20 rounded animate-pulse w-full" />
                  <div className="h-4 bg-border/20 rounded animate-pulse w-full" />
                </div>
              ) : topScorers.length > 0 ? (
                topScorers.map((player, idx) => (
                  <div
                    key={player.id}
                    onClick={() => navigate(`/player/${player.id}`)}
                    className="flex items-center justify-between hover:bg-border/25 p-1.5 rounded cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-muted w-4">
                        {idx + 1}
                      </span>
                      {/* <span className="text-xs">{player.flag}</span> */}
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

          {/* Transfer Updates */}
          <div>
            <div className="flex justify-between items-center mb-2.5">
              <h3 className="font-display font-extrabold text-sm text-text flex items-center gap-1.5">
                <ArrowRightLeft size={14} className="text-muted" /> Hot Transfer
                Feeds
              </h3>
              <Link
                to="/transfers"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                All transfers <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-3">
              {transfers.slice(0, 1).map((t) => (
                <TransferCard key={t.id} transfer={t} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
