import React, { useState, useEffect } from 'react';
import { Drawer } from '../ui/Drawer';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { 
  BookOpen, Search, Filter, Plus, Database, 
  ExternalLink, Layers, CheckCircle2, AlertCircle, 
  Trash2, FileText, ChevronRight, Sparkles 
} from 'lucide-react';
import { getKnowledgeDocumentsApi, ingestKnowledgeDocumentApi } from '../../api/ai.api';

const CATEGORIES = [
  { id: 'all', label: 'All Dossiers' },
  { id: 'tactics', label: 'Tactics' },
  { id: 'rules', label: 'Rules & IFAB' },
  { id: 'history', label: 'Lore & History' },
  { id: 'scouting', label: 'Scouting & xG' },
  { id: 'general', label: 'General' },
];

export const KnowledgeBaseDrawer = ({
  isOpen,
  onClose,
  onSelectDocumentPrompt,
}) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [totalDocs, setTotalDocs] = useState(0);

  // Ingestion form state
  const [showIngestForm, setShowIngestForm] = useState(false);
  const [ingestForm, setIngestForm] = useState({
    title: '',
    category: 'tactics',
    source: 'Coaching Dossier',
    author: '',
    tags: '',
    rawContent: '',
  });
  const [ingesting, setIngesting] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState(null);
  const [ingestError, setIngestError] = useState(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await getKnowledgeDocumentsApi({
        category: category !== 'all' ? category : undefined,
        search: search.trim() || undefined,
        limit: 50,
      });

      const docs = res?.data?.documents || [];
      const total = res?.data?.pagination?.total || docs.length;
      setDocuments(docs);
      setTotalDocs(total);
    } catch (err) {
      console.error('Error fetching knowledge documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDocuments();
    }
  }, [isOpen, category]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetchDocuments();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleIngest = async (e) => {
    e.preventDefault();
    if (!ingestForm.title.trim() || !ingestForm.rawContent.trim()) {
      setIngestError('Title and content are required.');
      return;
    }

    setIngesting(true);
    setIngestError(null);
    setIngestSuccess(null);

    try {
      const payload = {
        title: ingestForm.title.trim(),
        category: ingestForm.category,
        source: ingestForm.source.trim() || 'Manual Ingestion',
        author: ingestForm.author.trim() || 'Analyst',
        tags: ingestForm.tags
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
        rawContent: ingestForm.rawContent.trim(),
      };

      await ingestKnowledgeDocumentApi(payload);
      setIngestSuccess('Document successfully chunked and added to knowledge base!');
      setIngestForm({
        title: '',
        category: 'tactics',
        source: 'Coaching Dossier',
        author: '',
        tags: '',
        rawContent: '',
      });
      fetchDocuments();
      setTimeout(() => {
        setShowIngestForm(false);
        setIngestSuccess(null);
      }, 1500);
    } catch (err) {
      setIngestError(err?.response?.data?.message || err?.message || 'Ingestion failed.');
    } finally {
      setIngesting(false);
    }
  };

  const getCategoryBadgeVariant = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'tactics': return 'default';
      case 'rules': return 'warning';
      case 'scouting': return 'info';
      case 'history': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Tactical Knowledge Base"
      position="right"
      className="p-4 w-full md:max-w-md flex flex-col h-full overflow-hidden"
    >
      <div className="flex flex-col h-full space-y-3.5 min-h-0">
        
        {/* Header summary & action */}
        <div className="flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Database size={13} className="text-primary" />
            <span>
              Indexed Documents: <strong className="text-text font-bold">{totalDocs}</strong>
            </span>
          </div>
          <Button
            size="sm"
            variant={showIngestForm ? 'outline' : 'primary'}
            onClick={() => setShowIngestForm(!showIngestForm)}
            className="text-[10px] h-7 px-2.5 flex items-center gap-1 font-bold"
          >
            {showIngestForm ? (
              'Close Ingestion'
            ) : (
              <>
                <Plus size={11} /> Ingest Doc
              </>
            )}
          </Button>
        </div>

        {/* Ingestion Collapsible Form */}
        {showIngestForm && (
          <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/[0.04] space-y-3 shrink-0 animate-in fade-in duration-200">
            <div className="text-[11px] font-bold text-primary flex items-center gap-1.5">
              <Sparkles size={13} /> Ingest Football Knowledge Document
            </div>

            {ingestSuccess && (
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] flex items-center gap-1.5">
                <CheckCircle2 size={12} /> {ingestSuccess}
              </div>
            )}
            {ingestError && (
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] flex items-center gap-1.5">
                <AlertCircle size={12} /> {ingestError}
              </div>
            )}

            <form onSubmit={handleIngest} className="space-y-2 text-xs">
              <div>
                <label className="text-[10px] text-muted font-semibold block mb-1">Title *</label>
                <input
                  type="text"
                  placeholder="e.g., Inverted Fullback Transition Tactics"
                  value={ingestForm.title}
                  onChange={(e) => setIngestForm({ ...ingestForm, title: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-text focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted font-semibold block mb-1">Category</label>
                  <select
                    value={ingestForm.category}
                    onChange={(e) => setIngestForm({ ...ingestForm, category: e.target.value })}
                    className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-text focus:outline-none focus:border-primary"
                  >
                    <option value="tactics">Tactics</option>
                    <option value="rules">Rules & IFAB</option>
                    <option value="history">History</option>
                    <option value="scouting">Scouting</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-muted font-semibold block mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="box midfield, rest defense"
                    value={ingestForm.tags}
                    onChange={(e) => setIngestForm({ ...ingestForm, tags: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-text focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-muted font-semibold block mb-1">Dossier Content *</label>
                <textarea
                  rows={4}
                  placeholder="Paste tactical treatise, scouting analysis, or match guidelines..."
                  value={ingestForm.rawContent}
                  onChange={(e) => setIngestForm({ ...ingestForm, rawContent: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-text focus:outline-none focus:border-primary resize-none"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={ingesting}
                size="sm"
                className="w-full text-xs font-bold py-1.5 h-8 flex items-center justify-center gap-1.5"
              >
                {ingesting ? 'Chunking & Ingesting...' : 'Save & Index Document'}
              </Button>
            </form>
          </div>
        )}

        {/* Search Input */}
        <div className="relative shrink-0">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search documents or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-card/60 border border-border/80 rounded-xl text-xs text-text placeholder-muted focus:outline-none focus:border-primary/50"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                category === cat.id
                  ? 'bg-primary text-[#07120D] shadow-sm'
                  : 'bg-card/50 text-muted hover:text-text border border-border/50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 min-h-0 pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted space-y-2">
              <Database size={24} className="animate-spin text-primary" />
              <p className="text-xs">Querying knowledge dossiers...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-border/60 rounded-xl bg-card/20 space-y-2">
              <BookOpen size={24} className="mx-auto text-muted/50" />
              <p className="text-xs font-semibold text-muted">No documents found.</p>
              <p className="text-[10px] text-muted/70">Try adjusting your search query or category filter.</p>
            </div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc._id}
                className="p-3 rounded-xl border border-border/60 bg-card/40 hover:bg-card hover:border-primary/30 transition-all space-y-2 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-text group-hover:text-primary transition-colors leading-snug line-clamp-2">
                    {doc.title}
                  </h4>
                  <Badge variant={getCategoryBadgeVariant(doc.category)} className="text-[9px] uppercase tracking-wider shrink-0 px-1.5 py-0">
                    {doc.category}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-muted">
                  <span className="flex items-center gap-1">
                    <Layers size={10} className="text-primary" /> {doc.chunkCount || doc.chunks?.length || 0} chunks
                  </span>
                  <span>•</span>
                  <span className="truncate max-w-[120px]">{doc.source || 'Knowledge Base'}</span>
                </div>

                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                    {doc.tags.slice(0, 4).map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[8.5px] px-1.5 py-0.5 rounded bg-border/40 text-muted font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                    {doc.tags.length > 4 && (
                      <span className="text-[8.5px] text-muted">+{doc.tags.length - 4}</span>
                    )}
                  </div>
                )}

                <div className="pt-2 border-t border-border/30 flex items-center justify-between">
                  <span className="text-[9px] text-muted font-mono">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </span>
                  
                  <button
                    onClick={() => {
                      if (onSelectDocumentPrompt) {
                        onSelectDocumentPrompt(
                          `Explain the key principles and concepts from: "${doc.title}".`
                        );
                        onClose();
                      }
                    }}
                    className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                  >
                    <span>Ask Copilot</span>
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </Drawer>
  );
};

export default KnowledgeBaseDrawer;
