import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  Award,
  Calendar,
  ListOrdered,
  Shield,
} from "lucide-react";
import { apiService } from "../../services/apiService";
import { Loading } from "../../components/ui/Loading";
import { Card } from "../../components/ui/Card";
import { Tabs } from "../../components/ui/Tabs";
import { FixtureCard } from "../../components/football/FixtureCard";
import { getStandingsApi, getUpcomingMatchesApi } from "../../api/football.api";
import { LEAGUE_FILTERS } from "../../constants/leagues";

export const LeagueDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("table");

  const { data: league, isLoading } = useQuery({
    queryKey: ["league", id],
    // queryFn: () => apiService.getLeague(id),
    queryFn: () => apiService.getLeague("pl"),
    enabled: !!id,
  });

  const { data: leagueStandings = [], isLoading: loadingStandings } = useQuery({
    queryKey: ["leagueStandings", id],
    queryFn: () => getStandingsApi(id),
  });

  const { data: leagueMatches = [], isLoading: leagueMetchLoading } = useQuery({
    queryKey: ["leagueMatches", id],
    queryFn: () => getUpcomingMatchesApi({ leagueId: id, status: "SCHEDULED" }),
  });
  console.log("leagueStandings", leagueStandings);

  if (isLoading) {
    return <Loading text="Decompressing league roster and standings..." />;
  }

  if (!league) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-muted">League profile not found.</p>
        <button
          onClick={() => navigate("/leagues")}
          className="text-primary hover:underline text-xs font-bold"
        >
          Back to Leagues
        </button>
      </div>
    );
  }

  const {
    name,
    logo,
    country,
    season,
    teams = [],
    matches = [],
  } = LEAGUE_FILTERS.find((l) => l.code === id);

  const tabOptions = [
    { id: "table", label: "Standings Table" },
    { id: "matches", label: "Match Schedule" },
  ];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate("/leagues")}
        className="flex items-center gap-1.5 text-xs text-muted hover:text-text transition-colors cursor-pointer font-bold"
      >
        <ChevronLeft size={14} /> Back to Competitions
      </button>

      {/* Header Profile card */}
      <Card className="border border-border/80 p-5 bg-card flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* <span className="text-5xl leading-none">{logo}</span> */}
          <div className="w-20 h-20 flex items-center justify-center bg-white rounded-full p-1 shadow-sm shrink-0 border border-border/40">
            <img src={logo} alt="" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-lg text-text">
              {name}
            </h2>
            <p className="text-xs text-muted">
              {country} • Season {season}
            </p>
          </div>
        </div>
        {/* <span className="text-xs font-bold font-mono bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-lg shrink-0">
          OS Registered
        </span> */}
      </Card>

      <Tabs tabs={tabOptions} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-4">
        {/* STANDINGS TABLE TAB */}
        {activeTab === "table" && (
          <Card className="p-4 border border-border bg-card overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="grid grid-cols-12 text-[10px] font-bold text-muted px-2 border-b border-border/40 pb-2 mb-2">
                <span className="col-span-1">Rank</span>
                <span className="col-span-5">Club Name</span>
                <span className="text-center">Played</span>
                <span className="text-center">Won</span>
                <span className="text-center">Drawn</span>
                <span className="text-center">Lost</span>
                <span className="text-center">GD</span>
                <span className="text-center">PTS</span>
              </div>

              {loadingStandings ? (
                <div className="space-y-3 py-6 px-4">
                  <div className="h-6 bg-border/20 rounded animate-pulse w-full" />
                  <div className="h-6 bg-border/20 rounded animate-pulse w-full" />
                  <div className="h-6 bg-border/20 rounded animate-pulse w-full" />
                  <div className="h-6 bg-border/20 rounded animate-pulse w-full" />
                  <div className="h-6 bg-border/20 rounded animate-pulse w-full" />
                  <div className="h-6 bg-border/20 rounded animate-pulse w-full" />
                </div>
              ) : leagueStandings?.length > 0 ? (
                leagueStandings?.map((t, idx) => (
                  <div
                    key={t.id}
                    onClick={() => navigate(`/team/${t.id}`)}
                    className="grid grid-cols-12 text-xs py-2 px-2 hover:bg-border/20 rounded cursor-pointer transition-all items-center"
                  >
                    <span className="col-span-1 font-bold text-muted">
                      {idx + 1}
                    </span>
                    <span className="col-span-5 font-semibold flex items-center gap-2 text-text">
                      <div className="w-7 h-7 flex items-center justify-center bg-white rounded-full p-1 shadow-sm shrink-0 border border-border/40">
                        <img
                          src={t.logo}
                          alt=""
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span>{t.name}</span>
                    </span>
                    <span className="text-center font-medium text-muted">
                      {t.played}
                    </span>
                    <span className="text-center font-medium text-muted">
                      {t.won}
                    </span>
                    <span className="text-center font-medium text-muted">
                      {t.drawn}
                    </span>
                    <span className="text-center font-medium text-muted">
                      {t.lost}
                    </span>
                    <span className="text-center font-medium text-muted">
                      {t.gd > 0 ? `+${t.gd}` : t.gd}
                    </span>

                    <span className="text-center font-bold text-primary">
                      {t.points}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted text-center py-6">
                  No squad standings found inside database.
                </p>
              )}
            </div>
          </Card>
        )}

        {/* MATCHES SCHEDULE TAB */}
        {activeTab === "matches" && (
          <div className="space-y-4">
            {leagueMetchLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-24 bg-border/20 rounded-xl animate-pulse" />
                <div className="h-24 bg-border/20 rounded-xl animate-pulse" />
                <div className="h-24 bg-border/20 rounded-xl animate-pulse" />
                <div className="h-24 bg-border/20 rounded-xl animate-pulse" />
              </div>
            ) : leagueMatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {leagueMatches.map((m) => (
                  <FixtureCard key={m.id} match={m} />
                ))}
              </div>
            ) : (
              <Card className="text-center py-12 text-xs text-muted border-dashed border-border">
                No fixtures found for this tournament schedule.
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default LeagueDetails;
