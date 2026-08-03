import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Cpu, Check, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';

export const AIResponseCard = ({ content }) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'up' | 'down' | null

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

  // A simple and robust parser to render formatting elegantly for mock outputs
  const renderFormatted = (text) => {
    if (!text) return null;

    return text.split('\n').map((line, idx) => {
      // Tables
      if (line.trim().startsWith('|') && line.includes('---')) {
        return null; // Ignore header dividers
      }
      
      if (line.trim().startsWith('|')) {
        const cols = line.split('|').filter(c => c.trim() !== '');
        const isHeader = idx === 2 || idx === 0 || line.includes('Fit Rating') || line.includes('Player') || line.includes('Tactics');
        // Dynamically compute grid cols based on column count to avoid hardcoded grid-cols-5
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
        return <h4 key={idx} className="font-display font-bold text-sm text-primary mt-4 mb-2">{line.replace('###', '').trim()}</h4>;
      }
      if (line.startsWith('####')) {
        return <h5 key={idx} className="font-display font-semibold text-xs text-text mt-3 mb-1">{line.replace('####', '').trim()}</h5>;
      }

      // Code blocks (Lineups)
      if (line.startsWith('[') || line.includes('\\') || line.includes('/')) {
        return (
          <pre key={idx} className="bg-background/85 font-mono text-[10px] p-2 rounded-lg border border-border/40 text-muted overflow-x-auto my-1.5 leading-relaxed">
            {line}
          </pre>
        );
      }

      // Bullet points
      if (line.trim().startsWith('-')) {
        const item = line.trim().substring(1).trim();
        return (
          <div key={idx} className="flex items-start gap-2 text-xs text-text/80 pl-2 my-1 leading-relaxed">
            <span className="text-primary mt-1.5 shrink-0 select-none">•</span>
            <span>{parseInlineFormatting(item)}</span>
          </div>
        );
      }

      // Regular lines
      return (
        <p key={idx} className="text-xs text-text/80 leading-relaxed my-2">
          {parseInlineFormatting(line)}
        </p>
      );
    });
  };

  const parseInlineFormatting = (line) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={pIdx} className="text-text font-bold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={pIdx} className="text-muted italic">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <Card hover={false} className="border border-primary/20 bg-primary/[0.03] hover:bg-primary/[0.05] hover:border-primary/30 p-4 flex gap-3.5 items-start transition-all duration-200 w-full rounded-2xl">
      <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0 shadow-sm">
        <Cpu size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="text-[10px] text-primary uppercase font-bold tracking-widest">
            Copilot Tactical Response
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

        <div className="space-y-0.5 overflow-hidden">
          {renderFormatted(content)}
        </div>
      </div>
    </Card>
  );
};
