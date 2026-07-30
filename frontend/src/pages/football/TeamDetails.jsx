import React, { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  MapPin,
  Users,
  Globe,
  Trophy,
  Calendar,
  Star,
  Info,
  Shield,
  User,
  Flag,
  ExternalLink,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { apiService } from "../../services/apiService";
import { Loading } from "../../components/ui/Loading";
import { Card } from "../../components/ui/Card";
import { Tabs } from "../../components/ui/Tabs";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { FixtureCard } from "../../components/football/FixtureCard";
import { useApp } from "../../context/AppContext";

export const TeamDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("squad");
  const [positionFilter, setPositionFilter] = useState("ALL");
  const { toggleFavorite, isFavorite } = useApp();

  const stateTeam = location.state?.team;

  const { data: fetchedTeam, isLoading } = useQuery({
    queryKey: ["team", id],
    queryFn: () => apiService.getTeam(id),
    enabled: !stateTeam && !!id,
  });

  const team = stateTeam || fetchedTeam;

  if (isLoading && !team) {
    return <Loading text="Fetching club roster and telemetry charts..." />;
  }

  if (!team) {
    return (
      <div className="text-center py-16 space-y-4">
        <Shield size={40} className="mx-auto text-muted/40" />
        <p className="text-muted text-sm">
          Club details could not be retrieved.
        </p>
        <button
          onClick={() => navigate("/teams")}
          className="text-primary hover:underline text-xs font-bold"
        >
          Back to Clubs
        </button>
      </div>
    );
  }

  const {
    name,
    shortName,
    tla,
    crest,
    logo,
    cover,
    coach,
    manager,
    venue,
    stadium,
    founded,
    clubColors,
    website,
    address,
    area,
    runningCompetitions = [],
    squad = [],
    players = [],
    fixtures = [],
    rank,
    points,
    stats = {},
  } = team;

  const teamCrest = crest || logo;
  const managerName =
    coach?.name ||
    (coach?.firstName ? `${coach.firstName} ${coach.lastName}` : null) ||
    manager ||
    "N/A";
  const venueName = venue || stadium || "N/A";
  const allSquadPlayers = squad.length > 0 ? squad : players;
  const isFavorited = isFavorite("teams", id);

  const tabOptions = [
    { id: "squad", label: `Squad Roster (${allSquadPlayers.length})` },
    {
      id: "competitions",
      label: `Competitions (${runningCompetitions.length})`,
    },
    { id: "info", label: "Club Profile & Stats" },
  ];

  // Positions filter for Squad
  const positions = ["ALL", "Goalkeeper", "Defence", "Midfield", "Offence"];
  const filteredSquad = allSquadPlayers.filter((p) => {
    if (positionFilter === "ALL") return true;
    return (
      p.position?.toLowerCase() === positionFilter.toLowerCase() ||
      (positionFilter === "Offence" &&
        ["offence", "attacker", "forward"].includes(p.position?.toLowerCase()))
    );
  });

  // Recharts Chart datasets
  const chartData = [
    { name: "Goals Scored", value: stats.goalsScored || 64 },
    { name: "Goals Conceded", value: stats.goalsConceded || 26 },
    { name: "Clean Sheets", value: stats.cleanSheets || 12 },
  ];

  const radarData = [
    { subject: "Possession %", value: stats.possession || 58, fullMark: 100 },
    {
      subject: "Pass Accuracy %",
      value: stats.passAccuracy || 86,
      fullMark: 100,
    },
    {
      subject: "Goals Scored x10",
      value: (stats.goalsScored || 64) / 10,
      fullMark: 100,
    },
    {
      subject: "Clean Sheets x5",
      value: (stats.cleanSheets || 12) * 5,
      fullMark: 100,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate("/teams")}
        className="flex items-center gap-1.5 text-xs text-muted hover:text-text transition-colors cursor-pointer font-bold"
      >
        <ChevronLeft size={14} /> Back to Clubs
      </button>

      {/* Hero Header Card */}
      <div className="relative rounded-2xl overflow-hidden border border-border shadow-md bg-card p-6">
        {cover && (
          <img
            src={cover}
            alt="Cover"
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
        )}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 flex items-center justify-center bg-white/10 rounded-2xl p-2.5 border border-border/60 shadow-lg shrink-0">
              {typeof teamCrest === "string" &&
              (teamCrest.startsWith("http") || teamCrest.startsWith("/")) ? (
                <img
                  src={teamCrest}
                  alt={name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-5xl leading-none">
                  {teamCrest || "🛡️"}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-display font-black text-2xl text-text leading-tight">
                  {name}
                </h2>
                {tla && (
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 uppercase">
                    {tla}
                  </span>
                )}
                <button
                  onClick={() => toggleFavorite("teams", id)}
                  className={`p-1.5 rounded-full hover:bg-border/30 transition-colors ${
                    isFavorited ? "text-primary" : "text-muted hover:text-text"
                  }`}
                >
                  <Star
                    size={16}
                    className={isFavorited ? "fill-current" : ""}
                  />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted mt-1.5">
                {area?.name && (
                  <span className="flex items-center gap-1">
                    {area.flag && (
                      <img
                        src={area.flag}
                        alt=""
                        className="w-4 h-3 object-cover rounded-xs"
                      />
                    )}
                    {area.name}
                  </span>
                )}
                {venueName !== "N/A" && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-primary/70" />
                    {venueName}
                  </span>
                )}
                {founded && (
                  <span>
                    Est. <strong className="text-text">{founded}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex items-center gap-4 text-xs border-t md:border-t-0 md:border-l border-border/50 pt-3 md:pt-0 md:pl-6">
            <div>
              <span className="text-muted block text-[10px] uppercase font-semibold">
                Head Coach
              </span>
              <strong className="text-text font-bold text-sm">
                {managerName}
              </strong>
            </div>
            {clubColors && (
              <div className="border-l border-border/50 pl-4">
                <span className="text-muted block text-[10px] uppercase font-semibold">
                  Club Colors
                </span>
                <strong className="text-primary font-bold text-sm">
                  {clubColors}
                </strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabOptions} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-4">
        {/* SQUAD ROSTER TAB */}
        {activeTab === "squad" && (
          <div className="space-y-4">
            {/* Position Filter Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {positions.map((pos) => (
                <button
                  key={pos}
                  onClick={() => setPositionFilter(pos)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    positionFilter === pos
                      ? "bg-primary text-white shadow-xs"
                      : "bg-border/20 text-muted hover:text-text hover:bg-border/40"
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>

            {/* Squad Grid */}
            {filteredSquad.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSquad.map((p) => (
                  <Card
                    key={p.id}
                    onClick={() =>
                      navigate(`/player/${p.id}`, {
                        // state: {
                        //   player: {
                        //     id: String(p.id),
                        //     name: p.name,
                        //     position: p.position,
                        //     nationality: p.nationality,
                        //     dateOfBirth: p.dateOfBirth,
                        //     teamName: name,
                        //     teamCrest: teamCrest,
                        //   },
                        // },
                      })
                    }
                    className="p-4 border border-border hover:border-primary/40 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-extrabold text-primary shrink-0 group-hover:scale-105 transition-transform">
                        {p.photo ? (
                          <img
                            src={p.photo}
                            alt={p.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          p.name?.[0] || <User size={18} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-bold text-text group-hover:text-primary transition-colors text-xs truncate">
                          {p.name}
                        </h5>
                        <div className="flex items-center gap-2 text-[10px] text-muted mt-0.5">
                          <span className="font-medium px-1.5 py-0.5 rounded bg-border/30 text-text/90">
                            {p.position || "N/A"}
                          </span>
                          {p.number && <span>#{p.number}</span>}
                          {p.nationality && <span>• {p.nationality}</span>}
                        </div>
                      </div>
                    </div>

                    {p.dateOfBirth && (
                      <div className="text-right shrink-0 text-[10px] text-muted">
                        <span>Born</span>
                        <span className="block font-semibold text-text">
                          {p.dateOfBirth}
                        </span>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12 text-xs text-muted border-dashed border-border">
                No players listed for position filter "{positionFilter}".
              </Card>
            )}
          </div>
        )}

        {/* COMPETITIONS TAB */}
        {activeTab === "competitions" && (
          <div className="space-y-4">
            {runningCompetitions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {runningCompetitions.map((comp) => (
                  <Card
                    key={comp.id}
                    className="p-4 border border-border hover:border-primary/40 transition-all flex items-center gap-4"
                  >
                    <div className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-xl p-1.5 border border-border/50 shrink-0">
                      {comp.emblem ? (
                        <img
                          src={comp.emblem}
                          alt={comp.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Trophy size={20} className="text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-text text-sm truncate">
                          {comp.name}
                        </h5>
                        {comp.code && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase">
                            {comp.code}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted capitalize mt-0.5">
                        Type:{" "}
                        {comp.type ? comp.type.replace("_", " ") : "Tournament"}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12 text-xs text-muted border-dashed border-border">
                No active competition logs currently available for this club.
              </Card>
            )}
          </div>
        )}

        {/* CLUB PROFILE & STATS TAB */}
        {activeTab === "info" && (
          <div className="space-y-6">
            {/* Meta Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4 border border-border/60">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <MapPin size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-muted block uppercase font-semibold">
                      Home Stadium
                    </span>
                    <strong className="text-xs text-text font-bold truncate block">
                      {venueName}
                    </strong>
                  </div>
                </div>
              </Card>

              <Card className="p-4 border border-border/60">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block uppercase font-semibold">
                      Founded Year
                    </span>
                    <strong className="text-xs text-text font-bold">
                      {founded || "N/A"}
                    </strong>
                  </div>
                </div>
              </Card>

              <Card className="p-4 border border-border/60">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Globe size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-muted block uppercase font-semibold">
                      Official Website
                    </span>
                    {website ? (
                      <a
                        href={website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary font-bold hover:underline flex items-center gap-1 truncate"
                      >
                        {website.replace(/^https?:\/\//, "")}
                        <ExternalLink size={10} />
                      </a>
                    ) : (
                      <strong className="text-xs text-text font-bold">
                        N/A
                      </strong>
                    )}
                  </div>
                </div>
              </Card>

              <Card className="p-4 border border-border/60">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Shield size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-muted block uppercase font-semibold">
                      Club Address
                    </span>
                    <strong className="text-xs text-text font-bold truncate block">
                      {address || "N/A"}
                    </strong>
                  </div>
                </div>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recharts Bar chart */}
              <Card className="p-4 border border-border bg-card">
                <h4 className="font-display font-bold text-xs text-text mb-4">
                  Goal Scoring & Defensive Telemetry
                </h4>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <XAxis
                        dataKey="name"
                        stroke="var(--muted)"
                        fontSize={10}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="var(--muted)"
                        fontSize={10}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          borderColor: "var(--border)",
                        }}
                        labelStyle={{
                          color: "var(--text)",
                          fontSize: 11,
                          fontWeight: "bold",
                        }}
                        itemStyle={{ color: "var(--primary)", fontSize: 11 }}
                      />
                      <Bar
                        dataKey="value"
                        fill="var(--primary)"
                        radius={[4, 4, 0, 0]}
                        barSize={35}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Recharts Radar chart */}
              <Card className="p-4 border border-border bg-card flex flex-col items-center">
                <h4 className="font-display font-bold text-xs text-text self-start mb-4">
                  Attribute Profile Matrix
                </h4>
                <div className="h-56 w-full flex justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      cx="50%"
                      cy="50%"
                      outerRadius="70%"
                      data={radarData}
                    >
                      <PolarGrid stroke="var(--border)" />
                      <PolarAngleAxis
                        dataKey="subject"
                        stroke="var(--muted)"
                        fontSize={9}
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        stroke="var(--border)"
                        fontSize={8}
                      />
                      <Radar
                        name={name}
                        dataKey="value"
                        stroke="var(--primary)"
                        fill="var(--primary)"
                        fillOpacity={0.25}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          borderColor: "var(--border)",
                        }}
                        itemStyle={{ color: "var(--primary)", fontSize: 11 }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamDetails;
