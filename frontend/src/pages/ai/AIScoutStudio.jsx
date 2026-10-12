import React, { useState, useId } from "react";
import {
  UserCheck,
  Search,
  Sparkles,
  Shield,
  Zap,
  Target,
  TrendingUp,
  BarChart2,
  Compass,
  AlertCircle,
  CheckCircle2,
  Sliders,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  Filter,
  Building2,
  Users,
  Users2,
  DollarSign,
  Award,
  Layers,
  ChevronRight,
  Activity,
  Flame,
  ShieldCheck,
  Database,
  FileText,
  CornerDownRight,
  TrendingDown,
  Globe,
  Share2,
  HelpCircle,
  ExternalLink,
  SlidersHorizontal,
  CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import {
  generateScoutingReportApi,
  findSimilarPlayersApi,
  analyzeTacticalFitApi,
} from "../../api/scout.api";

// Curated Discovery Presets categorized by player profile
const FEATURED_PROSPECTS = [
  {
    name: "Jude Bellingham",
    club: "Real Madrid",
    pos: "AM / CM",
    age: 21,
    ovr: 91,
    val: "€180M",
    category: "controller",
    tag: "Generational",
    archetype: "Elite Box-to-Box & Shadow Striker",
    ratings: {
      pace: 82,
      passing: 89,
      dribbling: 90,
      physical: 88,
      defending: 78,
    },
  },
  {
    name: "Lamine Yamal",
    club: "Barcelona",
    pos: "RW",
    age: 17,
    ovr: 89,
    val: "€150M",
    category: "wonderkid",
    tag: "Wonderkid",
    archetype: "Generational Touchline Wizard",
    ratings: {
      pace: 91,
      passing: 88,
      dribbling: 93,
      physical: 68,
      defending: 45,
    },
  },
  {
    name: "Rodri",
    club: "Manchester City",
    pos: "DM / #6",
    age: 28,
    ovr: 91,
    val: "€130M",
    category: "controller",
    tag: "World Class",
    archetype: "Deep-Lying Controller & Anchor",
    ratings: {
      pace: 68,
      passing: 93,
      dribbling: 84,
      physical: 87,
      defending: 91,
    },
  },
  {
    name: "Florian Wirtz",
    club: "Bayer Leverkusen",
    pos: "AM / LW",
    age: 21,
    ovr: 89,
    val: "€130M",
    category: "wonderkid",
    tag: "Elite Creator",
    archetype: "Creative Half-Space Playmaker",
    ratings: {
      pace: 84,
      passing: 91,
      dribbling: 92,
      physical: 72,
      defending: 54,
    },
  },
  {
    name: "William Saliba",
    club: "Arsenal",
    pos: "CB",
    age: 23,
    ovr: 88,
    val: "€80M",
    category: "defender",
    tag: "Defensive Rock",
    archetype: "Modern Ball-Playing Stopper",
    ratings: {
      pace: 85,
      passing: 82,
      dribbling: 76,
      physical: 86,
      defending: 89,
    },
  },
  {
    name: "Bukayo Saka",
    club: "Arsenal",
    pos: "RW",
    age: 23,
    ovr: 88,
    val: "€140M",
    category: "attacker",
    tag: "Direct Threat",
    archetype: "Inverted Direct Winger",
    ratings: {
      pace: 88,
      passing: 86,
      dribbling: 89,
      physical: 79,
      defending: 65,
    },
  },
];

const PRESET_CLUBS = [
  {
    name: "Arsenal",
    manager: "Mikel Arteta",
    league: "Premier League",
    style: "Positional 4-3-3",
  },
  {
    name: "Real Madrid",
    manager: "Carlo Ancelotti",
    league: "La Liga",
    style: "Fluid Counter 4-3-1-2",
  },
  {
    name: "Manchester City",
    manager: "Pep Guardiola",
    league: "Premier League",
    style: "Control 3-2-4-1",
  },
  {
    name: "Barcelona",
    manager: "Hansi Flick",
    league: "La Liga",
    style: "High Press 4-2-3-1",
  },
  {
    name: "Liverpool",
    manager: "Arne Slot",
    league: "Premier League",
    style: "Vertical Press 4-3-3",
  },
  {
    name: "Bayern Munich",
    manager: "Vincent Kompany",
    league: "Bundesliga",
    style: "Dynamic 4-2-3-1",
  },
];

export const AIScoutStudio = () => {
  const [activeTab, setActiveTab] = useState("report"); // 'report' | 'similar' | 'tactical'

  // Tab 1: Scouting Report State
  const [reportQuery, setReportQuery] = useState("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [scoutingReport, setScoutingReport] = useState(null);
  const [discoveryCategory, setDiscoveryCategory] = useState("all");

  // Tab 2: Similar Players State
  const [targetPlayer, setTargetPlayer] = useState("Rodri");
  const [positionFilter, setPositionFilter] = useState("DM");
  const [maxAgeFilter, setMaxAgeFilter] = useState("25");
  const [maxFeeFilter, setMaxFeeFilter] = useState("€45M");
  const [isSearchingSimilar, setIsSearchingSimilar] = useState(false);
  const [similarResults, setSimilarResults] = useState(null);

  // Tab 3: Tactical Fit State
  const [tacticalPlayer, setTacticalPlayer] = useState("Florian Wirtz");
  const [tacticalClub, setTacticalClub] = useState("Manchester City");
  const [tacticalManager, setTacticalManager] = useState("Pep Guardiola");
  const [tacticalRole, setTacticalRole] = useState(
    "Half-Space Playmaker / #10",
  );
  const [isAnalyzingFit, setIsAnalyzingFit] = useState(false);
  const [tacticalFitResult, setTacticalFitResult] = useState(null);

  const [copied, setCopied] = useState(false);

  // Rating color & badge helper
  const getRatingBadge = (rating) => {
    const val = Number(rating) || 0;
    if (val >= 90)
      return {
        bg: "bg-emerald-500/15 border-emerald-500/40 text-emerald-400",
        glow: "shadow-emerald-500/20",
        label: "WORLD CLASS",
      };
    if (val >= 84)
      return {
        bg: "bg-primary/15 border-primary/40 text-primary",
        glow: "shadow-primary/20",
        label: "ELITE",
      };
    if (val >= 78)
      return {
        bg: "bg-cyan-500/15 border-cyan-500/40 text-cyan-400",
        glow: "shadow-cyan-500/20",
        label: "STARTER",
      };
    return {
      bg: "bg-amber-500/15 border-amber-500/40 text-amber-400",
      glow: "shadow-amber-500/20",
      label: "PROSPECT",
    };
  };

  const getMetricColor = (val) => {
    const num = Number(val) || 0;
    if (num >= 88) return "from-emerald-400 to-teal-500";
    if (num >= 80) return "from-primary to-emerald-400";
    if (num >= 70) return "from-cyan-400 to-blue-500";
    return "from-amber-400 to-orange-500";
  };

  // Handler: Generate Scouting Report
  const handleGenerateReport = async (queryToUse = reportQuery) => {
    const query = queryToUse || reportQuery;
    if (!query.trim()) {
      toast.error("Please enter a player name to scout.");
      return;
    }

    try {
      setIsGeneratingReport(true);
      const res = await generateScoutingReportApi({
        playerQuery: query.trim(),
        focusAreas: ["tactics", "physique", "technical", "market_value"],
      });
      if (res && res.data) {
        setScoutingReport(res.data);
        setReportQuery(res.data.playerName || query);
        toast.success(`Scouting dossier ready for ${res.data.playerName}`);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to generate scouting dossier.",
      );
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Handler: Find Similar Players
  const handleFindSimilar = async (targetOverride) => {
    const playerToFind = targetOverride || targetPlayer;
    if (!playerToFind.trim()) {
      toast.error("Please specify a target player.");
      return;
    }

    try {
      setIsSearchingSimilar(true);
      const res = await findSimilarPlayersApi({
        targetPlayer: playerToFind.trim(),
        position: positionFilter,
        maxAge: maxAgeFilter ? Number(maxAgeFilter) : undefined,
        maxFee: maxFeeFilter,
      });
      if (res && res.similarPlayers) {
        setSimilarResults(res);
        toast.success(
          `Discovered ${res.similarPlayers.length} tactical lookalikes!`,
        );
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to find lookalike profiles.",
      );
    } finally {
      setIsSearchingSimilar(false);
    }
  };

  // Handler: Analyze Tactical Fit
  const handleAnalyzeTacticalFit = async () => {
    if (!tacticalPlayer.trim() || !tacticalClub.trim()) {
      toast.error("Please provide both player and club.");
      return;
    }

    try {
      setIsAnalyzingFit(true);
      const res = await analyzeTacticalFitApi({
        playerName: tacticalPlayer.trim(),
        targetClub: tacticalClub.trim(),
        manager: tacticalManager.trim(),
        systemRole: tacticalRole.trim(),
      });
      if (res && res.data) {
        setTacticalFitResult(res.data);
        toast.success(
          `Tactical fit simulation calculated: ${res.data.tacticalFitScore}%`,
        );
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to analyze tactical fit.",
      );
    } finally {
      setIsAnalyzingFit(false);
    }
  };

  const handleCopy = (data) => {
    let textToCopy = "";
    if (typeof data === "string") {
      textToCopy = data;
    } else if (data.playerName) {
      textToCopy =
        `# SCOUT DOSSIER: ${data.playerName.toUpperCase()}\n` +
        `Current Club: ${data.currentClub || "N/A"} | Position: ${data.position || "N/A"} | Age: ${data.age || "N/A"}\n` +
        `Overall Rating: ${data.overallRating || "N/A"} | Market Value: ${data.estimatedValue || "N/A"}\n` +
        `Tactical Archetype: ${data.archetype || "N/A"}\n\n` +
        `## EXECUTIVE SUMMARY\n${data.playerSummary || ""}\n\n` +
        `## KEY STRENGTHS\n${(data.strengths || []).map((s) => `- ${s}`).join("\n")}\n\n` +
        `## TACTICAL RISKS & WEAKNESSES\n${(data.weaknesses || []).map((w) => `- ${w}`).join("\n")}\n\n` +
        `## RECRUITMENT VERDICT\n${data.marketVerdict || ""}`;
    } else {
      textToCopy = JSON.stringify(data, null, 2);
    }

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success("Dossier exported to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredProspects =
    discoveryCategory === "all"
      ? FEATURED_PROSPECTS
      : FEATURED_PROSPECTS.filter((p) => p.category === discoveryCategory);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 sm:space-y-6 pb-12 animate-fade-in">
      {/* Top Cyber Command HUD Banner */}
      <div className="relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 bg-card/75 border border-border/80 backdrop-blur-xl overflow-hidden shadow-xl">
        {/* Ambient Glows */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-[10.5px] font-mono uppercase font-black tracking-wider px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary">
                <Sparkles size={12} className="animate-spin-slow" />
                AI SCOUT STUDIO PRO
              </span>
              <span className="flex items-center gap-1.5 text-[10.5px] font-mono uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-border/50 border border-border/80 text-muted">
                <Database size={11} className="text-primary" />
                Qdrant Vector Intelligence
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black tracking-tight text-text">
              Talent Intelligence & Tactical Scouting
            </h1>
            <p className="text-xs sm:text-sm text-muted leading-relaxed font-medium">
              Generate UEFA Pro-grade scouting dossiers, discover tactical
              lookalikes via multi-dimensional vector embeddings, and simulate
              real-time club transfer suitability.
            </p>
          </div>

          {/* Segmented Pill Tab Switcher */}
          <div className="flex items-center gap-1 bg-background/80 p-1.5 rounded-2xl border border-border/80 backdrop-blur-md overflow-x-auto no-scrollbar w-full sm:w-auto shrink-0 shadow-inner">
            <button
              onClick={() => setActiveTab("report")}
              className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "report"
                  ? "bg-primary text-[#07120D] shadow-md shadow-primary/20 font-black scale-[1.02]"
                  : "text-muted hover:text-text hover:bg-card/60"
              }`}
            >
              <UserCheck size={15} />
              <span>Scout Dossier</span>
            </button>
            <button
              onClick={() => setActiveTab("similar")}
              className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "similar"
                  ? "bg-primary text-[#07120D] shadow-md shadow-primary/20 font-black scale-[1.02]"
                  : "text-muted hover:text-text hover:bg-card/60"
              }`}
            >
              <Users2 size={15} />
              <span>Lookalike Twins</span>
            </button>
            <button
              onClick={() => setActiveTab("tactical")}
              className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "tactical"
                  ? "bg-primary text-[#07120D] shadow-md shadow-primary/20 font-black scale-[1.02]"
                  : "text-muted hover:text-text hover:bg-card/60"
              }`}
            >
              <Compass size={15} />
              <span>Tactical Fit</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SCOUTING DOSSIER */}
      {/* ========================================================================= */}
      {activeTab === "report" && (
        <div className="space-y-6">
          {/* Search Deck Card */}
          <Card className="p-4 sm:p-6 border-border/80 bg-card/70 backdrop-blur-xl space-y-4 shadow-md">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Enter any player (e.g. Jude Bellingham, Lamine Yamal, Rodri, William Saliba)..."
                  value={reportQuery}
                  onChange={(e) => setReportQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerateReport()}
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-background/80 border border-border/80 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-xs sm:text-sm text-text placeholder:text-muted/70 transition-all font-medium"
                />
                {reportQuery && (
                  <button
                    onClick={() => setReportQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-text p-1 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
              <Button
                onClick={() => handleGenerateReport()}
                disabled={isGeneratingReport || !reportQuery.trim()}
                className="bg-primary hover:bg-primary-hover text-[#07120D] font-black flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm shrink-0 cursor-pointer shadow-lg shadow-primary/20 transition-transform active:scale-95"
              >
                {isGeneratingReport ? (
                  <>
                    <RefreshCw
                      size={16}
                      className="animate-spin text-[#07120D]"
                    />
                    <span>Analyzing Player Metrics...</span>
                  </>
                ) : (
                  <>
                    <Zap size={16} className="text-[#07120D]" />
                    <span>Run Scout Dossier</span>
                  </>
                )}
              </Button>
            </div>

            {/* Quick Star Suggestions */}
            <div className="flex items-center gap-2 overflow-x-auto pt-1 no-scrollbar text-xs">
              <span className="text-[10px] uppercase font-black text-muted tracking-wider flex items-center gap-1 shrink-0">
                <Flame size={12} className="text-amber-400" /> Hot Suggestions:
              </span>
              {FEATUREET_SHORTCUTS(setReportQuery, handleGenerateReport)}
            </div>
          </Card>

          {/* Dossier Display OR Discovery Explorer */}
          {scoutingReport ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Hero Banner Card */}
              <Card className="p-5 sm:p-7 border-border/80 bg-card/75 backdrop-blur-xl relative overflow-hidden shadow-lg">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-border/60">
                  <div className="flex items-center gap-4 sm:gap-5">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-emerald-500/10 border border-primary/40 flex items-center justify-center text-primary text-3xl font-display font-black shadow-inner shrink-0">
                      {scoutingReport.playerName?.charAt(0) || "P"}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl sm:text-3xl font-display font-black text-text">
                          {scoutingReport.playerName}
                        </h2>
                        {scoutingReport.archetype && (
                          <span className="text-[10.5px] font-black px-2.5 py-0.5 rounded-lg bg-primary/15 border border-primary/30 text-primary uppercase tracking-wide">
                            {scoutingReport.archetype}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted font-medium flex items-center gap-2 flex-wrap">
                        <span className="text-text font-bold">
                          {scoutingReport.position || "Outfield Position"}
                        </span>
                        <span className="text-muted/50">•</span>
                        <span className="text-text font-medium">
                          {scoutingReport.currentClub || "Top Flight Club"}
                        </span>
                        {scoutingReport.age && (
                          <>
                            <span className="text-muted/50">•</span>
                            <span>Age {scoutingReport.age}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Rating Badge and Market Value */}
                  <div className="flex items-center gap-4 self-stretch sm:self-auto justify-between sm:justify-end">
                    {scoutingReport.estimatedValue && (
                      <div className="text-left sm:text-right bg-background/50 p-3 rounded-xl border border-border/60">
                        <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                          Estimated Value
                        </span>
                        <span className="text-lg sm:text-xl font-mono font-black text-primary">
                          {scoutingReport.estimatedValue}
                        </span>
                      </div>
                    )}
                    {scoutingReport.overallRating && (
                      <div
                        className={`p-3 sm:p-3.5 rounded-2xl border flex flex-col items-center justify-center shadow-lg min-w-[76px] ${getRatingBadge(scoutingReport.overallRating).bg} ${getRatingBadge(scoutingReport.overallRating).glow}`}
                      >
                        <span className="text-2xl sm:text-3xl font-black leading-none">
                          {scoutingReport.overallRating}
                        </span>
                        <span className="text-[8.5px] font-black tracking-wider uppercase mt-1">
                          {getRatingBadge(scoutingReport.overallRating).label}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chief Scout Executive Briefing */}
                {scoutingReport.playerSummary && (
                  <div className="mt-5 space-y-2">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-muted flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-primary" /> Sporting
                      Director Executive Assessment
                    </h4>
                    <p className="text-xs sm:text-sm leading-relaxed text-text/90 bg-background/60 p-4 rounded-xl border border-border/60 font-medium">
                      {scoutingReport.playerSummary}
                    </p>
                  </div>
                )}

                {/* Attribute Metrics Breakdown Bar Grid */}
                {scoutingReport.ratings &&
                  typeof scoutingReport.ratings === "object" && (
                    <div className="mt-6 pt-6 border-t border-border/60">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-[11px] font-black uppercase tracking-wider text-muted flex items-center gap-1.5">
                          <BarChart2 size={14} className="text-primary" />{" "}
                          Multi-Dimensional Attribute Matrix
                        </h4>
                        <span className="text-[10px] text-muted font-mono">
                          Normalized 0-99 Scale
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                        {Object.entries(scoutingReport.ratings).map(
                          ([attr, val]) => {
                            const numVal = Number(val) || 0;
                            return (
                              <div
                                key={attr}
                                className="bg-background/70 border border-border/70 rounded-xl p-3 text-center flex flex-col justify-between hover:border-primary/40 transition-all shadow-sm"
                              >
                                <div>
                                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted block truncate">
                                    {attr}
                                  </span>
                                  <span className="text-xl font-display font-black text-text mt-0.5 block">
                                    {numVal}
                                  </span>
                                </div>
                                <div className="w-full bg-border/40 h-2 rounded-full mt-2.5 overflow-hidden">
                                  <div
                                    className={`bg-gradient-to-r ${getMetricColor(numVal)} h-full rounded-full transition-all duration-700`}
                                    style={{
                                      width: `${Math.min(numVal, 100)}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  )}
              </Card>

              {/* Strengths & Weaknesses Split Deck */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {scoutingReport.strengths &&
                  Array.isArray(scoutingReport.strengths) && (
                    <Card className="p-4 sm:p-6 border-border/80 bg-card/70 backdrop-blur-xl space-y-3.5 shadow-md">
                      <h3 className="text-xs sm:text-sm font-black flex items-center gap-2 text-emerald-400 uppercase tracking-wide">
                        <CheckCircle2 size={16} /> Key Tactical Strengths
                      </h3>
                      <div className="space-y-2.5">
                        {scoutingReport.strengths.map((str, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 text-xs sm:text-sm p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-text/90 font-medium"
                          >
                            <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0 shadow-sm shadow-emerald-400/50" />
                            <span>{str}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                {scoutingReport.weaknesses &&
                  Array.isArray(scoutingReport.weaknesses) && (
                    <Card className="p-4 sm:p-6 border-border/80 bg-card/70 backdrop-blur-xl space-y-3.5 shadow-md">
                      <h3 className="text-xs sm:text-sm font-black flex items-center gap-2 text-amber-400 uppercase tracking-wide">
                        <AlertCircle size={16} /> Tactical Risks & Adaptation
                        Blindspots
                      </h3>
                      <div className="space-y-2.5">
                        {scoutingReport.weaknesses.map((weak, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 text-xs sm:text-sm p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 text-text/90 font-medium"
                          >
                            <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0 shadow-sm shadow-amber-400/50" />
                            <span>{weak}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
              </div>

              {/* Tactical Phases Compatibility Card */}
              {scoutingReport.tacticalSuitability && (
                <Card className="p-4 sm:p-6 border-border/80 bg-card/70 backdrop-blur-xl space-y-4 shadow-md">
                  <h3 className="text-xs sm:text-sm font-black flex items-center gap-2 text-text uppercase tracking-wide">
                    <Compass size={16} className="text-primary" /> Tactical
                    Phases Compatibility
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="p-4 rounded-xl bg-background/70 border border-border/70 space-y-1.5">
                      <span className="text-[10.5px] font-black text-primary uppercase tracking-wider block">
                        In Possession
                      </span>
                      <p className="text-xs text-text/80 leading-relaxed font-medium">
                        {scoutingReport.tacticalSuitability.possessionStyle ||
                          "Controls tempo and vertical distribution."}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-background/70 border border-border/70 space-y-1.5">
                      <span className="text-[10.5px] font-black text-primary uppercase tracking-wider block">
                        In Transition
                      </span>
                      <p className="text-xs text-text/80 leading-relaxed font-medium">
                        {scoutingReport.tacticalSuitability.transitionStyle ||
                          "Immediate counter-pressing recovery."}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-background/70 border border-border/70 space-y-1.5">
                      <span className="text-[10.5px] font-black text-primary uppercase tracking-wider block">
                        Pressing Structure
                      </span>
                      <p className="text-xs text-text/80 leading-relaxed font-medium">
                        {scoutingReport.tacticalSuitability.pressingStyle ||
                          "High-intensity spatial squeeze."}
                      </p>
                    </div>
                  </div>

                  {/* Recruitment Recommendation & Transfer Action Bar */}
                  {scoutingReport.marketVerdict && (
                    <div className="mt-4 p-4 rounded-2xl bg-primary/10 border border-primary/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-primary uppercase tracking-wider block">
                          Recruitment Recommendation
                        </span>
                        <p className="text-xs sm:text-sm font-bold text-text">
                          {scoutingReport.marketVerdict}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto shrink-0">
                        <Button
                          size="sm"
                          onClick={() => {
                            setTargetPlayer(scoutingReport.playerName);
                            setActiveTab("similar");
                            handleFindSimilar(scoutingReport.playerName);
                          }}
                          className="flex-1 text-[#07120D] sm:flex-initial h-9 px-3.5 text-xs font-bold rounded-xl bg-card hover:bg-card/80 border border-primary/40 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Users2 size={13} />
                          <span>Find Lookalikes</span>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setTacticalPlayer(scoutingReport.playerName);
                            setActiveTab("tactical");
                          }}
                          className="flex-1 sm:flex-initial h-9 px-3.5 text-xs font-bold rounded-xl bg-card hover:bg-card/80 border border-cyan-500/40 text-[#07120D] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Compass size={13} />
                          <span>Simulate Club Fit</span>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleCopy(scoutingReport)}
                          className="h-9 px-3.5 text-xs font-bold rounded-xl bg-primary hover:bg-primary-hover text-[#07120D] flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-primary/20"
                        >
                          {copied ? <Check size={13} /> : <Copy size={13} />}
                          <span>{copied ? "Copied" : "Export Dossier"}</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </motion.div>
          ) : (
            /* Interactive Discovery State */
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-text flex items-center gap-2">
                    <Flame size={15} className="text-amber-400" /> Featured
                    Scout Targets & Wonderkids
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    Click any player to generate an instant UEFA Pro scouting
                    dossier.
                  </p>
                </div>

                {/* Category filter pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  {[
                    { id: "all", label: "All Stars" },
                    { id: "wonderkid", label: "🌟 Wonderkids" },
                    { id: "controller", label: "🧠 Controllers" },
                    { id: "defender", label: "🛡️ Defenders" },
                    { id: "attacker", label: "⚡ Attackers" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setDiscoveryCategory(cat.id)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                        discoveryCategory === cat.id
                          ? "bg-primary/20 border-primary text-primary"
                          : "bg-card/40 border-border/70 text-muted hover:text-text hover:bg-card"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProspects.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => {
                      setReportQuery(p.name);
                      handleGenerateReport(p.name);
                    }}
                    className="p-5 rounded-2xl border border-border/80 bg-card/60 hover:bg-card hover:border-primary/50 transition-all text-left group cursor-pointer space-y-3.5 shadow-sm hover:shadow-lg hover:shadow-primary/5 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/25 to-emerald-500/10 border border-primary/30 flex items-center justify-center text-primary font-black text-sm group-hover:scale-105 transition-transform shrink-0">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-text group-hover:text-primary transition-colors">
                            {p.name}
                          </h4>
                          <span className="text-[11px] text-muted font-medium block">
                            {p.club} • {p.pos} • Age {p.age}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-black px-2 py-0.5 rounded-md bg-primary/10 border border-primary/25 text-primary">
                        {p.ovr} OVR
                      </span>
                    </div>

                    <p className="text-xs text-text/80 line-clamp-1 font-medium bg-background/50 px-2.5 py-1.5 rounded-lg border border-border/40">
                      {p.archetype}
                    </p>

                    {/* Mini Stats Bar */}
                    <div className="grid grid-cols-5 gap-1.5 pt-1">
                      {Object.entries(p.ratings).map(([k, v]) => (
                        <div
                          key={k}
                          className="text-center bg-background/60 p-1 rounded-md border border-border/40"
                        >
                          <span className="text-[9px] uppercase font-bold text-muted block truncate">
                            {k.slice(0, 3)}
                          </span>
                          <span className="text-[11px] font-black text-text">
                            {v}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted pt-3 border-t border-border/40 font-medium">
                      <span>
                        Val:{" "}
                        <strong className="text-text font-bold">{p.val}</strong>
                      </span>
                      <span className="text-primary group-hover:translate-x-1 transition-transform font-bold flex items-center gap-1">
                        Run Scout Dossier <CornerDownRight size={12} />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LOOKALIKE TWINS (SIMILARITY FINDER) */}
      {/* ========================================================================= */}
      {activeTab === "similar" && (
        <div className="space-y-6">
          <Card className="p-5 sm:p-7 border-border/80 bg-card/75 backdrop-blur-xl space-y-5 shadow-md">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-text flex items-center gap-2">
                <Users2 size={16} className="text-primary" /> Qdrant
                Multi-Vector Lookalike Engine
              </h3>
              <p className="text-xs text-muted mt-1">
                Discover replacement players matching tactical metrics, ball
                progression traits, and positional demands.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div>
                <label className="text-[10.5px] font-black text-muted uppercase tracking-wider mb-1.5 block">
                  Benchmark Player
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rodri, Saka, Bellingham"
                  value={targetPlayer}
                  onChange={(e) => setTargetPlayer(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background/80 border border-border/80 focus:border-primary outline-none text-xs sm:text-sm text-text font-medium"
                />
              </div>

              <div>
                <label className="text-[10.5px] font-black text-muted uppercase tracking-wider mb-1.5 block">
                  Target Position
                </label>
                <select
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background/80 border border-border/80 focus:border-primary outline-none text-xs sm:text-sm text-text font-medium cursor-pointer"
                >
                  <option value="DM">Defensive Midfield (DM / #6)</option>
                  <option value="CM">Central Midfield (CM / #8)</option>
                  <option value="AM">Attacking Midfield (AM / #10)</option>
                  <option value="RW/LW">Winger (RW / LW)</option>
                  <option value="ST">Striker / CF (ST / #9)</option>
                  <option value="CB">Center Back (CB)</option>
                  <option value="FB">Fullback / Wingback (LB / RB)</option>
                </select>
              </div>

              <div>
                <label className="text-[10.5px] font-black text-muted uppercase tracking-wider mb-1.5 block">
                  Max Age Cap
                </label>
                <input
                  type="number"
                  placeholder="e.g. 24"
                  value={maxAgeFilter}
                  onChange={(e) => setMaxAgeFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background/80 border border-border/80 focus:border-primary outline-none text-xs sm:text-sm text-text font-medium"
                />
              </div>

              <div>
                <label className="text-[10.5px] font-black text-muted uppercase tracking-wider mb-1.5 block">
                  Max Budget Fee
                </label>
                <input
                  type="text"
                  placeholder="e.g. €45M"
                  value={maxFeeFilter}
                  onChange={(e) => setMaxFeeFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background/80 border border-border/80 focus:border-primary outline-none text-xs sm:text-sm text-text font-medium"
                />
              </div>
            </div>

            {/* Quick Benchmark shortcuts */}
            <div className="flex items-center gap-2 overflow-x-auto pt-1 no-scrollbar text-xs">
              <span className="text-[10px] uppercase font-black text-muted tracking-wider shrink-0">
                Quick Benchmarks:
              </span>
              {[
                "Rodri",
                "Jude Bellingham",
                "Florian Wirtz",
                "William Saliba",
                "Bukayo Saka",
                "Lamine Yamal",
              ].map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setTargetPlayer(p);
                    handleFindSimilar(p);
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-background/60 hover:bg-primary/15 hover:border-primary/40 hover:text-primary transition-all text-muted border border-border/60 shrink-0 cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>

            <Button
              onClick={() => handleFindSimilar()}
              disabled={isSearchingSimilar || !targetPlayer.trim()}
              className="w-full bg-primary hover:bg-primary-hover text-[#07120D] font-black flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm cursor-pointer shadow-lg shadow-primary/20 transition-transform active:scale-98"
            >
              {isSearchingSimilar ? (
                <>
                  <RefreshCw
                    size={16}
                    className="animate-spin text-[#07120D]"
                  />
                  <span>Scanning Qdrant Multi-Vector Embeddings...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} className="text-[#07120D]" />
                  <span>
                    Discover Tactical Lookalikes & Twins for {targetPlayer}
                  </span>
                </>
              )}
            </Button>
          </Card>

          {/* Similar Results Grid */}
          {similarResults && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-black flex items-center gap-2 text-text">
                  <Award className="text-primary" size={18} />
                  Top Replacement Candidates for {similarResults.targetPlayer}
                </h3>
                <span className="text-[10.5px] font-mono px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/25 text-primary font-black">
                  Vector Matched ({similarResults.similarPlayers?.length || 0})
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {similarResults.similarPlayers?.map((sim, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                  >
                    <Card className="p-5 sm:p-6 border-border/80 bg-card/75 hover:border-primary/50 transition-all flex flex-col justify-between h-full space-y-4 shadow-md">
                      <div>
                        <div className="flex items-start justify-between gap-3 pb-4 border-b border-border/60">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-base sm:text-lg text-text">
                                {sim.name}
                              </h4>
                              {sim.position && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] py-0.5 px-2 font-black border-primary/40 text-primary"
                                >
                                  {sim.position}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted mt-0.5 font-medium">
                              {sim.club} • {sim.league}{" "}
                              {sim.age ? `• Age ${sim.age}` : ""}
                            </p>
                          </div>

                          <div className="text-right shrink-0 bg-background/60 p-2.5 rounded-xl border border-border/60">
                            <div className="flex items-center justify-end gap-1 text-emerald-400 font-extrabold text-lg">
                              <span>{sim.similarityScore}%</span>
                            </div>
                            <span className="text-[8.5px] text-muted font-black tracking-wider uppercase">
                              SIMILARITY
                            </span>
                          </div>
                        </div>

                        {/* Style Comparison Narrative */}
                        <div className="mt-4 space-y-2.5">
                          <p className="text-xs sm:text-sm text-text/90 leading-relaxed bg-background/60 p-3.5 rounded-xl border border-border/50 font-medium">
                            <span className="font-bold text-primary">
                              Tactical Synergy:{" "}
                            </span>
                            {sim.styleComparison}
                          </p>

                          {/* Key Metrics Grid */}
                          {sim.keyMetrics &&
                            typeof sim.keyMetrics === "object" && (
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                {Object.entries(sim.keyMetrics).map(
                                  ([k, v]) => (
                                    <div
                                      key={k}
                                      className="p-2.5 rounded-xl bg-background/70 border border-border/60 text-xs flex items-center justify-between font-medium"
                                    >
                                      <span className="text-muted capitalize text-[11px]">
                                        {k.replace(/([A-Z])/g, " $1")}:
                                      </span>
                                      <span className="font-bold text-text">
                                        {v}
                                      </span>
                                    </div>
                                  ),
                                )}
                              </div>
                            )}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs">
                        <span className="font-mono font-black text-primary text-sm">
                          {sim.marketValue || "Valuation Open"}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setTacticalPlayer(sim.name);
                              setActiveTab("tactical");
                            }}
                            className="h-8 px-3 text-[11px] font-bold rounded-lg bg-card hover:bg-card/80 border border-border text-[#07120D] cursor-pointer"
                          >
                            <span>Test Fit</span>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setReportQuery(sim.name);
                              setActiveTab("report");
                              handleGenerateReport(sim.name);
                            }}
                            className="h-8 px-3 text-[11px] font-bold rounded-lg bg-primary hover:bg-primary-hover text-[#07120D] flex items-center gap-1 cursor-pointer"
                          >
                            <span>Full Dossier</span>
                            <ArrowRight size={12} />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TACTICAL FIT SIMULATOR */}
      {/* ========================================================================= */}
      {activeTab === "tactical" && (
        <div className="space-y-6">
          <Card className="p-5 sm:p-7 border-border/80 bg-card/75 backdrop-blur-xl space-y-5 shadow-md">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-text flex items-center gap-2">
                <Compass size={16} className="text-primary" /> Transfer & System
                Fit Simulator
              </h3>
              <p className="text-xs text-muted mt-1">
                Evaluate how a player fits into a manager's tactical philosophy,
                squad chemistry, and positional demand.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div>
                <label className="text-[10.5px] font-black text-muted uppercase tracking-wider mb-1.5 block">
                  Player to Evaluate
                </label>
                <input
                  type="text"
                  placeholder="e.g. Florian Wirtz"
                  value={tacticalPlayer}
                  onChange={(e) => setTacticalPlayer(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background/80 border border-border/80 focus:border-primary outline-none text-xs sm:text-sm text-text font-medium"
                />
              </div>

              <div>
                <label className="text-[10.5px] font-black text-muted uppercase tracking-wider mb-1.5 block">
                  Target Club
                </label>
                <input
                  type="text"
                  placeholder="e.g. Manchester City"
                  value={tacticalClub}
                  onChange={(e) => setTacticalClub(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background/80 border border-border/80 focus:border-primary outline-none text-xs sm:text-sm text-text font-medium"
                />
              </div>

              <div>
                <label className="text-[10.5px] font-black text-muted uppercase tracking-wider mb-1.5 block">
                  Manager / Head Coach
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pep Guardiola"
                  value={tacticalManager}
                  onChange={(e) => setTacticalManager(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background/80 border border-border/80 focus:border-primary outline-none text-xs sm:text-sm text-text font-medium"
                />
              </div>

              <div>
                <label className="text-[10.5px] font-black text-muted uppercase tracking-wider mb-1.5 block">
                  Intended System Role
                </label>
                <input
                  type="text"
                  placeholder="e.g. Half-Space #10 / Inverted Winger"
                  value={tacticalRole}
                  onChange={(e) => setTacticalRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background/80 border border-border/80 focus:border-primary outline-none text-xs sm:text-sm text-text font-medium"
                />
              </div>
            </div>

            {/* Quick Club Presets */}
            <div className="flex items-center gap-2 overflow-x-auto pt-1 no-scrollbar text-xs">
              <span className="text-[10px] uppercase font-black text-muted tracking-wider shrink-0">
                Quick Clubs:
              </span>
              {PRESET_CLUBS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => {
                    setTacticalClub(c.name);
                    setTacticalManager(c.manager);
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-background/60 hover:bg-primary/15 hover:border-primary/40 hover:text-primary transition-all text-muted border border-border/60 shrink-0 cursor-pointer"
                >
                  {c.name}{" "}
                  <span className="text-[9.5px] opacity-60 font-mono">
                    ({c.manager.split(" ").pop()})
                  </span>
                </button>
              ))}
            </div>

            <Button
              onClick={handleAnalyzeTacticalFit}
              disabled={
                isAnalyzingFit || !tacticalPlayer.trim() || !tacticalClub.trim()
              }
              className="w-full bg-primary hover:bg-primary-hover text-[#07120D] font-black flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm cursor-pointer shadow-lg shadow-primary/20 transition-transform active:scale-98"
            >
              {isAnalyzingFit ? (
                <>
                  <RefreshCw
                    size={16}
                    className="animate-spin text-[#07120D]"
                  />
                  <span>Simulating Tactical Dynamics & Squad Synergy...</span>
                </>
              ) : (
                <>
                  <Compass size={16} className="text-[#07120D]" />
                  <span>Run Transfer & System Fit Simulation</span>
                </>
              )}
            </Button>
          </Card>

          {/* Tactical Fit Result Card */}
          {tacticalFitResult && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="p-5 sm:p-7 border-border/80 bg-card/75 backdrop-blur-xl space-y-6 shadow-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pb-6 border-b border-border/60">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-primary uppercase tracking-wider block">
                      Transfer Fit Assessment
                    </span>
                    <h3 className="text-xl sm:text-3xl font-display font-black text-text">
                      {tacticalFitResult.playerName}{" "}
                      <span className="text-muted/60">➔</span>{" "}
                      {tacticalFitResult.targetClub}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted font-medium">
                      Assigned Tactical Role:{" "}
                      <span className="text-text font-bold">
                        {tacticalFitResult.systemRole || "Core Progressor"}
                      </span>
                      {tacticalFitResult.fitVerdict && (
                        <span className="ml-2 font-bold text-primary">
                          ({tacticalFitResult.fitVerdict})
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border/80 flex flex-col items-center justify-center shadow-md min-w-[84px]">
                      <span className="text-2xl sm:text-3xl font-display font-black text-primary leading-none">
                        {tacticalFitResult.tacticalFitScore}%
                      </span>
                      <span className="text-[8.5px] text-muted font-black tracking-wider uppercase mt-1">
                        ALIGNMENT
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Tactical Pros */}
                  <div className="space-y-3">
                    <h4 className="text-xs sm:text-sm font-black flex items-center gap-2 text-emerald-400 uppercase tracking-wide">
                      <CheckCircle2 size={16} /> System Synergies & Tactical
                      Advantages
                    </h4>
                    <div className="space-y-2.5">
                      {tacticalFitResult.tacticalPros?.map((pro, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-xs sm:text-sm text-text/90 font-medium leading-relaxed"
                        >
                          {pro}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tactical Risks */}
                  <div className="space-y-3">
                    <h4 className="text-xs sm:text-sm font-black flex items-center gap-2 text-amber-400 uppercase tracking-wide">
                      <AlertCircle size={16} /> Tactical Risks & Adaptation
                      Bottlenecks
                    </h4>
                    <div className="space-y-2.5">
                      {tacticalFitResult.tacticalRisks?.map((risk, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/15 text-xs sm:text-sm text-text/90 font-medium leading-relaxed"
                        >
                          {risk}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Predicted Formation & Sporting Director Verdict */}
                <div className="p-4 sm:p-5 rounded-2xl bg-background/70 border border-border/70 space-y-3">
                  <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                    <span className="text-[10.5px] font-black text-muted uppercase tracking-wider">
                      Predicted Formation Scheme:
                    </span>
                    <span className="text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-primary/15 border border-primary/30 text-primary">
                      {tacticalFitResult.predictedFormation || "4-3-3 System"}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-text/90 pt-3 leading-relaxed border-t border-border/50 font-medium">
                    <strong className="text-primary">
                      Executive Verdict:{" "}
                    </strong>
                    {tacticalFitResult.finalVerdict}
                  </p>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper for quick suggestion pills
const FEATUREET_SHORTCUTS = (setReportQuery, handleGenerateReport) => {
  return [
    { name: "Jude Bellingham", pos: "AM/CM" },
    { name: "Lamine Yamal", pos: "RW" },
    { name: "Rodri", pos: "DM" },
    { name: "Florian Wirtz", pos: "AM/LW" },
    { name: "William Saliba", pos: "CB" },
    { name: "Bukayo Saka", pos: "RW" },
  ].map((p) => (
    <button
      key={p.name}
      onClick={() => {
        setReportQuery(p.name);
        handleGenerateReport(p.name);
      }}
      className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-background/60 hover:bg-primary/15 hover:border-primary/40 hover:text-primary transition-all text-muted border border-border/60 shrink-0 cursor-pointer"
    >
      {p.name}{" "}
      <span className="text-[9.5px] opacity-60 font-mono">({p.pos})</span>
    </button>
  ));
};

export default AIScoutStudio;
