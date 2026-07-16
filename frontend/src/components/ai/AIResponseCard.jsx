import React from 'react';
import { Card } from '../ui/Card';
import { Cpu, Check } from 'lucide-react';

export const AIResponseCard = ({ content }) => {
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
        const isHeader = idx === 2 || idx === 0 || line.includes('Fit Rating');
        return (
          <div 
            key={idx} 
            className={`grid grid-cols-5 gap-2 px-3 py-2 text-[10px] border-b border-border/40 ${
              isHeader ? 'bg-border/20 font-bold' : 'hover:bg-border/10'
            }`}
          >
            {cols.map((col, cIdx) => (
              <span key={cIdx} className="truncate">{col.trim().replace(/\*\*/g, '')}</span>
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
          <pre key={idx} className="bg-background/80 font-mono text-[9px] p-1.5 rounded border border-border/40 text-muted overflow-x-auto my-0.5 leading-tight">
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
        <p key={idx} className="text-xs text-text/80 leading-relaxed my-2.5">
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
    <Card hover={false} className="border border-primary/20 bg-primary/5 p-4 flex gap-3 items-start">
      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0">
        <Cpu size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-primary uppercase font-bold tracking-wider mb-2">Copilot Tactical Response</div>
        <div className="space-y-0.5 overflow-hidden">
          {renderFormatted(content)}
        </div>
      </div>
    </Card>
  );
};
