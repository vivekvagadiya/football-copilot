import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { 
  Cpu, Check, Copy, ThumbsUp, ThumbsDown, 
  BookOpen, ChevronDown, ChevronUp, Layers, 
  ShieldCheck, FileText, Sparkles 
} from 'lucide-react';
import { Badge } from '../ui/Badge';

export const AIResponseCard = ({ content, sources = [], chunks = [], isRag = false }) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'up' | 'down' | null
  const [showSources, setShowSources] = useState(false);
  const [activeChunkTab, setActiveChunkTab] = useState(0);

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleFeedback = (type) => {
    if (feedback === type) {
      setFeedback(null); // toggle off
    } else {
      setFeedback(type);
    }
  };

  const getCategoryBadgeVariant = (category) => {
    switch (category?.toLowerCase()) {
      case 'tactics': return 'default';
      case 'rules': return 'warning';
      case 'scouting': return 'info';
      case 'history': return 'secondary';
      default: return 'default';
    }
  };

  // Helper to parse citations like [Doc: "Title", Chunk #1] into clickable/styled badge
  const parseCitationsAndFormatting = (text) => {
    if (!text) return null;

    // Pattern for citations: [Doc: "Title", Chunk #N] or [Doc: "Title"]
    const citationRegex = /\[Doc:\s*"([^"]+)"(?:,\s*Chunk\s*#?(\d+))?\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = citationRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const docTitle = match[1];
      const chunkNum = match[2];

      parts.push(
        <span 
          key={`cite-${match.index}`}
          className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-md bg-primary/10 border border-primary/25 text-primary text-[10px] font-semibold cursor-default select-none shadow-sm hover:bg-primary/20 transition-colors"
          title={`Grounding citation: ${docTitle}${chunkNum ? ` (Chunk #${chunkNum})` : ''}`}
        >
          <BookOpen size={9} className="shrink-0" />
          <span className="truncate max-w-[150px]">{docTitle}</span>
          {chunkNum && <span className="text-primary/70 font-mono">#{chunkNum}</span>}
        </span>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    // Now format standard bold and italics on string chunks
    return parts.map((part, pIdx) => {
      if (typeof part !== 'string') return part;
      return parseInlineFormatting(part, pIdx);
    });
  };

  const parseInlineFormatting = (line, keyPrefix = 0) => {
    const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, pIdx) => {
      const key = `${keyPrefix}-${pIdx}`;
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={key} className="text-text font-bold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={key} className="text-muted italic">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  // Robust parser to render markdown lines
  const renderFormatted = (text) => {
    if (!text) return null;

    return text.split('\n').map((line, idx) => {
      // Tables
      if (line.trim().startsWith('|') && line.includes('---')) {
        return null;
      }
      
      if (line.trim().startsWith('|')) {
        const cols = line.split('|').filter(c => c.trim() !== '');
        const isHeader = idx === 2 || idx === 0 || line.includes('Fit Rating') || line.includes('Player') || line.includes('Tactics');
        const colCount = cols.length;
        return (
          <div 
            key={idx} 
            style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
            className={`grid gap-3 px-3 py-2 text-[10px] border-b border-border/40 items-center overflow-x-auto min-w-[320px] ${
              isHeader ? 'bg-border/20 font-bold text-text' : 'hover:bg-border/10 text-text/80'
            }`}
          >
            {cols.map((col, cIdx) => (
              <span key={cIdx} className="truncate font-mono" title={col.trim()}>
                {col.trim().replace(/\*\*/g, '')}
              </span>
            ))}
          </div>
        );
      }

      // Headers
      if (line.startsWith('###')) {
        return (
          <h4 key={idx} className="font-display font-bold text-sm text-primary mt-4 mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            {line.replace('###', '').trim()}
          </h4>
        );
      }
      if (line.startsWith('####')) {
        return <h5 key={idx} className="font-display font-semibold text-xs text-text mt-3 mb-1">{line.replace('####', '').trim()}</h5>;
      }

      // Code blocks (Lineups or tactics ascii)
      if (line.startsWith('[') && (line.includes('\\') || line.includes('/') || line.includes('---'))) {
        return (
          <pre key={idx} className="bg-background/85 font-mono text-[10px] p-2 rounded-lg border border-border/40 text-muted overflow-x-auto my-1.5 leading-relaxed">
            {line}
          </pre>
        );
      }

      // Bullet points
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const item = line.trim().substring(2).trim();
        return (
          <div key={idx} className="flex items-start gap-2 text-xs text-text/80 pl-2 my-1 leading-relaxed">
            <span className="text-primary mt-1.5 shrink-0 select-none">•</span>
            <span>{parseCitationsAndFormatting(item)}</span>
          </div>
        );
      }

      // Numbered lists
      if (/^\d+\.\s/.test(line.trim())) {
        const match = line.trim().match(/^(\d+)\.\s(.*)/);
        return (
          <div key={idx} className="flex items-start gap-2 text-xs text-text/80 pl-2 my-1 leading-relaxed">
            <span className="text-primary font-bold text-[11px] shrink-0 select-none">{match[1]}.</span>
            <span>{parseCitationsAndFormatting(match[2])}</span>
          </div>
        );
      }

      // Regular lines
      return (
        <p key={idx} className="text-xs text-text/80 leading-relaxed my-2">
          {parseCitationsAndFormatting(line)}
        </p>
      );
    });
  };

  const hasSources = Array.isArray(sources) && sources.length > 0;
  const hasChunks = Array.isArray(chunks) && chunks.length > 0;

  return (
    <Card hover={false} className="border border-primary/20 bg-primary/[0.03] hover:bg-primary/[0.05] hover:border-primary/30 p-4 flex gap-3.5 items-start transition-all duration-200 w-full rounded-2xl shadow-sm">
      <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0 shadow-sm mt-0.5">
        {hasSources || isRag ? <ShieldCheck size={16} /> : <Cpu size={16} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-primary uppercase font-bold tracking-widest flex items-center gap-1">
              Copilot Tactical Response
            </span>
            {(hasSources || isRag) && (
              <Badge variant="default" className="text-[9px] py-0 px-2 flex items-center gap-1 bg-primary/15 border-primary/30 text-primary">
                <Sparkles size={10} /> Grounded RAG
              </Badge>
            )}
          </div>
          
          {/* Action buttons (Copy + Feedback) */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg border border-border/50 hover:bg-border/20 text-muted hover:text-text cursor-pointer transition-colors"
              title="Copy message"
            >
              {copied ? <Check size={11} className="text-primary" /> : <Copy size={11} />}
            </button>
            <button
              onClick={() => handleFeedback('up')}
              className={`p-1.5 rounded-lg border border-border/50 hover:bg-border/20 cursor-pointer transition-colors ${
                feedback === 'up' ? 'text-primary bg-primary/10 border-primary/20' : 'text-muted hover:text-text'
              }`}
              title="Helpful"
            >
              <ThumbsUp size={11} />
            </button>
            <button
              onClick={() => handleFeedback('down')}
              className={`p-1.5 rounded-lg border border-border/50 hover:bg-border/20 cursor-pointer transition-colors ${
                feedback === 'down' ? 'text-red-500 bg-red-500/10 border-red-500/20' : 'text-muted hover:text-text'
              }`}
              title="Not helpful"
            >
              <ThumbsDown size={11} />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="space-y-0.5 overflow-hidden">
          {renderFormatted(content)}
        </div>

        {/* Grounded RAG Sources & Evidence Accordion */}
        {hasSources && (
          <div className="mt-3.5 pt-3 border-t border-border/50">
            <button
              onClick={() => setShowSources(!showSources)}
              className="w-full flex items-center justify-between text-left p-2 rounded-xl bg-card/60 border border-border/60 hover:border-primary/30 hover:bg-card transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="p-1 rounded-md bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                  <BookOpen size={12} />
                </span>
                <span className="text-[11px] font-bold text-text group-hover:text-primary transition-colors">
                  Retrieved Knowledge Base Dossiers ({sources.length})
                </span>
                <div className="flex items-center gap-1.5">
                  {sources.slice(0, 3).map((src, sIdx) => (
                    <span 
                      key={sIdx} 
                      className="text-[9px] px-1.5 py-0.5 rounded bg-border/40 text-muted font-medium truncate max-w-[120px]"
                    >
                      {src.title}
                    </span>
                  ))}
                  {sources.length > 3 && (
                    <span className="text-[9px] text-muted font-bold">+{sources.length - 3}</span>
                  )}
                </div>
              </div>
              <div className="text-muted group-hover:text-primary transition-colors">
                {showSources ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </button>

            {showSources && (
              <div className="mt-2.5 p-3 rounded-xl bg-card/40 border border-border/60 space-y-3 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {sources.map((src, i) => (
                    <div 
                      key={i} 
                      className="p-2.5 rounded-lg border border-border/40 bg-background/50 flex flex-col justify-between space-y-1.5 hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h6 className="text-[11px] font-bold text-text leading-tight line-clamp-2">
                          {src.title}
                        </h6>
                        <Badge variant={getCategoryBadgeVariant(src.category)} className="text-[9px] uppercase tracking-wider shrink-0 px-1.5 py-0">
                          {src.category}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-muted font-medium pt-1 border-t border-border/20">
                        <span>Source: <strong className="text-text/70">{src.source || 'Knowledge Base'}</strong></span>
                        {src.author && <span className="truncate max-w-[100px]">{src.author}</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Evidence Chunks Inspector */}
                {hasChunks && (
                  <div className="mt-2 pt-2 border-t border-border/30">
                    <div className="text-[10px] text-muted font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Layers size={11} className="text-primary" /> Retrieved Evidence Chunks & Relevance
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {chunks.map((chunk, cIdx) => (
                        <div 
                          key={cIdx}
                          className="p-2 rounded-lg bg-background/80 border border-border/50 text-[10px] space-y-1"
                        >
                          <div className="flex items-center justify-between font-mono text-[9px] text-muted">
                            <span className="font-semibold text-primary">
                              Chunk #{chunk.chunkIndex} - {chunk.title}
                            </span>
                            <span className="bg-primary/10 text-primary px-1.5 py-0.2 rounded font-bold">
                              Score: {chunk.score}
                            </span>
                          </div>
                          <p className="text-muted/90 italic leading-relaxed">
                            "{chunk.snippet}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default AIResponseCard;
