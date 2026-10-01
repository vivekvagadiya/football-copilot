import React, { useState } from 'react';
import {
  UserCheck, Search, Sparkles, Shield, Zap, Target,
  TrendingUp, BarChart2, Compass, AlertCircle, CheckCircle2,
  Sliders, ArrowRight, RefreshCw, Copy, Check, Filter,
  Building2, Users, DollarSign, Award, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import {
  generateScoutingReportApi,
  findSimilarPlayersApi,
  analyzeTacticalFitApi,
} from '../../api/scout.api';

const PRESET_SCOUT_PLAYERS = [
  "Jude Bellingham",
  "Rodri",
  "Bukayo Saka",
  "Florian Wirtz",
  "Eduardo Camavinga",
  "Lamine Yamal"
];

const PRESET_CLUBS = [
  { name: "Arsenal", manager: "Mikel Arteta" },
  { name: "Real Madrid", manager: "Carlo Ancelotti" },
  { name: "Manchester City", manager: "Pep Guardiola" },
  { name: "Barcelona", manager: "Hansi Flick" },
  { name: "Liverpool", manager: "Arne Slot" },
  { name: "Bayern Munich", manager: "Vincent Kompany" },
];

export const AIScoutStudio = () => {
  const [activeTab, setActiveTab] = useState('report'); // 'report' | 'similar' | 'tactical'
  
  // Tab 1: Scouting Report State
  const [reportQuery, setReportQuery] = useState('Jude Bellingham');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [scoutingReport, setScoutingReport] = useState(null);

  // Tab 2: Similar Players State
  const [targetPlayer, setTargetPlayer] = useState('Rodri');
  const [positionFilter, setPositionFilter] = useState('DM');
  const [maxAgeFilter, setMaxAgeFilter] = useState('25');
  const [maxFeeFilter, setMaxFeeFilter] = useState('€45M');
  const [isSearchingSimilar, setIsSearchingSimilar] = useState(false);
  const [similarResults, setSimilarResults] = useState(null);

  // Tab 3: Tactical Fit State
  const [tacticalPlayer, setTacticalPlayer] = useState('Florian Wirtz');
  const [tacticalClub, setTacticalClub] = useState('Manchester City');
  const [tacticalManager, setTacticalManager] = useState('Pep Guardiola');
  const [isAnalyzingFit, setIsAnalyzingFit] = useState(false);
  const [tacticalFitResult, setTacticalFitResult] = useState(null);

  const [copied, setCopied] = useState(false);

  // Handler: Generate Scouting Report
  const handleGenerateReport = async (queryToUse = reportQuery) => {
    if (!queryToUse.trim()) {
      toast.error("Please enter a player name.");
      return;
    }

    try {
      setIsGeneratingReport(true);
      const res = await generateScoutingReportApi({
        playerQuery: queryToUse.trim(),
        focusAreas: ["tactics", "physique", "technical", "market_value"],
      });
      if (res && res.data) {
        setScoutingReport(res.data);
        toast.success(`Scouting dossier generated for ${res.data.playerName}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate scouting report.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Handler: Find Similar Players
  const handleFindSimilar = async () => {
    if (!targetPlayer.trim()) {
      toast.error("Please specify a target player.");
      return;
    }

    try {
      setIsSearchingSimilar(true);
      const res = await findSimilarPlayersApi({
        targetPlayer: targetPlayer.trim(),
        position: positionFilter,
        maxAge: maxAgeFilter ? Number(maxAgeFilter) : undefined,
        maxFee: maxFeeFilter,
      });
      if (res && res.similarPlayers) {
        setSimilarResults(res);
        toast.success(`Discovered ${res.similarPlayers.length} tactical lookalikes!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to find similar profiles.");
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
      });
      if (res && res.data) {
        setTacticalFitResult(res.data);
        toast.success(`Tactical fit calculated: ${res.data.tacticalFitScore}%`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to analyze tactical fit.");
    } finally {
      setIsAnalyzingFit(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-text p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="relative rounded-2xl p-6 md:p-8 bg-gradient-to-r from-primary/15 via-accent/10 to-transparent border border-primary/20 overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="primary" className="bg-primary/20 text-primary border-primary/30 flex items-center gap-1.5 px-3 py-1">
                <Sparkles size={14} className="animate-spin-slow" />
                AI SCOUT PRO
              </Badge>
              <Badge variant="outline" className="text-xs border-border/80">
                Vector Similarity + Qdrant
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-text via-text/90 to-text/60">
              AI Talent Scouting & Intelligence
            </h1>
            <p className="text-sm md:text-base text-text-muted max-w-2xl">
              Evaluate elite footballers, uncover tactical lookalikes via multi-dimensional vector embeddings, and simulate real-time system suitability.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-card/60 p-1.5 rounded-xl border border-border/60 backdrop-blur-md self-start md:self-auto">
            <button
              onClick={() => setActiveTab('report')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'report'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-text-muted hover:text-text hover:bg-card-hover'
              }`}
            >
              <UserCheck size={16} />
              Scouting Dossier
            </button>
            <button
              onClick={() => setActiveTab('similar')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'similar'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-text-muted hover:text-text hover:bg-card-hover'
              }`}
            >
              <Users size={16} />
              Lookalike Finder
            </button>
            <button
              onClick={() => setActiveTab('tactical')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'tactical'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-text-muted hover:text-text hover:bg-card-hover'
              }`}
            >
              <Compass size={16} />
              Tactical Fit
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: SCOUTING DOSSIER */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          {/* Search Controls */}
          <Card className="p-5 border-border bg-card/70 backdrop-blur-sm space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input
                  type="text"
                  placeholder="Enter player name (e.g. Jude Bellingham, Lamine Yamal, Saliba)..."
                  value={reportQuery}
                  onChange={(e) => setReportQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateReport()}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
                />
              </div>
              <Button
                onClick={() => handleGenerateReport()}
                disabled={isGeneratingReport}
                className="bg-primary hover:bg-primary-hover text-white flex items-center justify-center gap-2 px-6 shrink-0"
              >
                {isGeneratingReport ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Analyzing Player...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Generate Dossier
                  </>
                )}
              </Button>
            </div>

            {/* Quick preset chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-text-muted flex items-center gap-1 font-medium">
                <Target size={12} /> Popular:
              </span>
              {PRESET_SCOUT_PLAYERS.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setReportQuery(p);
                    handleGenerateReport(p);
                  }}
                  className="px-2.5 py-1 text-xs rounded-full bg-border/40 hover:bg-primary/20 hover:text-primary transition-all text-text-muted border border-border/50"
                >
                  {p}
                </button>
              ))}
            </div>
          </Card>

          {/* Report Display */}
          {scoutingReport && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Player Top Meta Card */}
              <Card className="p-6 border-border bg-card relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-border/70">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary/20">
                      {scoutingReport.playerName?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-2xl font-bold">{scoutingReport.playerName}</h2>
                        <Badge variant="primary" className="text-xs">
                          {scoutingReport.archetype || 'Elite Outfield'}
                        </Badge>
                      </div>
                      <p className="text-sm text-text-muted mt-0.5">
                        {scoutingReport.position} • {scoutingReport.currentClub} • Age {scoutingReport.age}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-stretch md:self-auto justify-between md:justify-end">
                    <div className="text-right">
                      <span className="text-xs text-text-muted block">Market Valuation</span>
                      <span className="text-lg font-bold text-primary">{scoutingReport.estimatedValue || '€45M'}</span>
                    </div>
                    <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center">
                      <span className="text-2xl font-extrabold text-primary leading-none">
                        {scoutingReport.overallRating || 86}
                      </span>
                      <span className="text-[10px] text-text-muted font-semibold mt-0.5">OVR</span>
                    </div>
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="mt-5 space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-primary" /> Chief Scout Summary
                  </h4>
                  <p className="text-sm leading-relaxed text-text/90 bg-background/50 p-4 rounded-xl border border-border/60">
                    {scoutingReport.playerSummary}
                  </p>
                </div>

                {/* Ratings Radar Grid */}
                {scoutingReport.ratings && (
                  <div className="mt-6 pt-6 border-t border-border/70">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4 flex items-center gap-1.5">
                      <BarChart2 size={14} className="text-primary" /> Attribute Percentiles
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                      {Object.entries(scoutingReport.ratings).map(([attr, val]) => (
                        <div key={attr} className="bg-background/70 border border-border/60 rounded-xl p-3 text-center">
                          <span className="text-[11px] uppercase tracking-wider text-text-muted font-medium block truncate">
                            {attr}
                          </span>
                          <span className="text-xl font-bold text-text mt-1 block">
                            {val}
                          </span>
                          <div className="w-full bg-border/50 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div
                              className="bg-primary h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(val, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* Strengths & Weaknesses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 border-border bg-card space-y-3">
                  <h3 className="text-base font-semibold flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 size={18} /> Key Strengths
                  </h3>
                  <div className="space-y-2.5">
                    {scoutingReport.strengths?.map((str, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-sm p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                        <span>{str}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6 border-border bg-card space-y-3">
                  <h3 className="text-base font-semibold flex items-center gap-2 text-amber-400">
                    <AlertCircle size={18} /> Tactical Considerations & Weaknesses
                  </h3>
                  <div className="space-y-2.5">
                    {scoutingReport.weaknesses?.map((weak, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-sm p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                        <span>{weak}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Tactical Suitability & Verdict */}
              {scoutingReport.tacticalSuitability && (
                <Card className="p-6 border-border bg-card space-y-4">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <Compass size={18} className="text-primary" /> Tactical Phases Assessment
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-background/60 border border-border/60 space-y-1.5">
                      <span className="text-xs font-semibold text-primary uppercase">In Possession / Build-up</span>
                      <p className="text-xs text-text-muted leading-relaxed">
                        {scoutingReport.tacticalSuitability.possessionStyle}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-background/60 border border-border/60 space-y-1.5">
                      <span className="text-xs font-semibold text-primary uppercase">Transitions (Att / Def)</span>
                      <p className="text-xs text-text-muted leading-relaxed">
                        {scoutingReport.tacticalSuitability.transitionStyle}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-background/60 border border-border/60 space-y-1.5">
                      <span className="text-xs font-semibold text-primary uppercase">Pressing Structure</span>
                      <p className="text-xs text-text-muted leading-relaxed">
                        {scoutingReport.tacticalSuitability.pressingStyle}
                      </p>
                    </div>
                  </div>

                  {scoutingReport.marketVerdict && (
                    <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold text-primary uppercase tracking-wider block">Recruitment Recommendation</span>
                        <p className="text-sm font-medium text-text mt-0.5">{scoutingReport.marketVerdict}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(scoutingReport)}
                        className="shrink-0 flex items-center gap-1.5"
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        Export Dossier
                      </Button>
                    </div>
                  )}
                </Card>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* TAB 2: LOOKALIKE / SIMILARITY FINDER */}
      {activeTab === 'similar' && (
        <div className="space-y-6">
          <Card className="p-6 border-border bg-card space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase mb-1.5 block">
                  Target Player Benchmark
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rodri, Saka, Haaland"
                  value={targetPlayer}
                  onChange={(e) => setTargetPlayer(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted uppercase mb-1.5 block">
                  Target Position
                </label>
                <select
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm"
                >
                  <option value="DM">Defensive Midfield (DM / #6)</option>
                  <option value="CM">Central Midfield (CM / #8)</option>
                  <option value="AM">Attacking Midfield (AM / #10)</option>
                  <option value="RW/LW">Winger (RW / LW)</option>
                  <option value="ST">Striker (ST / #9)</option>
                  <option value="CB">Center Back (CB)</option>
                  <option value="FB">Fullback / Wingback (LB / RB)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted uppercase mb-1.5 block">
                  Max Age Limit
                </label>
                <input
                  type="number"
                  placeholder="e.g. 24"
                  value={maxAgeFilter}
                  onChange={(e) => setMaxAgeFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted uppercase mb-1.5 block">
                  Max Budget Fee
                </label>
                <input
                  type="text"
                  placeholder="e.g. €35M"
                  value={maxFeeFilter}
                  onChange={(e) => setMaxFeeFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm"
                />
              </div>
            </div>

            <Button
              onClick={handleFindSimilar}
              disabled={isSearchingSimilar}
              className="w-full bg-primary hover:bg-primary-hover text-white flex items-center justify-center gap-2 py-3"
            >
              {isSearchingSimilar ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Running Vector Similarity Matching on Qdrant...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Find Tactical Twins & Replacements for {targetPlayer}
                </>
              )}
            </Button>
          </Card>

          {/* Results Grid */}
          {similarResults && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Award className="text-primary" size={20} />
                  Top Replacement Candidates for {similarResults.targetPlayer}
                </h3>
                <span className="text-xs text-text-muted">
                  Vector Analyzed
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {similarResults.similarPlayers?.map((sim, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="p-5 border-border bg-card hover:border-primary/40 transition-all flex flex-col justify-between h-full space-y-4">
                      <div>
                        <div className="flex items-start justify-between gap-3 pb-3 border-b border-border/60">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-lg">{sim.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {sim.position}
                              </Badge>
                            </div>
                            <p className="text-xs text-text-muted mt-0.5">
                              {sim.club} • {sim.league} • Age {sim.age}
                            </p>
                          </div>

                          <div className="text-right">
                            <div className="flex items-center justify-end gap-1 text-emerald-400 font-extrabold text-lg">
                              <span>{sim.similarityScore}%</span>
                            </div>
                            <span className="text-[10px] text-text-muted font-medium">Similarity</span>
                          </div>
                        </div>

                        {/* Style comparison */}
                        <div className="mt-3 space-y-2">
                          <p className="text-xs text-text/90 leading-relaxed bg-background/50 p-3 rounded-lg border border-border/40">
                            <span className="font-semibold text-primary">Tactical Fit: </span>
                            {sim.styleComparison}
                          </p>

                          {/* Key metrics grid */}
                          {sim.keyMetrics && (
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              {Object.entries(sim.keyMetrics).map(([k, v]) => (
                                <div key={k} className="p-2 rounded-lg bg-card-hover text-xs flex items-center justify-between">
                                  <span className="text-text-muted capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                                  <span className="font-semibold">{v}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                        <span className="font-bold text-primary">{sim.marketValue}</span>
                        <button
                          onClick={() => {
                            setReportQuery(sim.name);
                            setActiveTab('report');
                            handleGenerateReport(sim.name);
                          }}
                          className="text-primary hover:underline font-medium flex items-center gap-1"
                        >
                          View Full Dossier <ArrowRight size={12} />
                        </button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TACTICAL FIT SIMULATOR */}
      {activeTab === 'tactical' && (
        <div className="space-y-6">
          <Card className="p-6 border-border bg-card space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase mb-1.5 block">
                  Player to Evaluate
                </label>
                <input
                  type="text"
                  placeholder="e.g. Florian Wirtz"
                  value={tacticalPlayer}
                  onChange={(e) => setTacticalPlayer(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted uppercase mb-1.5 block">
                  Target Club
                </label>
                <input
                  type="text"
                  placeholder="e.g. Manchester City"
                  value={tacticalClub}
                  onChange={(e) => setTacticalClub(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted uppercase mb-1.5 block">
                  Head Coach / Manager
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pep Guardiola"
                  value={tacticalManager}
                  onChange={(e) => setTacticalManager(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border focus:border-primary outline-none text-sm"
                />
              </div>
            </div>

            {/* Quick Club Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-text-muted font-medium">Quick Clubs:</span>
              {PRESET_CLUBS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => {
                    setTacticalClub(c.name);
                    setTacticalManager(c.manager);
                  }}
                  className="px-2.5 py-1 text-xs rounded-full bg-border/40 hover:bg-primary/20 hover:text-primary transition-all text-text-muted border border-border/50"
                >
                  {c.name}
                </button>
              ))}
            </div>

            <Button
              onClick={handleAnalyzeTacticalFit}
              disabled={isAnalyzingFit}
              className="w-full bg-primary hover:bg-primary-hover text-white flex items-center justify-center gap-2 py-3"
            >
              {isAnalyzingFit ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Simulating Tactical Compatibility...
                </>
              ) : (
                <>
                  <Compass size={16} />
                  Simulate Transfer & Tactical Fit
                </>
              )}
            </Button>
          </Card>

          {/* Tactical Fit Result Card */}
          {tacticalFitResult && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="p-6 border-border bg-card space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
                  <div>
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                      Simulation Assessment
                    </span>
                    <h3 className="text-2xl font-bold mt-1">
                      {tacticalFitResult.playerName} $\rightarrow$ {tacticalFitResult.targetClub}
                    </h3>
                    <p className="text-sm text-text-muted mt-0.5">
                      Assigned Role: <span className="text-text font-medium">{tacticalFitResult.systemRole}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-primary leading-none">
                        {tacticalFitResult.tacticalFitScore}%
                      </span>
                      <span className="text-[10px] text-text-muted font-bold mt-1">COMPATIBILITY</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tactical Pros */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 size={16} /> System Synergies & Advantages
                    </h4>
                    <div className="space-y-2">
                      {tacticalFitResult.tacticalPros?.map((pro, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-xs leading-relaxed">
                          {pro}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tactical Risks */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold flex items-center gap-2 text-amber-400">
                      <AlertCircle size={16} /> Tactical Risks & Adaptation Challenges
                    </h4>
                    <div className="space-y-2">
                      {tacticalFitResult.tacticalRisks?.map((risk, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-xs leading-relaxed">
                          {risk}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Predicted Formation & Verdict */}
                <div className="p-4 rounded-xl bg-background/70 border border-border/70 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-muted uppercase">Predicted Tactical Formation:</span>
                    <Badge variant="primary" className="text-xs">
                      {tacticalFitResult.predictedFormation}
                    </Badge>
                  </div>
                  <p className="text-sm text-text/90 pt-1 leading-relaxed border-t border-border/50 mt-2">
                    <span className="font-bold text-primary">Final Verdict: </span>
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

export default AIScoutStudio;
