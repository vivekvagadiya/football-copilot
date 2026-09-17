import React, { useState, useEffect } from 'react';
import {
  Brain, Target, Sparkles, CheckCircle2, Circle, Clock,
  Layers, Plus, Trash2, ChevronRight, Shield, RefreshCw,
  Share2, Printer, Copy, Check, ArrowRight, AlertCircle,
  FileText, Activity, Users, Zap, Compass, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import {
  getPlannerTemplatesApi,
  generateTacticalPlanApi,
  getUserPlansApi,
  getPlanByIdApi,
  toggleChecklistItemApi,
  updatePlanStatusApi,
  deletePlanApi,
} from '../../api/planner.api';

export const PlannerStudio = () => {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0); // 0: idle, 1: decompose, 2: gather context, 3: synthesize

  // Input form state
  const [goalInput, setGoalInput] = useState('');
  const [selectedPlanType, setSelectedPlanType] = useState('match_preparation');
  const [opponentInput, setOpponentInput] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoadingPlans(true);
    try {
      const [templatesRes, plansRes] = await Promise.all([
        getPlannerTemplatesApi(),
        getUserPlansApi(),
      ]);
      setTemplates(templatesRes || []);
      const planList = plansRes?.plans || [];
      setPlans(planList);
      if (planList.length > 0) {
        setSelectedPlan(planList[0]);
      }
    } catch (err) {
      console.error('Failed to load planner initial data:', err);
      toast.error('Could not load existing plans');
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const handleSelectTemplate = (tpl) => {
    setGoalInput(tpl.examplePrompt);
    setSelectedPlanType(tpl.category);
  };

  const handleGeneratePlan = async (e) => {
    if (e) e.preventDefault();
    if (!goalInput.trim()) {
      toast.error('Please enter a tactical objective or prompt.');
      return;
    }

    setIsGenerating(true);
    setGenerationStep(1);

    // Step 1: Decomposing goal
    const stepTimer1 = setTimeout(() => setGenerationStep(2), 1200);
    // Step 2: Querying databases & tools
    const stepTimer2 = setTimeout(() => setGenerationStep(3), 2800);

    try {
      const newPlan = await generateTacticalPlanApi({
        goal: goalInput.trim(),
        planType: selectedPlanType,
        opponent: opponentInput ? { name: opponentInput.trim() } : {},
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setGenerationStep(0);
      setIsGenerating(false);

      if (newPlan) {
        setPlans((prev) => [newPlan, ...prev]);
        setSelectedPlan(newPlan);
        setGoalInput('');
        setOpponentInput('');
        toast.success('Tactical Masterplan generated successfully!');
      }
    } catch (err) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setGenerationStep(0);
      setIsGenerating(false);
      console.error('Plan generation failed:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to generate tactical plan.');
    }
  };

  const handleToggleChecklist = async (phaseId, itemId, currentStatus) => {
    if (!selectedPlan) return;

    // Optimistic UI update
    const nextStatus = !currentStatus;
    setSelectedPlan((prev) => {
      if (!prev) return prev;
      const updatedPhases = (prev.phases || []).map((p) => {
        if (p._id === phaseId) {
          return {
            ...p,
            checklist: (p.checklist || []).map((item) =>
              item._id === itemId
                ? { ...item, isCompleted: nextStatus, completedAt: nextStatus ? new Date() : null }
                : item
            ),
          };
        }
        return p;
      });
      return { ...prev, phases: updatedPhases };
    });

    try {
      const updated = await toggleChecklistItemApi(selectedPlan._id, {
        phaseId,
        itemId,
        isCompleted: nextStatus,
      });
      if (updated) {
        setSelectedPlan(updated);
        setPlans((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      }
    } catch (err) {
      console.error('Failed to toggle checklist:', err);
      toast.error('Checklist update failed');
      // Revert from backend
      const refetched = await getPlanByIdApi(selectedPlan._id);
      if (refetched) setSelectedPlan(refetched);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!confirm('Are you sure you want to delete this tactical plan?')) return;

    try {
      await deletePlanApi(planId);
      const filtered = plans.filter((p) => p._id !== planId);
      setPlans(filtered);
      if (selectedPlan?._id === planId) {
        setSelectedPlan(filtered[0] || null);
      }
      toast.success('Plan deleted successfully');
    } catch (err) {
      console.error('Delete plan error:', err);
      toast.error('Could not delete plan');
    }
  };

  const handleCopyMarkdown = () => {
    if (!selectedPlan) return;
    let md = `# ${selectedPlan.title}\n\n`;
    md += `**Type:** ${selectedPlan.planType} | **Status:** ${selectedPlan.status}\n\n`;
    md += `## Executive Summary\n${selectedPlan.overview}\n\n`;
    if (selectedPlan.lineupRecommendation?.formation) {
      md += `## Recommended Formation: ${selectedPlan.lineupRecommendation.formation} (${selectedPlan.lineupRecommendation.style || 'Tactical Setup'})\n\n`;
      (selectedPlan.lineupRecommendation.startingXI || []).forEach((p) => {
        md += `- **${p.position} - ${p.player}** (${p.role}): ${p.keyInstruction}\n`;
      });
      md += '\n';
    }
    (selectedPlan.phases || []).forEach((phase) => {
      md += `### ${phase.phaseName}\n*${phase.objective}*\n\n`;
      (phase.tactics || []).forEach((t) => {
        md += `- ${t}\n`;
      });
      md += '\n**Action Checklist:**\n';
      (phase.checklist || []).forEach((c) => {
        md += `- [${c.isCompleted ? 'x' : ' '}] ${c.task}\n`;
      });
      md += '\n';
    });
    navigator.clipboard.writeText(md);
    toast.success('Tactical plan copied as Markdown!');
  };

  const calculateOverallProgress = (plan) => {
    if (!plan || !plan.phases) return 0;
    const allItems = plan.phases.flatMap((p) => p.checklist || []);
    if (allItems.length === 0) return 0;
    const completed = allItems.filter((i) => i.isCompleted).length;
    return Math.round((completed / allItems.length) * 100);
  };

  const filteredPlans = filterType === 'all'
    ? plans
    : plans.filter((p) => p.planType === filterType);

  return (
    <div className="h-full flex flex-col bg-background text-text overflow-hidden">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-border/60 bg-card/60 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Compass size={22} className="animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-display font-black tracking-tight text-text">
                Tactical Planner Studio
              </h1>
              <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                Agentic Plan-and-Execute
              </Badge>
            </div>
            <p className="text-xs text-muted">
              Autonomous multi-step tactical decomposition, scouting campaigns & match preparation.
            </p>
          </div>
        </div>

        {selectedPlan && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyMarkdown}
              className="text-xs gap-1.5 h-8 font-medium"
            >
              <Copy size={13} />
              <span>Copy Markdown</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="text-xs gap-1.5 h-8 font-medium hidden sm:flex"
            >
              <Printer size={13} />
              <span>Print Plan</span>
            </Button>
          </div>
        )}
      </div>

      {/* Main Studio Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Templates & Saved Plans */}
        <div className="w-80 border-r border-border/60 bg-card/40 flex flex-col shrink-0 overflow-hidden">
          {/* Quick Filter Tabs */}
          <div className="p-3 border-b border-border/50">
            <div className="flex items-center gap-1 p-1 bg-background/60 rounded-xl border border-border/50 text-[11px] font-semibold">
              <button
                onClick={() => setFilterType('all')}
                className={`flex-1 py-1 px-2 rounded-lg transition-all ${
                  filterType === 'all'
                    ? 'bg-primary text-black font-bold shadow-sm'
                    : 'text-muted hover:text-text'
                }`}
              >
                All ({plans.length})
              </button>
              <button
                onClick={() => setFilterType('match_preparation')}
                className={`flex-1 py-1 px-2 rounded-lg transition-all ${
                  filterType === 'match_preparation'
                    ? 'bg-primary text-black font-bold shadow-sm'
                    : 'text-muted hover:text-text'
                }`}
              >
                Matches
              </button>
              <button
                onClick={() => setFilterType('scouting_campaign')}
                className={`flex-1 py-1 px-2 rounded-lg transition-all ${
                  filterType === 'scouting_campaign'
                    ? 'bg-primary text-black font-bold shadow-sm'
                    : 'text-muted hover:text-text'
                }`}
              >
                Scouting
              </button>
            </div>
          </div>

          {/* Saved Plans List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <div className="text-[10px] font-bold text-muted uppercase tracking-wider px-1">
              Active Tactical Dossiers
            </div>

            {isLoadingPlans ? (
              <div className="space-y-2 pt-2">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 rounded-xl bg-card border border-border/40 animate-pulse" />
                ))}
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted">
                No tactical plans found. Create your first plan using the generator above!
              </div>
            ) : (
              filteredPlans.map((plan) => {
                const isSelected = selectedPlan?._id === plan._id;
                const progress = calculateOverallProgress(plan);
                return (
                  <div
                    key={plan._id}
                    onClick={() => setSelectedPlan(plan)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer group relative ${
                      isSelected
                        ? 'bg-primary/[0.08] border-primary/50 shadow-sm'
                        : 'bg-card/70 border-border/50 hover:bg-card hover:border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-xs text-text line-clamp-1 group-hover:text-primary transition-colors">
                        {plan.title}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePlan(plan._id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 hover:text-red-400 text-muted transition-all"
                        title="Delete Plan"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted">
                      <span className="capitalize">{plan.planType?.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>{new Date(plan.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full bg-border/40 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            progress === 100 ? 'bg-emerald-400' : 'bg-primary'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-bold text-muted">
                        {progress}%
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center/Right Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-background/50">
          {/* Goal Input & Template Launcher Panel */}
          <div className="p-6 border-b border-border/60 bg-card/30">
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                  <Sparkles size={14} />
                  <span>Prompt AI Planner Agent</span>
                </div>

                {/* Templates Quick selector */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {templates.slice(0, 3).map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleSelectTemplate(tpl)}
                      className="px-2.5 py-1 rounded-lg border border-border/60 bg-card/80 hover:border-primary/40 hover:text-primary text-[10px] font-semibold text-muted transition-all shrink-0 cursor-pointer"
                    >
                      {tpl.title}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleGeneratePlan} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    placeholder="Enter football objective (e.g. 'Match plan vs Real Madrid prioritizing counter-press & half-space overloads')..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-card text-xs text-text placeholder:text-muted focus:outline-none focus:border-primary transition-all"
                    disabled={isGenerating}
                  />

                  <select
                    value={selectedPlanType}
                    onChange={(e) => setSelectedPlanType(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-border bg-card text-xs text-text focus:outline-none focus:border-primary shrink-0"
                    disabled={isGenerating}
                  >
                    <option value="match_preparation">Match Preparation</option>
                    <option value="scouting_campaign">Scouting Campaign</option>
                    <option value="tactical_drill_progression">4-Week Training Progression</option>
                    <option value="custom">Custom Tactical Goal</option>
                  </select>

                  <Button
                    type="submit"
                    disabled={isGenerating || !goalInput.trim()}
                    className="h-10 px-5 text-xs font-bold gap-2 shrink-0 bg-primary hover:bg-primary/90 text-black shadow-md"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Planning...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={13} />
                        <span>Generate Masterplan</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>

              {/* Live Generation Stepper */}
              <AnimatePresence>
                {isGenerating && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 rounded-xl border border-primary/30 bg-primary/[0.04] space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-primary">
                      <span>Autonomous Execution in Progress...</span>
                      <span>Phase {generationStep} of 3</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div className={`p-2.5 rounded-lg border transition-all ${
                        generationStep >= 1 ? 'bg-primary/10 border-primary/40 text-text font-semibold' : 'border-border/40 text-muted'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          <Brain size={13} className={generationStep === 1 ? 'animate-pulse text-primary' : ''} />
                          <span>1. Decomposing Goal</span>
                        </div>
                      </div>

                      <div className={`p-2.5 rounded-lg border transition-all ${
                        generationStep >= 2 ? 'bg-primary/10 border-primary/40 text-text font-semibold' : 'border-border/40 text-muted'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          <Activity size={13} className={generationStep === 2 ? 'animate-pulse text-primary' : ''} />
                          <span>2. Querying RAG & Tools</span>
                        </div>
                      </div>

                      <div className={`p-2.5 rounded-lg border transition-all ${
                        generationStep >= 3 ? 'bg-primary/10 border-primary/40 text-text font-semibold' : 'border-border/40 text-muted'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          <Target size={13} className={generationStep === 3 ? 'animate-pulse text-primary' : ''} />
                          <span>3. Synthesizing Masterplan</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Active Plan Detail View */}
          <div className="flex-1 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {!selectedPlan ? (
                <div className="p-12 text-center rounded-2xl border border-dashed border-border/70 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <Compass size={24} />
                  </div>
                  <h3 className="font-display font-bold text-sm text-text">
                    No Tactical Plan Selected
                  </h3>
                  <p className="text-xs text-muted max-w-sm mx-auto">
                    Type a goal in the prompt box above or select one of the quick templates to let the Planner Agent formulate your tactical blueprint.
                  </p>
                </div>
              ) : (
                <>
                  {/* Plan Header Card */}
                  <div className="p-5 rounded-2xl border border-border/70 bg-card shadow-sm space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-display font-black text-text">
                            {selectedPlan.title}
                          </h2>
                          <Badge variant="outline" className="text-[10px] capitalize text-primary border-primary/30">
                            {selectedPlan.planType?.replace('_', ' ')}
                          </Badge>
                        </div>
                        {selectedPlan.opponent?.name && (
                          <div className="text-xs text-muted mt-0.5">
                            Target Opponent: <span className="text-text font-semibold">{selectedPlan.opponent.name}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-[10px] text-muted uppercase font-bold">Preparation Progress</div>
                          <div className="text-sm font-black text-primary">
                            {calculateOverallProgress(selectedPlan)}% Completed
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-text/90 leading-relaxed bg-background/60 p-3.5 rounded-xl border border-border/40">
                      {selectedPlan.overview}
                    </p>

                    {/* Recalled Memory pill indicators */}
                    {selectedPlan.recalledMemories && selectedPlan.recalledMemories.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                          <Brain size={11} />
                          Personalized with Memories:
                        </span>
                        {selectedPlan.recalledMemories.map((m, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                          >
                            {m.fact || m}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recommended Formation & Tactical Roles */}
                  {selectedPlan.lineupRecommendation?.formation && (
                    <div className="p-5 rounded-2xl border border-border/70 bg-card space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-primary" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-text">
                            Recommended Setup: {selectedPlan.lineupRecommendation.formation}
                          </h3>
                        </div>
                        {selectedPlan.lineupRecommendation.style && (
                          <span className="text-[11px] font-medium text-muted">
                            Style: <span className="text-primary font-semibold">{selectedPlan.lineupRecommendation.style}</span>
                          </span>
                        )}
                      </div>

                      {/* Starting XI Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {(selectedPlan.lineupRecommendation.startingXI || []).map((p, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-background/60 border border-border/50 flex items-start gap-2.5"
                          >
                            <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-[10px] font-mono font-bold shrink-0">
                              {p.position || 'XI'}
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-text flex items-center gap-1.5">
                                <span>{p.player}</span>
                                {p.role && (
                                  <span className="text-[9px] font-normal text-muted px-1.5 py-0.2 rounded bg-border/40">
                                    {p.role}
                                  </span>
                                )}
                              </div>
                              {p.keyInstruction && (
                                <div className="text-[10px] text-muted leading-tight mt-0.5 line-clamp-2">
                                  {p.keyInstruction}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Planned Substitutions */}
                      {selectedPlan.lineupRecommendation.substitutions && selectedPlan.lineupRecommendation.substitutions.length > 0 && (
                        <div className="pt-2 border-t border-border/40 space-y-2">
                          <div className="text-[10px] font-bold text-muted uppercase tracking-wider">
                            In-Game Substitution Triggers
                          </div>
                          <div className="space-y-1.5">
                            {selectedPlan.lineupRecommendation.substitutions.map((sub, sIdx) => (
                              <div
                                key={sIdx}
                                className="p-2 rounded-lg bg-background/40 border border-border/30 text-[11px] flex items-center justify-between gap-3"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-primary font-mono">{sub.minute || '60\''}</span>
                                  <span className="text-text font-medium">{sub.inPlayer} ⇄ {sub.outPlayer}</span>
                                </div>
                                <span className="text-muted text-[10px] italic">
                                  {sub.tacticalTrigger}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Structured Tactical Phases & Interactive Checklist */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers size={16} className="text-primary" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-text">
                          Strategic Phases & Action Items
                        </h3>
                      </div>
                    </div>

                    {(selectedPlan.phases || []).map((phase, pIdx) => {
                      const completedCount = (phase.checklist || []).filter((i) => i.isCompleted).length;
                      const totalCount = (phase.checklist || []).length;
                      return (
                        <div
                          key={phase._id || pIdx}
                          className="p-5 rounded-2xl border border-border/70 bg-card space-y-3.5"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-bold text-text flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center">
                                  {pIdx + 1}
                                </span>
                                <span>{phase.phaseName}</span>
                              </h4>
                              {phase.objective && (
                                <p className="text-[11px] text-muted mt-0.5">
                                  {phase.objective}
                                </p>
                              )}
                            </div>

                            {totalCount > 0 && (
                              <Badge variant="outline" className="text-[9px] text-muted">
                                {completedCount}/{totalCount} Tasks Done
                              </Badge>
                            )}
                          </div>

                          {/* Tactical Guidelines */}
                          {phase.tactics && phase.tactics.length > 0 && (
                            <div className="space-y-1.5 p-3 rounded-xl bg-background/50 border border-border/40">
                              <div className="text-[10px] font-bold uppercase text-primary tracking-wider">
                                Tactical Principles
                              </div>
                              <ul className="space-y-1">
                                {phase.tactics.map((tactic, tIdx) => (
                                  <li key={tIdx} className="text-xs text-text/90 flex items-start gap-2">
                                    <span className="text-primary font-bold">•</span>
                                    <span>{tactic}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Interactive Checklist Tasks */}
                          {phase.checklist && phase.checklist.length > 0 && (
                            <div className="space-y-2 pt-1">
                              <div className="text-[10px] font-bold uppercase text-muted tracking-wider">
                                Action Checklist
                              </div>
                              <div className="space-y-1.5">
                                {phase.checklist.map((item) => (
                                  <div
                                    key={item._id}
                                    onClick={() => handleToggleChecklist(phase._id, item._id, item.isCompleted)}
                                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                      item.isCompleted
                                        ? 'bg-emerald-500/[0.06] border-emerald-500/30 text-muted'
                                        : 'bg-background/80 border-border/50 hover:border-primary/40 text-text'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      {item.isCompleted ? (
                                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                                      ) : (
                                        <Circle size={16} className="text-muted hover:text-primary shrink-0 transition-colors" />
                                      )}
                                      <span className={`text-xs ${item.isCompleted ? 'line-through text-muted' : 'font-medium'}`}>
                                        {item.task}
                                      </span>
                                    </div>

                                    {item.completedAt && (
                                      <span className="text-[9px] text-emerald-400/80 shrink-0">
                                        Done
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Contingencies Card */}
                  {selectedPlan.contingencies && selectedPlan.contingencies.length > 0 && (
                    <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] space-y-3">
                      <div className="flex items-center gap-2 text-amber-400">
                        <AlertCircle size={16} />
                        <h3 className="text-xs font-bold uppercase tracking-wider">
                          In-Game Contingency Plans
                        </h3>
                      </div>

                      <div className="space-y-2">
                        {selectedPlan.contingencies.map((c, cIdx) => (
                          <div
                            key={cIdx}
                            className="p-3 rounded-xl bg-card border border-border/50 text-xs space-y-1"
                          >
                            <div className="font-bold text-text">
                              Scenario: {c.scenario}
                            </div>
                            <div className="text-muted leading-relaxed">
                              ↳ <span className="text-primary font-medium">Action:</span> {c.action}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlannerStudio;
