import React, { useState, useEffect, useRef } from 'react';
import {
  Users2, Sparkles, Send, Bot, Brain, Shield,
  Activity, ArrowRight, RefreshCw, Copy, Check,
  ChevronDown, ChevronUp, Layers, CheckCircle2,
  AlertCircle, MessageSquare, Zap, Target, Search,
  Compass, BookOpen, Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import {
  getAgentsRegistryApi,
  runMultiAgentCollaborationApi,
  sendDirectAgentChatApi,
} from '../../api/multiAgent.api';

const PRESET_PROMPTS = [
  {
    title: "Derby Prep & Scouting",
    prompt: "We have an upcoming derby against Arsenal. Break down how to counter their inverted fullback build-up, and recommend 2 transfer targets under €35M who can strengthen our midfield transition.",
    type: "collaborative",
  },
  {
    title: "Low-Block Breakdown",
    prompt: "Design a tactical blueprint to break down a compact 5-4-1 low-block defense, and identify what specific physical and technical profiles we need on the wings.",
    type: "collaborative",
  },
  {
    title: "U23 Playmaker Scouting",
    prompt: "Scout 3 high-potential U23 creative attacking midfielders with top-decile progressive passes, high press resistance, and market value under €40M.",
    agentId: "chief_scout",
  },
  {
    title: "IFAB VAR Handball Rule",
    prompt: "Explain the exact IFAB 2025/2026 handball regulations regarding unnatural barrier positioning and deflections off a player's own body.",
    agentId: "ifab_specialist",
  },
];

export const MultiAgentStudio = () => {
  const [agents, setAgents] = useState([]);
  const [isLoadingRegistry, setIsLoadingRegistry] = useState(true);
  const [activeMode, setActiveMode] = useState('collaborative'); // 'collaborative' | 'direct'
  const [selectedAgentId, setSelectedAgentId] = useState('tactical_analyst');

  // Input & Execution state
  const [inputQuery, setInputQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStaffStep, setActiveStaffStep] = useState(0); // 0: idle, 1: orchestrating, 2: parallel specialist execution, 3: synthesis

  // Results state
  const [collaborativeResult, setCollaborativeResult] = useState(null);
  const [directMessages, setDirectMessages] = useState([]);
  const [expandedAgentId, setExpandedAgentId] = useState(null);

  const directChatEndRef = useRef(null);

  useEffect(() => {
    fetchRegistry();
  }, []);

  useEffect(() => {
    if (activeMode === 'direct') {
      directChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [directMessages, activeMode]);

  const fetchRegistry = async () => {
    setIsLoadingRegistry(true);
    try {
      const data = await getAgentsRegistryApi();
      setAgents(data || []);
    } catch (err) {
      console.error('Failed to fetch backroom agents:', err);
      toast.error('Could not load backroom staff registry');
    } finally {
      setIsLoadingRegistry(false);
    }
  };

  const handleSelectPreset = (preset) => {
    setInputQuery(preset.prompt);
    if (preset.agentId) {
      setActiveMode('direct');
      setSelectedAgentId(preset.agentId);
    } else {
      setActiveMode('collaborative');
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!inputQuery.trim() || isProcessing) return;

    const query = inputQuery.trim();
    setInputQuery('');
    setIsProcessing(true);

    if (activeMode === 'collaborative') {
      setActiveStaffStep(1);
      const timer1 = setTimeout(() => setActiveStaffStep(2), 1200);
      const timer2 = setTimeout(() => setActiveStaffStep(3), 2800);

      try {
        const result = await runMultiAgentCollaborationApi({ query });
        clearTimeout(timer1);
        clearTimeout(timer2);
        setActiveStaffStep(0);
        setIsProcessing(false);
        setCollaborativeResult(result);
        if (result?.agentsInvolved?.length > 0) {
          setExpandedAgentId(result.agentsInvolved[0].agentId);
        }
        toast.success('Backroom staff consensus synthesized!');
      } catch (err) {
        clearTimeout(timer1);
        clearTimeout(timer2);
        setActiveStaffStep(0);
        setIsProcessing(false);
        console.error('Collaboration failed:', err);
        toast.error(err?.response?.data?.message || err?.message || 'Collaboration request failed.');
      }
    } else {
      // Direct 1-on-1 Specialist Chat
      const userMsg = { id: `user-${Date.now()}`, sender: 'user', text: query };
      setDirectMessages((prev) => [...prev, userMsg]);

      try {
        const response = await sendDirectAgentChatApi(selectedAgentId, {
          prompt: query,
          history: directMessages.map((m) => ({ sender: m.sender, text: m.text })),
        });
        setIsProcessing(false);
        if (response) {
          const agentMsg = {
            id: `agent-${Date.now()}`,
            sender: 'agent',
            agentName: response.agentName,
            agentTitle: response.agentTitle,
            avatar: response.avatar,
            color: response.color,
            text: response.response,
          };
          setDirectMessages((prev) => [...prev, agentMsg]);
        }
      } catch (err) {
        setIsProcessing(false);
        console.error('Direct chat failed:', err);
        toast.error('Specialist consultation failed.');
      }
    }
  };

  const handleCopyMarkdown = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success('Report copied to clipboard!');
  };

  const selectedAgentMeta = agents.find((a) => a.id === selectedAgentId) || agents[0];

  return (
    <div className="h-full flex flex-col bg-background text-text overflow-hidden">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-border/60 bg-card/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Users2 size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-display font-black tracking-tight text-text">
                Backroom Staff Multi-Agent Studio
              </h1>
              <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                Multi-Agent Ensemble
              </Badge>
            </div>
            <p className="text-xs text-muted">
              Autonomous backroom staff collaboration, domain delegation, and specialist consultations.
            </p>
          </div>
        </div>

        {/* Mode Selector Toggle */}
        <div className="flex items-center gap-1 p-1 bg-background/80 rounded-xl border border-border/70 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveMode('collaborative')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeMode === 'collaborative'
                ? 'bg-primary text-black font-bold shadow-sm'
                : 'text-muted hover:text-text'
            }`}
          >
            <Sparkles size={13} />
            <span>Collaborative Staff</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('direct')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeMode === 'direct'
                ? 'bg-primary text-black font-bold shadow-sm'
                : 'text-muted hover:text-text'
            }`}
          >
            <Bot size={13} />
            <span>Direct 1-on-1 Specialist</span>
          </button>
        </div>
      </div>

      {/* Staff Roster Bar */}
      <div className="px-6 py-3 border-b border-border/50 bg-card/30 overflow-x-auto no-scrollbar shrink-0">
        <div className="flex items-center gap-3 min-w-max">
          <span className="text-[10px] uppercase font-bold text-muted tracking-wider">
            Backroom Specialists:
          </span>
          {isLoadingRegistry ? (
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="w-36 h-10 rounded-xl bg-card border border-border/40 animate-pulse" />
              ))}
            </div>
          ) : (
            agents.map((agent) => {
              const isSelected = activeMode === 'direct' && selectedAgentId === agent.id;
              return (
                <button
                  key={agent.id}
                  onClick={() => {
                    setSelectedAgentId(agent.id);
                    if (activeMode !== 'direct') setActiveMode('direct');
                  }}
                  className={`px-3 py-2 rounded-xl border flex items-center gap-2 transition-all text-left cursor-pointer group ${
                    isSelected
                      ? 'bg-primary/10 border-primary/60 shadow-sm'
                      : 'bg-card/70 border-border/50 hover:border-primary/40 hover:bg-card'
                  }`}
                >
                  <span className="text-base">{agent.avatar}</span>
                  <div>
                    <div className="text-xs font-bold text-text group-hover:text-primary transition-colors flex items-center gap-1.5">
                      <span>{agent.name}</span>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      )}
                    </div>
                    <div className="text-[9px] text-muted truncate max-w-[130px]">
                      {agent.title}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeMode === 'collaborative' ? (
          /* ================= Collaborative Staff View ================= */
          <div className="flex-1 flex flex-col overflow-y-auto p-6">
            <div className="max-w-4xl w-full mx-auto space-y-6">
              {/* Presets Bar */}
              <div className="space-y-2">
                <div className="text-[10px] uppercase font-bold text-muted tracking-wider flex items-center gap-1.5">
                  <Zap size={12} className="text-primary" />
                  <span>Strategic Multi-Agent Scenarios</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRESET_PROMPTS.slice(0, 2).map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectPreset(preset)}
                      className="p-3 rounded-xl border border-border/60 bg-card/60 hover:border-primary/40 hover:bg-card text-left transition-all group cursor-pointer"
                    >
                      <div className="text-xs font-bold text-text group-hover:text-primary transition-colors">
                        {preset.title}
                      </div>
                      <div className="text-[11px] text-muted line-clamp-2 mt-0.5">
                        {preset.prompt}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="p-3.5 rounded-2xl border border-border bg-card shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary">
                    <Crown size={14} />
                    <span>Brief the Director of Football & Staff</span>
                  </div>
                  <textarea
                    rows={3}
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    placeholder="Enter complex multi-disciplinary query (e.g., 'How should we approach the Champions League tie vs Bayern Munich? Analyze their high-line vulnerabilities, our pressing triggers, and recommend a squad rotation plan')..."
                    className="w-full p-3 rounded-xl border border-border/60 bg-background text-xs text-text placeholder:text-muted focus:outline-none focus:border-primary transition-all resize-none"
                    disabled={isProcessing}
                  />
                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] text-muted flex items-center gap-1">
                      <span>👑 Orchestrator will automatically assign backroom specialists</span>
                    </div>
                    <Button
                      type="submit"
                      disabled={isProcessing || !inputQuery.trim()}
                      className="h-9 px-5 text-xs font-bold gap-2 bg-primary hover:bg-primary/90 text-black shadow-md"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          <span>Collaborating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={13} />
                          <span>Deploy Staff</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>

              {/* Parallel Execution Stepper */}
              <AnimatePresence>
                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 rounded-2xl border border-primary/30 bg-primary/[0.04] space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-primary">
                      <span>Multi-Agent Parallel Delegation Active</span>
                      <span>Phase {activeStaffStep} of 3</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                      <div className={`p-2.5 rounded-xl border transition-all ${
                        activeStaffStep >= 1 ? 'bg-primary/10 border-primary/40 text-text font-semibold' : 'border-border/40 text-muted'
                      }`}>
                        <div className="flex items-center gap-2">
                          <Crown size={14} className={activeStaffStep === 1 ? 'animate-pulse text-amber-400' : ''} />
                          <span>1. Orchestrator Decomposing</span>
                        </div>
                      </div>

                      <div className={`p-2.5 rounded-xl border transition-all ${
                        activeStaffStep >= 2 ? 'bg-primary/10 border-primary/40 text-text font-semibold' : 'border-border/40 text-muted'
                      }`}>
                        <div className="flex items-center gap-2">
                          <Activity size={14} className={activeStaffStep === 2 ? 'animate-pulse text-emerald-400' : ''} />
                          <span>2. Parallel Specialist Audits</span>
                        </div>
                      </div>

                      <div className={`p-2.5 rounded-xl border transition-all ${
                        activeStaffStep >= 3 ? 'bg-primary/10 border-primary/40 text-text font-semibold' : 'border-border/40 text-muted'
                      }`}>
                        <div className="flex items-center gap-2">
                          <Sparkles size={14} className={activeStaffStep === 3 ? 'animate-pulse text-primary' : ''} />
                          <span>3. Synthesizing Master Dossier</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Collaborative Output View */}
              {collaborativeResult && (
                <div className="space-y-6">
                  {/* Master Executive Report Card */}
                  <div className="p-6 rounded-2xl border border-border/70 bg-card shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                          <Crown size={18} />
                        </span>
                        <div>
                          <h2 className="text-sm font-display font-black text-text">
                            Executive Master Dossier
                          </h2>
                          <div className="text-[10px] text-muted">
                            Synthesized by Lead Orchestrator in {collaborativeResult.durationMs}ms
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyMarkdown(collaborativeResult.masterReport)}
                        className="text-xs gap-1.5 h-8 font-medium"
                      >
                        <Copy size={13} />
                        <span>Copy Report</span>
                      </Button>
                    </div>

                    <div className="prose prose-invert max-w-none text-xs text-text/90 leading-relaxed whitespace-pre-line p-4 rounded-xl bg-background/60 border border-border/40">
                      {collaborativeResult.masterReport}
                    </div>

                    {/* Recalled Memory tags */}
                    {collaborativeResult.recalledMemories && collaborativeResult.recalledMemories.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[10px] text-emerald-400 font-semibold">
                        <Brain size={12} />
                        <span>Incorporated Personal Tactics:</span>
                        {collaborativeResult.recalledMemories.map((m, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px]"
                          >
                            {m.fact || m}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Expandable Individual Specialist Reports */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                      <Layers size={14} className="text-primary" />
                      <span>Individual Specialist Findings ({collaborativeResult.agentsInvolved?.length || 0})</span>
                    </div>

                    <div className="space-y-2.5">
                      {(collaborativeResult.agentsInvolved || []).map((agent) => {
                        const isExpanded = expandedAgentId === agent.agentId;
                        return (
                          <div
                            key={agent.agentId}
                            className="rounded-2xl border border-border/60 bg-card overflow-hidden transition-all"
                          >
                            <button
                              type="button"
                              onClick={() => setExpandedAgentId(isExpanded ? null : agent.agentId)}
                              className="w-full p-4 flex items-center justify-between text-left hover:bg-background/40 transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="text-xl">{agent.avatar}</span>
                                <div>
                                  <div className="text-xs font-bold text-text flex items-center gap-2">
                                    <span>{agent.agentName}</span>
                                    <Badge variant="outline" className="text-[9px] text-muted">
                                      {agent.agentTitle}
                                    </Badge>
                                  </div>
                                  <div className="text-[10px] text-muted">
                                    Specialist Domain Investigation
                                  </div>
                                </div>
                              </div>

                              {isExpanded ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
                            </button>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="px-4 pb-4 pt-1 border-t border-border/40"
                                >
                                  <div className="p-3.5 rounded-xl bg-background/70 border border-border/40 text-xs text-text/90 whitespace-pre-line leading-relaxed">
                                    {agent.findings}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ================= Direct 1-on-1 Specialist View ================= */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Active Specialist Banner */}
            <div className="px-6 py-3 border-b border-border/50 bg-card/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedAgentMeta.avatar}</span>
                <div>
                  <div className="text-xs font-bold text-text flex items-center gap-2">
                    <span>{selectedAgentMeta.name}</span>
                    <Badge variant="outline" className="text-[9px] text-primary border-primary/30">
                      {selectedAgentMeta.role}
                    </Badge>
                  </div>
                  <div className="text-[10px] text-muted">
                    {selectedAgentMeta.description}
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Conversation Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="max-w-3xl mx-auto space-y-4">
                {directMessages.length === 0 ? (
                  <div className="p-10 text-center rounded-2xl border border-dashed border-border/70 space-y-3">
                    <div className="text-3xl">{selectedAgentMeta.avatar}</div>
                    <h3 className="font-display font-bold text-sm text-text">
                      Consult directly with {selectedAgentMeta.name}
                    </h3>
                    <p className="text-xs text-muted max-w-sm mx-auto">
                      Ask specialized inquiries regarding {selectedAgentMeta.capabilities?.join(', ')}.
                    </p>
                  </div>
                ) : (
                  directMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.sender === 'agent' && (
                        <div className="text-xl shrink-0 mt-1">{msg.avatar}</div>
                      )}
                      <div
                        className={`p-4 rounded-2xl max-w-2xl text-xs leading-relaxed whitespace-pre-line border ${
                          msg.sender === 'user'
                            ? 'bg-primary text-black font-semibold border-primary/80 rounded-br-none'
                            : 'bg-card text-text border-border/60 rounded-tl-none shadow-sm'
                        }`}
                      >
                        {msg.sender === 'agent' && (
                          <div className="text-[10px] font-bold text-primary mb-1">
                            {msg.agentName} ({msg.agentTitle})
                          </div>
                        )}
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
                <div ref={directChatEndRef} />
              </div>
            </div>

            {/* Direct Chat Input Box */}
            <div className="p-4 border-t border-border/60 bg-card/60 backdrop-blur-md shrink-0">
              <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2">
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder={`Consult ${selectedAgentMeta.name} on ${selectedAgentMeta.role}...`}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-xs text-text placeholder:text-muted focus:outline-none focus:border-primary transition-all"
                  disabled={isProcessing}
                />
                <Button
                  type="submit"
                  disabled={isProcessing || !inputQuery.trim()}
                  className="h-10 px-5 text-xs font-bold gap-1.5 bg-primary hover:bg-primary/90 text-black shadow-md shrink-0"
                >
                  {isProcessing ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                  <span>Ask</span>
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiAgentStudio;
