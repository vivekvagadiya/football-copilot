import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Compass, ShieldAlert, Award, User } from 'lucide-react';
import { Dialog } from './Dialog';
import { LEAGUES, TEAMS, PLAYERS } from '../../constants/mockData';

export const SearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ leagues: [], teams: [], players: [] });
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults({ leagues: [], teams: [], players: [] });
      return;
    }

    const q = query.toLowerCase();

    const filteredLeagues = LEAGUES.filter(l => l.name.toLowerCase().includes(q)).slice(0, 3);
    const filteredTeams = TEAMS.filter(t => t.name.toLowerCase().includes(q) || t.shortName.toLowerCase().includes(q)).slice(0, 4);
    const filteredPlayers = PLAYERS.filter(p => p.name.toLowerCase().includes(q) || p.position.toLowerCase().includes(q)).slice(0, 5);

    setResults({ leagues: filteredLeagues, teams: filteredTeams, players: filteredPlayers });
  }, [query]);

  // Command-K keyboard listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
    setQuery('');
  };

  const hasResults = results.leagues.length > 0 || results.teams.length > 0 || results.players.length > 0;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Global Operating Search" className="max-w-lg">
      <div className="relative flex items-center border border-border rounded-lg px-3 bg-background/50 focus-within:ring-2 focus-within:ring-primary/45 mb-4">
        <SearchIcon size={18} className="text-muted shrink-0 mr-2.5" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search leagues, clubs, squad players, tactical prompts... (e.g. Arsenal)"
          className="w-full py-3 bg-transparent text-sm text-text focus:outline-none placeholder-muted"
          autoFocus
        />
      </div>

      <div className="max-h-[300px] overflow-y-auto space-y-4 pr-1">
        {!query.trim() && (
          <div className="text-center py-6 text-muted text-xs space-y-1">
            <Compass size={24} className="mx-auto text-border mb-2" />
            <p>Type to search the Football Copilot database.</p>
            <p className="opacity-75">Tip: Press <kbd className="bg-border/30 px-1 rounded text-[10px]">Ctrl</kbd> + <kbd className="bg-border/30 px-1 rounded text-[10px]">K</kbd> to toggle search.</p>
          </div>
        )}

        {query.trim() && !hasResults && (
          <div className="text-center py-6 text-muted text-xs space-y-1">
            <ShieldAlert size={24} className="mx-auto text-red-500/30 mb-2" />
            <p>No matches found for "{query}"</p>
          </div>
        )}

        {results.leagues.length > 0 && (
          <div>
            <h4 className="text-[10px] uppercase font-bold text-muted tracking-wider mb-1.5 flex items-center gap-1.5 px-2">
              <Award size={12} /> Leagues
            </h4>
            <div className="space-y-0.5">
              {results.leagues.map(l => (
                <button
                  key={l.id}
                  onClick={() => handleNavigate(`/league/${l.id}`)}
                  className="w-full text-left flex items-center justify-between p-2 rounded-lg hover:bg-border/20 text-xs text-text transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base leading-none">{l.logo}</span>
                    <span>{l.name}</span>
                  </span>
                  <span className="text-[10px] text-muted">{l.country}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {results.teams.length > 0 && (
          <div>
            <h4 className="text-[10px] uppercase font-bold text-muted tracking-wider mb-1.5 flex items-center gap-1.5 px-2">
              ⚽ Teams
            </h4>
            <div className="space-y-0.5">
              {results.teams.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleNavigate(`/team/${t.id}`)}
                  className="w-full text-left flex items-center justify-between p-2 rounded-lg hover:bg-border/20 text-xs text-text transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span>{t.logo}</span>
                    <span>{t.name}</span>
                  </span>
                  <span className="text-[10px] text-muted">{t.shortName}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {results.players.length > 0 && (
          <div>
            <h4 className="text-[10px] uppercase font-bold text-muted tracking-wider mb-1.5 flex items-center gap-1.5 px-2">
              <User size={12} /> Players
            </h4>
            <div className="space-y-0.5">
              {results.players.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleNavigate(`/player/${p.id}`)}
                  className="w-full text-left flex items-center justify-between p-2 rounded-lg hover:bg-border/20 text-xs text-text transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span>{p.flag}</span>
                    <span>{p.name}</span>
                  </span>
                  <span className="text-[10px] text-muted">{p.position}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};
