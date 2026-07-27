import React from "react";
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
} from "lucide-react";
import { apiService } from "../../services/apiService";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../../components/ui/Card";
import { ScoreCard } from "../../components/football/ScoreCard";
import { FixtureCard } from "../../components/football/FixtureCard";
import { TransferCard } from "../../components/football/TransferCard";
import { Loading } from "../../components/ui/Loading";
import { Button } from "../../components/ui/Button";
import { getDashboardData } from "../../api/football.api";

export const Dashboard = () => {
  const navigate = useNavigate();

  // Fetch all matches, news, and transfers using TanStack Query
  const { data: matches = [], isLoading: loadingMatches } = useQuery({
    queryKey: ["matches"],
    queryFn: apiService.getMatches,
  });

  const { data: news = [], isLoading: loadingNews } = useQuery({
    queryKey: ["news"],
    queryFn: apiService.getNews,
  });

  const { data: transfers = [], isLoading: loadingTransfers } = useQuery({
    queryKey: ["transfers"],
    queryFn: apiService.getTransfers,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: apiService.getTeams,
  });

  const { data: players = [] } = useQuery({
    queryKey: ["players"],
    queryFn: apiService.getPlayers,
  });

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboardData,
    staleTime: 10000,
    refetchOnMount: true,
    refetchInterval: 60000,
    refetchIntervalInBackground: true,
  });

  console.log("dashboardData", dashboardData);

  const liveMatches = matches.filter((m) => m.status === "live");
  const upcomingMatches = matches
    .filter((m) => m.status === "upcoming")
    .slice(0, 2);
  const topScorers = [...players]
    .sort((a, b) => b.stats.goals - a.stats.goals)
    .slice(0, 3);

  // Sort teams for a quick mini table preview (Premier League)
  const plTeams = teams
    .filter((t) => t.leagueId === "pl")
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 4);

  const isLoading =
    loadingMatches || loadingNews || loadingTransfers || dashboardLoading;

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
                <Calendar size={14} className="text-muted" /> Today's Match
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
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-display font-bold text-xs text-text flex items-center gap-1.5">
                <Award size={14} className="text-muted" /> Standings Preview
              </h4>
              <Link
                to="/league/pl"
                className="text-[10px] text-primary hover:underline"
              >
                Full Table
              </Link>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-6 text-[10px] font-bold text-muted px-2 border-b border-border/40 pb-1">
                <span className="col-span-3">Club</span>
                <span className="text-center">PL</span>
                <span className="text-center">GD</span>
                <span className="text-center">PTS</span>
              </div>
              {plTeams.map((team, idx) => (
                <div
                  key={team.id}
                  onClick={() => navigate(`/team/${team.id}`)}
                  className="grid grid-cols-6 text-xs text-text py-1.5 px-2 hover:bg-border/20 rounded cursor-pointer transition-all items-center"
                >
                  <span className="col-span-3 font-semibold flex items-center gap-1.5 truncate">
                    <span className="text-muted text-[10px]">{idx + 1}</span>
                    <span className="text-sm leading-none">{team.logo}</span>
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
              ))}
            </div>
          </Card>

          {/* Top Scorers */}
          <Card className="p-4 border border-border">
            <h4 className="font-display font-bold text-xs text-text flex items-center gap-1.5 mb-3.5">
              ⚽ Golden Boot Leaderboard
            </h4>
            <div className="space-y-3">
              {topScorers.map((player, idx) => (
                <div
                  key={player.id}
                  onClick={() => navigate(`/player/${player.id}`)}
                  className="flex items-center justify-between hover:bg-border/25 p-1.5 rounded cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-muted w-4">
                      {idx + 1}
                    </span>
                    <span className="text-xs">{player.flag}</span>
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
              ))}
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
