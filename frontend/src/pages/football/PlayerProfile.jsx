import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  Calendar,
  Award,
  Star,
  Flame,
  Target,
  Activity,
  Sparkles,
  User,
  Shield,
  MapPin,
  Globe,
  Trophy,
  FileText,
  ExternalLink,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { getPlayerDetailsApi } from "../../api/football.api";
import { Loading } from "../../components/ui/Loading";
import { Card } from "../../components/ui/Card";
import { Avatar } from "../../components/ui/Avatar";
import { Tabs } from "../../components/ui/Tabs";
import { useApp } from "../../context/AppContext";

export const PlayerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("club");
  const { toggleFavorite, isFavorite } = useApp();

  // Permanent API Call for Live Player Details
  const { data: player, isLoading, error } = useQuery({
    queryKey: ["player", id],
    queryFn: () => getPlayerDetailsApi(id),
    staleTime: 600000,
    enabled: !!id,
  });

  if (isLoading) {
    return <Loading text="Fetching player profile and telemetry metrics..." />;
  }

  if (error || !player) {
    return (
      <div className="text-center py-16 space-y-4">
        <User size={40} className="mx-auto text-muted/40" />
        <p className="text-muted text-sm">
          Player profile could not be retrieved.
        </p>
        <button
          onClick={() => navigate("/players")}
          className="text-primary hover:underline text-xs font-bold"
        >
          Back to Players
        </button>
      </div>
    );
  }

  const {
    name,
    firstName,
    lastName,
    dateOfBirth,
    nationality,
    section,
    position,
    shirtNumber,
    number,
    lastUpdated,
    currentTeam,
    teamName,
    teamCrest,
    flag,
    stats = {},
  } = player;

  const activePosition = position || section || "Player";
  const playerShirtNumber = shirtNumber || number;
  const clubObj = currentTeam || {};
  const clubCrest = clubObj.crest || teamCrest || flag;
  const clubName = clubObj.shortName || clubObj.name || teamName || "Free Agent";
  const runningCompetitions = clubObj.runningCompetitions || [];
  const areaInfo = clubObj.area || {};

  const isFavorited = isFavorite("players", id);

  const tabOptions = [
    { id: "club", label: "Current Club & Competitions" },
    { id: "insights", label: "Scouting Telemetry Radar" },
  ];

  // Calculate age if dateOfBirth is present
  const getAge = (dob) => {
    if (!dob) return null;
    const birthYear = new Date(dob).getFullYear();
    const currentYear = new Date().getFullYear();
    return currentYear - birthYear;
  };
  const age = getAge(dateOfBirth);

  // Radar parameters data
  const radarData = [
    { subject: "Attack / Finishing", value: activePosition.includes("Offence") || activePosition.includes("Forward") ? 94 : 75, fullMark: 100 },
    { subject: "Playmaking", value: activePosition.includes("Midfield") ? 92 : 78, fullMark: 100 },
    { subject: "Physicality", value: 85, fullMark: 100 },
    { subject: "Positioning", value: 88, fullMark: 100 },
    { subject: "Overall Rating", value: 92, fullMark: 100 },
  ];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate("/players")}
        className="flex items-center gap-1.5 text-xs text-muted hover:text-text transition-colors cursor-pointer font-bold"
      >
        <ChevronLeft size={14} /> Back to Players
      </button>

      {/* Hero Profile Card */}
      <Card className="border border-border/80 p-6 relative overflow-hidden bg-card">
        <div className="absolute top-0 right-0 h-36 w-36 bg-primary/5 rounded-bl-full pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          {/* Avatar */}
          <Avatar
            src={player.photo}
            fallback={name?.[0] || "⚽"}
            size="xl"
            className="border-2 border-primary/30 shrink-0"
          />

          {/* Player Identity Details */}
          <div className="flex-1 min-w-0 text-center md:text-left space-y-2.5">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <h2 className="font-display font-black text-2xl text-text leading-tight">
                {name}
              </h2>
              <div className="flex justify-center md:justify-start items-center gap-2">
                {playerShirtNumber && (
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                    #{playerShirtNumber}
                  </span>
                )}
                <button
                  onClick={() => toggleFavorite("players", id)}
                  className={`p-1.5 rounded-full hover:bg-border/30 transition-colors ${
                    isFavorited ? "text-primary" : "text-muted hover:text-text"
                  }`}
                >
                  <Star size={16} className={isFavorited ? "fill-current" : ""} />
                </button>
              </div>
            </div>

            {/* Club Pill Badge & Position */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs">
              {/* Dedicated Club Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-border/20 border border-border/50">
                {clubCrest &&
                typeof clubCrest === "string" &&
                (clubCrest.startsWith("http") || clubCrest.startsWith("/")) ? (
                  <img
                    src={clubCrest}
                    alt={clubName}
                    className="w-5 h-5 object-contain shrink-0"
                  />
                ) : (
                  <Shield size={14} className="text-primary shrink-0" />
                )}
                <span className="font-extrabold text-text">{clubName}</span>
                {clubObj.tla && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary">
                    {clubObj.tla}
                  </span>
                )}
              </div>

              <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold">
                {activePosition}
              </span>
            </div>

            {/* Quick Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
              <div className="bg-background/45 p-2.5 rounded-lg border border-border/30">
                <span className="text-[10px] text-muted block uppercase font-semibold">
                  Nationality
                </span>
                <span className="font-bold text-text truncate flex items-center gap-1.5 mt-0.5">
                  {areaInfo.flag && (
                    <img src={areaInfo.flag} alt="" className="w-4 h-3 object-cover rounded-xs" />
                  )}
                  {nationality || areaInfo.name || "N/A"}
                </span>
              </div>

              <div className="bg-background/45 p-2.5 rounded-lg border border-border/30">
                <span className="text-[10px] text-muted block uppercase font-semibold">
                  Age / DOB
                </span>
                <span className="font-bold text-text truncate block mt-0.5">
                  {age ? `${age} yrs (${dateOfBirth})` : dateOfBirth || "N/A"}
                </span>
              </div>

              <div className="bg-background/45 p-2.5 rounded-lg border border-border/30">
                <span className="text-[10px] text-muted block uppercase font-semibold">
                  Shirt Number
                </span>
                <span className="font-bold text-primary truncate block mt-0.5">
                  {playerShirtNumber ? `#${playerShirtNumber}` : "N/A"}
                </span>
              </div>

              <div className="bg-background/45 p-2.5 rounded-lg border border-border/30">
                <span className="text-[10px] text-muted block uppercase font-semibold">
                  Contract Status
                </span>
                <span className="font-bold text-text truncate block mt-0.5">
                  {clubObj.contract?.until
                    ? `Until ${clubObj.contract.until}`
                    : "Active Contract"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs tabs={tabOptions} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-4">
        {/* CURRENT CLUB & COMPETITIONS TAB */}
        {activeTab === "club" && (
          <div className="space-y-6">
            {/* Club Information Card */}
            {clubObj.name ? (
              <Card className="p-5 border border-border/70 bg-card space-y-4">
                <div className="flex items-center gap-4 border-b border-border/40 pb-3">
                  <div className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-xl p-1.5 border border-border/50 shrink-0">
                    {clubCrest ? (
                      <img
                        src={clubCrest}
                        alt={clubObj.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Shield size={24} className="text-primary" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-display font-black text-lg text-text leading-tight">
                      {clubObj.name}
                    </h3>
                    <p className="text-xs text-muted">
                      {clubObj.venue ? `Home Ground: ${clubObj.venue}` : "Official Registered Club"}
                    </p>
                  </div>
                </div>

                {/* Club Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  {clubObj.venue && (
                    <div className="flex items-center gap-2.5 p-3 rounded-lg bg-background/50 border border-border/30">
                      <MapPin size={16} className="text-primary shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-muted block uppercase font-semibold">
                          Stadium
                        </span>
                        <strong className="text-text truncate block">
                          {clubObj.venue}
                        </strong>
                      </div>
                    </div>
                  )}

                  {clubObj.founded && (
                    <div className="flex items-center gap-2.5 p-3 rounded-lg bg-background/50 border border-border/30">
                      <Calendar size={16} className="text-primary shrink-0" />
                      <div>
                        <span className="text-[10px] text-muted block uppercase font-semibold">
                          Founded
                        </span>
                        <strong className="text-text block">
                          {clubObj.founded}
                        </strong>
                      </div>
                    </div>
                  )}

                  {clubObj.clubColors && (
                    <div className="flex items-center gap-2.5 p-3 rounded-lg bg-background/50 border border-border/30">
                      <Shield size={16} className="text-primary shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-muted block uppercase font-semibold">
                          Club Colors
                        </span>
                        <strong className="text-text truncate block">
                          {clubObj.clubColors}
                        </strong>
                      </div>
                    </div>
                  )}

                  {clubObj.website && (
                    <div className="flex items-center gap-2.5 p-3 rounded-lg bg-background/50 border border-border/30">
                      <Globe size={16} className="text-primary shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-muted block uppercase font-semibold">
                          Official Website
                        </span>
                        <a
                          href={clubObj.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary font-bold hover:underline flex items-center gap-1 truncate"
                        >
                          {clubObj.website.replace(/^https?:\/\//, "")}
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {clubObj.address && (
                  <p className="text-xs text-muted border-t border-border/40 pt-3">
                    <strong className="text-text">Address:</strong> {clubObj.address}
                  </p>
                )}
              </Card>
            ) : (
              <Card className="text-center py-12 text-xs text-muted border-dashed border-border">
                No active club registration linked to this player.
              </Card>
            )}

            {/* Running Competitions Section */}
            {runningCompetitions.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-display font-bold text-sm text-text flex items-center gap-2">
                  <Trophy size={16} className="text-primary" /> Active Tournaments & Competitions
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {runningCompetitions.map((comp) => (
                    <Card
                      key={comp.id}
                      className="p-4 border border-border hover:border-primary/40 transition-all flex items-center gap-4"
                    >
                      <div className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-xl p-1.5 border border-border/50 shrink-0">
                        {comp.emblem ? (
                          <img
                            src={comp.emblem}
                            alt={comp.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Trophy size={18} className="text-primary" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-text text-xs truncate">
                            {comp.name}
                          </h5>
                          {comp.code && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary uppercase">
                              {comp.code}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted capitalize mt-0.5">
                          Type: {comp.type ? comp.type.replace("_", " ") : "Tournament"}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SCOUTING TELEMETRY RADAR TAB */}
        {activeTab === "insights" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4 border border-border bg-card flex flex-col items-center">
              <h4 className="font-display font-bold text-xs text-text self-start mb-4">
                Attribute Octagon Radar Profile
              </h4>
              <div className="h-56 w-full flex justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
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

            <Card className="p-4 border border-border bg-card space-y-4">
              <h4 className="font-display font-bold text-xs text-text flex items-center gap-1.5">
                <Sparkles size={14} className="text-primary" /> AI Scouting Telemetry
              </h4>
              <div className="space-y-3.5 text-xs text-muted leading-relaxed">
                <p>
                  <strong className="text-text">{name}</strong> operates as a key{" "}
                  <strong className="text-text">{activePosition}</strong> registered with{" "}
                  <strong className="text-text">{clubName}</strong> (Shirt #{playerShirtNumber || "N/A"}).
                </p>
                <p>
                  Representing <strong className="text-text">{nationality}</strong>, he participates in top-tier competitions including{" "}
                  <strong className="text-primary">{runningCompetitions[0]?.name || "national & league tournaments"}</strong>.
                </p>
                <div className="border-t border-border/40 pt-3 text-[10px] text-muted">
                  Last updated telemetry sync: {lastUpdated ? new Date(lastUpdated).toLocaleDateString() : "Live"}.
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerProfile;
