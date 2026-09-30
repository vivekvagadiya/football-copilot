import React, { useState, useEffect } from 'react';
import { 
  Brain, Plus, Trash2, RefreshCw, Shield, 
  Sparkles, Check, AlertTriangle, Layers, X
} from 'lucide-react';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { 
  getUserMemoriesApi, 
  createUserMemoryApi, 
  deleteUserMemoryApi, 
  clearAllUserMemoriesApi 
} from '../../api/ai.api';

const MEMORY_CATEGORIES = [
  { id: 'all', label: 'All Context' },
  { id: 'tactical_preference', label: 'Tactical Philosophies' },
  { id: 'team_loyalty', label: 'Clubs Supported' },
  { id: 'player_interest', label: 'Player Watchlists' },
  { id: 'scouting_criteria', label: 'Scouting Filters' },
  { id: 'general', label: 'General Facts' },
];

export const MemoryManagerDrawer = ({ isOpen, onClose, onMemoryUpdated }) => {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // New Memory Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFact, setNewFact] = useState('');
  const [newCategory, setNewCategory] = useState('tactical_preference');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchMemories = async () => {
    setLoading(true);
    try {
      const res = await getUserMemoriesApi({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
      });
      setMemories(res?.data || []);
    } catch (err) {
      console.error('Failed to load user memories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMemories();
    }
  }, [isOpen, selectedCategory]);

  const handleAddMemory = async (e) => {
    e.preventDefault();
    if (!newFact.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await createUserMemoryApi({
        fact: newFact.trim(),
        category: newCategory,
      });
      if (res?.data) {
        setMemories((prev) => [res.data, ...prev]);
        setNewFact('');
        setShowAddForm(false);
        showFeedback('Learned new memory and vectorized into Qdrant!');
        if (onMemoryUpdated) onMemoryUpdated();
      }
    } catch (err) {
      console.error('Error creating memory:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMemory = async (id) => {
    try {
      await deleteUserMemoryApi(id);
      setMemories((prev) => prev.filter((m) => m._id !== id));
      showFeedback('Memory permanently removed from cloud & vector index.');
      if (onMemoryUpdated) onMemoryUpdated();
    } catch (err) {
      console.error('Failed to delete memory:', err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to wipe all learned memories and preferences? Football Copilot will reset to baseline.')) {
      return;
    }

    try {
      await clearAllUserMemoriesApi();
      setMemories([]);
      showFeedback('All personal memories and vectors erased successfully.');
      if (onMemoryUpdated) onMemoryUpdated();
    } catch (err) {
      console.error('Failed to clear memories:', err);
    }
  };

  const showFeedback = (msg) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3500);
  };

  const getCategoryBadgeColor = (cat) => {
    switch (cat) {
      case 'tactical_preference':
        return 'bg-primary/15 text-primary border-primary/30';
      case 'team_loyalty':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'player_interest':
        return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
      case 'scouting_criteria':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      default:
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Tactical Memory Hub"
      position="right"
      className="p-4 w-full md:w-[480px]"
    >
      <div className="flex flex-col h-full space-y-4">
        {/* Header / Subtitle */}
        <div className="flex items-start justify-between gap-3 p-3 bg-card/60 border border-border/70 rounded-2xl">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Brain size={18} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-text">Continuous AI Personalization</h3>
              <p className="text-[10px] text-muted leading-relaxed">
                Facts, clubs, and tactical setups Copilot remembers across all chat sessions.
              </p>
            </div>
          </div>
          <button
            onClick={fetchMemories}
            disabled={loading}
            className="p-1.5 rounded-lg border border-border/60 hover:bg-border/20 text-muted hover:text-text cursor-pointer transition-colors"
            title="Refresh memory store"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Feedback alert toast */}
        {actionMessage && (
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <Check size={14} className="text-emerald-400 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Add Memory Button / Form */}
        {!showAddForm ? (
          <Button
            onClick={() => setShowAddForm(true)}
            variant="outline"
            className="w-full text-xs font-bold py-2 h-9 border-dashed border-primary/40 hover:border-primary text-primary flex items-center justify-center gap-1.5"
          >
            <Plus size={13} />
            <span>Teach Copilot a New Preference</span>
          </Button>
        ) : (
          <form
            onSubmit={handleAddMemory}
            className="p-3 rounded-2xl bg-card border border-primary/30 space-y-3 animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text flex items-center gap-1.5">
                <Sparkles size={12} className="text-primary" /> New Tactical Fact
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-muted hover:text-text"
              >
                <X size={14} />
              </button>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-muted block mb-1">
                Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full text-xs p-2 rounded-xl bg-background/80 border border-border/80 text-text focus:outline-none focus:border-primary"
              >
                <option value="tactical_preference">Tactical Preference (e.g. 4-3-3 high press)</option>
                <option value="team_loyalty">Club Loyalty (e.g. Supports Arsenal)</option>
                <option value="player_interest">Player Watchlist (e.g. Tracking Arda Güler)</option>
                <option value="scouting_criteria">Scouting Criteria (e.g. U21 wingers under €30M)</option>
                <option value="general">General Persona Fact</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-muted block mb-1">
                Fact Statement
              </label>
              <textarea
                value={newFact}
                onChange={(e) => setNewFact(e.target.value)}
                placeholder="e.g. Prefers aggressive 3-box-3 build-up with double pivots..."
                rows={2}
                className="w-full text-xs p-2 rounded-xl bg-background/80 border border-border/80 text-text focus:outline-none focus:border-primary resize-none placeholder-muted"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(false)}
                className="text-xs h-7 px-3"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !newFact.trim()}
                className="text-xs h-7 px-3 font-bold"
              >
                {isSubmitting ? 'Syncing...' : 'Save & Vectorize'}
              </Button>
            </div>
          </form>
        )}

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 shrink-0">
          {MEMORY_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                selectedCategory === cat.id
                  ? 'bg-primary text-[#07120D] font-bold border-primary shadow-sm'
                  : 'bg-card/70 text-muted hover:text-text border-border/50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Memories List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-muted flex items-center justify-center gap-2">
              <RefreshCw size={14} className="animate-spin text-primary" />
              <span>Querying Qdrant & MongoDB memory store...</span>
            </div>
          ) : memories.length === 0 ? (
            <div className="py-12 px-4 text-center border border-dashed border-border/70 rounded-2xl space-y-2">
              <Brain size={24} className="text-muted mx-auto opacity-50" />
              <div className="text-xs font-bold text-text">No memories stored in this category</div>
              <p className="text-[10.5px] text-muted max-w-xs mx-auto leading-relaxed">
                As you chat, Football Copilot will automatically distill your tactical preferences, or you can add them manually above.
              </p>
            </div>
          ) : (
            memories.map((m) => (
              <div
                key={m._id}
                className="p-3 rounded-xl bg-card/70 border border-border/60 hover:border-primary/30 transition-all flex items-start justify-between gap-3 group"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[8.5px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${getCategoryBadgeColor(
                        m.category
                      )}`}
                    >
                      {m.category?.replace('_', ' ') || 'General'}
                    </span>
                    {m.qdrantPointId && (
                      <span className="text-[8.5px] text-primary/80 font-mono flex items-center gap-0.5">
                        <Layers size={9} /> Vectorized
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text/90 font-medium leading-relaxed">
                    {m.fact}
                  </p>
                  <span className="text-[9px] text-muted block">
                    Learned {new Date(m.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>

                <button
                  onClick={() => handleDeleteMemory(m._id)}
                  className="p-1.5 rounded-lg border border-border/50 text-muted hover:text-red-400 hover:border-red-500/30 opacity-70 group-hover:opacity-100 transition-all"
                  title="Delete memory"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* GDPR Clear Memory Action */}
        {memories.length > 0 && (
          <div className="pt-2 border-t border-border mt-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="w-full text-[10px] h-7 font-bold py-0 flex items-center justify-center gap-1.5 text-muted hover:text-red-400 hover:border-red-500/30"
            >
              <Trash2 size={10} />
              Reset & Wipe All Memories (GDPR)
            </Button>
          </div>
        )}
      </div>
    </Drawer>
  );
};

export default MemoryManagerDrawer;
