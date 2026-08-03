import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Cpu, Trash2, ShieldAlert, Sparkles, CornerDownLeft,
  RotateCcw, History, Plus, MessageSquareCode
} from 'lucide-react';
import { sendAiChatApi } from '../../api/ai.api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { AIResponseCard } from '../../components/ai/AIResponseCard';
import { useApp } from '../../context/AppContext';
import { Drawer } from '../../components/ui/Drawer';

export const AIChat = () => {
  const { user } = useApp();
  const userLetter = user?.username ? user.username[0].toUpperCase() : 'U';

  const [threads, setThreads] = useState(() => {
    const saved = localStorage.getItem('football_copilot_threads');
    return saved ? JSON.parse(saved) : [
      { 
        id: 'ch1', 
        title: 'Arsenal vs City Decider', 
        messages: [
          { id: '1', sender: 'ai', text: "Loaded thread: **Arsenal vs City Decider**. Analysis parameters synchronized." }
        ] 
      },
      { 
        id: 'ch2', 
        title: 'Deep-lying Playmaker scouting', 
        messages: [
          { id: '1', sender: 'ai', text: "Loaded thread: **Deep-lying Playmaker scouting**. Analysis parameters synchronized." }
        ] 
      },
      { 
        id: 'ch3', 
        title: 'Haaland vs Yamal metrics', 
        messages: [
          { id: '1', sender: 'ai', text: "Loaded thread: **Haaland vs Yamal metrics**. Analysis parameters synchronized." }
        ] 
      }
    ];
  });

  const [activeThreadId, setActiveThreadId] = useState(() => {
    const saved = localStorage.getItem('football_copilot_active_thread_id');
    return saved || 'ch1';
  });

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const intervalRef = useRef(null);

  // Sync threads to localStorage
  useEffect(() => {
    localStorage.setItem('football_copilot_threads', JSON.stringify(threads));
  }, [threads]);

  // Sync active thread ID to localStorage
  useEffect(() => {
    if (activeThreadId) {
      localStorage.setItem('football_copilot_active_thread_id', activeThreadId);
    } else {
      localStorage.removeItem('football_copilot_active_thread_id');
    }
  }, [activeThreadId]);

  // Cleanup typewriter interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const activeThread = threads.find(t => t.id === activeThreadId);
  const messages = activeThread ? activeThread.messages : [];

  // Scroll bottom on message change or typing state
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const streamAIResponse = (threadId, fullResponse) => {
    let currentText = '';
    const words = fullResponse.split(' ');
    let wordIdx = 0;

    const tempId = `ai-${Date.now()}`;
    setThreads(prev => prev.map(t => {
      if (t.id === threadId) {
        return {
          ...t,
          messages: [...t.messages, { id: tempId, sender: 'ai', text: '' }]
        };
      }
      return t;
    }));

    const interval = setInterval(() => {
      if (wordIdx < words.length) {
        currentText += (wordIdx === 0 ? '' : ' ') + words[wordIdx];
        setThreads(prev => prev.map(t => {
          if (t.id === threadId) {
            return {
              ...t,
              messages: t.messages.map(msg => msg.id === tempId ? { ...msg, text: currentText } : msg)
            };
          }
          return t;
        }));
        wordIdx++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 20);

    intervalRef.current = interval;
  };

  const handleSendMessage = async (textToSend) => {
    if (!textToSend.trim() || isTyping) return;

    const currentInput = textToSend;
    setInput('');
    setIsTyping(true);

    let currentThreadId = activeThreadId;

    if (!currentThreadId) {
      currentThreadId = `thread-${Date.now()}`;
      const newThreadTitle = currentInput.length > 25 ? currentInput.substring(0, 25) + '...' : currentInput;
      
      setThreads(prev => [
        {
          id: currentThreadId,
          title: newThreadTitle,
          messages: []
        },
        ...prev
      ]);
      setActiveThreadId(currentThreadId);
    }

    const userMessage = { id: `u-${Date.now()}`, sender: 'user', text: currentInput };
    
    // Optimistically add user message
    setThreads(prev => prev.map(t => {
      if (t.id === currentThreadId) {
        return {
          ...t,
          messages: [...t.messages, userMessage]
        };
      }
      return t;
    }));

    try {
      // Find the thread messages for context history
      // Note: setThreads is asynchronous, so we extract history from activeThread list
      const activeTh = threads.find(t => t.id === currentThreadId);
      const historyContext = activeTh 
        ? [...activeTh.messages, userMessage]
            .filter(m => m.id !== '1' && !m.id.startsWith('err-'))
            .map(m => ({ sender: m.sender, text: m.text }))
        : [userMessage].map(m => ({ sender: m.sender, text: m.text }));

      const res = await sendAiChatApi({
        prompt: currentInput,
        history: historyContext.slice(0, -1) // slice out latest user message since Gemini takes prompt separately
      });

      const responseText = res?.data?.response || res?.response || "Analysis complete.";
      streamAIResponse(currentThreadId, responseText);
    } catch (err) {
      setIsTyping(false);
      const errMsg = err?.response?.data?.message || err?.message || "Could not connect to AI service.";
      setThreads(prev => prev.map(t => {
        if (t.id === currentThreadId) {
          return {
            ...t,
            messages: [...t.messages, { 
              id: `err-${Date.now()}`, 
              sender: 'ai', 
              text: `**System Error:** ${errMsg}` 
            }]
          };
        }
        return t;
      }));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(input);
    }
  };

  const handleDeleteThread = (threadId, e) => {
    e.stopPropagation();
    setThreads(prev => {
      const updated = prev.filter(t => t.id !== threadId);
      if (activeThreadId === threadId) {
        setActiveThreadId(updated.length > 0 ? updated[0].id : null);
      }
      return updated;
    });
  };

  const handleClearHistory = () => {
    setThreads([]);
    setActiveThreadId(null);
    localStorage.removeItem('football_copilot_threads');
    localStorage.removeItem('football_copilot_active_thread_id');
  };

  const handleResetThread = (threadId) => {
    setThreads(prev => prev.map(t => {
      if (t.id === threadId) {
        return { 
          ...t, 
          messages: [{ id: '1', sender: 'ai', text: `Conversation reset. Ready for new tactical directives.` }] 
        };
      }
      return t;
    }));
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full min-h-0 justify-between">
      <div className="space-y-4 flex-1 overflow-y-auto min-h-0">
        <div className="text-[10px] text-muted uppercase font-bold tracking-wider flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Cpu size={12} className="text-primary" /> Analytical Archives
          </div>
          {threads.length > 0 && (
            <span className="text-[9px] bg-border/40 px-1.5 py-0.5 rounded text-muted font-bold">
              {threads.length}
            </span>
          )}
        </div>

        {threads.length === 0 ? (
          <div className="text-center py-10 px-4 border border-dashed border-border/60 rounded-2xl bg-card/20">
            <MessageSquareCode size={24} className="mx-auto text-muted/50 mb-2.5" />
            <p className="text-[11px] font-semibold text-muted">No tactical archives.</p>
            <p className="text-[9px] text-muted/70 mt-1">Directives and profiles will persist here.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {threads.map(ch => {
              const isActive = ch.id === activeThreadId;
              return (
                <div
                  key={ch.id}
                  onClick={() => {
                    setActiveThreadId(ch.id);
                    setIsHistoryDrawerOpen(false);
                  }}
                  className={`group w-full flex items-center justify-between p-2.5 rounded-xl text-xs hover:bg-border/20 text-muted hover:text-text transition-all cursor-pointer truncate font-medium relative border ${
                    isActive ? 'bg-primary/5 border-primary/25 text-primary hover:text-primary' : 'border-transparent'
                  }`}
                >
                  <span className="truncate flex-1 pr-6"># {ch.title}</span>
                  <button
                    onClick={(e) => handleDeleteThread(ch.id, e)}
                    className="opacity-0 group-hover:opacity-100 md:opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded hover:bg-red-500/10 text-muted hover:text-red-500 cursor-pointer transition-all absolute right-2 bg-card/85 md:bg-transparent shadow-sm md:shadow-none"
                    title="Delete thread"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {threads.length > 0 && (
        <div className="pt-3 border-t border-border/40 shrink-0">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              handleClearHistory();
              setIsHistoryDrawerOpen(false);
            }}
            className="w-full text-[10px] py-1.5 font-bold text-red-500 hover:text-white hover:bg-red-600 hover:border-red-600 transition-all rounded-lg"
          >
            Clear local history
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-[calc(100vh-7rem)] md:h-[calc(100vh-8.5rem)] border border-border rounded-2xl overflow-hidden flex bg-card/45 shadow-sm">
      
      {/* Left panel (Chat History Desktop) */}
      <div className="w-64 border-r border-border bg-card/65 flex flex-col justify-between shrink-0 hidden md:flex p-4">
        {renderSidebarContent()}
      </div>

      {/* Mobile Drawer (Chat History Mobile) */}
      <Drawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        title="Analytical Archives"
        position="right"
        className="p-4"
      >
        {renderSidebarContent()}
      </Drawer>

      {/* Center panel (Active Chat Room) */}
      <div className="flex-1 flex flex-col justify-between bg-background/30 min-w-0">
        
        {/* Chat Area Header */}
        <div className="h-14 border-b border-border bg-card/65 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <button 
              onClick={() => setIsHistoryDrawerOpen(true)}
              className="md:hidden p-2 rounded-lg border border-border/60 text-muted hover:text-text cursor-pointer transition-colors bg-background/50"
              title="View Archives"
            >
              <History size={13} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
                <h2 className="text-xs font-bold text-text truncate">
                  {activeThread ? activeThread.title : "New Session"}
                </h2>
              </div>
              <p className="text-[9px] text-muted tracking-wider uppercase font-semibold">Football Copilot Intelligence Unit</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeThread && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleResetThread(activeThreadId)}
                className="text-[10px] py-1 px-2.5 h-8 font-semibold flex items-center gap-1"
                title="Reset current conversation"
              >
                <RotateCcw size={11} />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            )}
            <Button 
              variant={activeThreadId === null ? "outline" : "primary"} 
              size="sm" 
              onClick={() => {
                setActiveThreadId(null);
                setInput('');
              }}
              className="text-[10px] py-1 px-2.5 h-8 font-semibold flex items-center gap-1"
              title="Start a new chat session"
              disabled={isTyping}
            >
              <Plus size={11} className={activeThreadId === null ? "text-text" : "text-[#07120D]"} />
              <span>New Chat</span>
            </Button>
          </div>
        </div>

        {/* Scrollable messages box */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
          {messages.length === 0 ? (
            <EmptyChatState onSelectPrompt={handleSendMessage} loading={isTyping} />
          ) : (
            <div className="space-y-4">
              {messages.map((m) => {
                const isAI = m.sender === 'ai';
                return (
                  <div 
                    key={m.id}
                    className={`flex ${isAI ? 'justify-start' : 'justify-end'} w-full`}
                  >
                    {isAI ? (
                      <div className="w-full">
                        <AIResponseCard content={m.text} />
                      </div>
                    ) : (
                      <div className="flex gap-2.5 items-start max-w-[85%] md:max-w-[70%]">
                        <div className="bg-primary text-[#07120D] text-xs font-semibold px-3.5 py-2.5 rounded-2xl rounded-tr-none shadow-sm border border-primary/20 leading-relaxed whitespace-pre-wrap">
                          {m.text}
                        </div>
                        <div className="p-1 rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold text-[9px] w-7 h-7 flex items-center justify-center shrink-0 shadow-sm select-none">
                          {userLetter}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Typing dots loader */}
          {isTyping && (
            <div className="flex justify-start">
              <Card hover={false} className="border border-border/60 bg-border/10 p-3 flex gap-2 items-center rounded-xl shadow-sm">
                <Cpu size={14} className="text-primary animate-spin" />
                <span className="text-[10px] text-muted font-bold uppercase tracking-widest flex gap-1 select-none">
                  thinking
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce [animation-delay:0.2s]">.</span>
                  <span className="animate-bounce [animation-delay:0.4s]">.</span>
                </span>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Text Input area footer */}
        <div className="p-3 md:p-4 border-t border-border bg-card/60 backdrop-blur-sm space-y-2 shrink-0">
          <div className="relative flex flex-col gap-2 border border-border rounded-xl p-2 bg-background/50 focus-within:ring-2 focus-within:ring-primary/45 focus-within:border-primary/50 transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 1000))}
              onKeyDown={handleKeyDown}
              placeholder="Type tactical layout, scout profile, or prompt..."
              className="w-full py-1 px-2 bg-transparent text-xs text-text focus:outline-none placeholder-muted resize-none max-h-28 min-h-[24px] leading-relaxed font-medium"
              disabled={isTyping}
            />
            
            <div className="flex items-center justify-between px-2 pt-1 border-t border-border/20">
              <span className="text-[9px] text-muted font-mono select-none">
                {input.length} / 1000 characters
              </span>

              <div className="flex items-center gap-1.5">
                {isTyping ? (
                  <div className="flex items-center gap-1.5 text-[9px] text-primary uppercase font-bold tracking-widest px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-lg animate-pulse">
                    <Cpu size={10} className="animate-spin" />
                    <span>thinking</span>
                  </div>
                ) : (
                  <Button 
                    onClick={() => handleSendMessage(input)} 
                    size="sm" 
                    className="rounded-lg h-7 px-3 py-1 text-[10px] font-bold flex items-center gap-1.5 transition-all"
                    disabled={!input.trim() || isTyping}
                  >
                    <span>Execute</span>
                    <Send size={10} className="text-[#07120D]" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

// Sub-component for Empty Chat State
const EmptyChatState = ({ onSelectPrompt, loading }) => {
  const cards = [
    {
      title: "Tactical Layouts",
      description: "Analyze defensive shapes, counter-attacks, and pressing triggers.",
      prompt: "Analyze Arsenal vs Manchester City tactically.",
      icon: Cpu,
      color: "from-primary/10 to-primary/5 border-primary/20 hover:border-primary/45 text-primary"
    },
    {
      title: "Squad Scouting",
      description: "Generate potential recruitment profiles for specific positions.",
      prompt: "Provide scouting options for a deep-lying playmaker.",
      icon: Sparkles,
      color: "from-blue-500/10 to-blue-500/5 border-blue-500/20 hover:border-blue-500/45 text-blue-500"
    },
    {
      title: "Statistical Briefs",
      description: "Fetch and process leading goalscoring and performance metrics.",
      prompt: "Who is leading the golden boot metrics right now?",
      icon: Award,
      color: "from-amber-500/10 to-amber-500/5 border-amber-500/20 hover:border-amber-500/45 text-amber-500"
    }
  ];

  return (
    <div className="max-w-2xl mx-auto my-auto py-8 px-4 flex flex-col items-center justify-center text-center space-y-8 select-none">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 animate-pulse" />
        <div className="relative p-4 bg-card border border-border/80 rounded-2xl shadow-xl flex items-center justify-center">
          <Cpu size={36} className="text-primary animate-pulse" />
        </div>
      </div>

      <div className="space-y-2.5">
        <h1 className="font-display font-black text-xl md:text-2xl text-text tracking-tight">
          Football Copilot
        </h1>
        <p className="text-xs text-muted max-w-md leading-relaxed mx-auto">
          Synchronize squad files, scout targets, draft tactical breakdowns, and query live metrics using the terminal.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full mt-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <button
              key={i}
              onClick={() => !loading && onSelectPrompt(c.prompt)}
              disabled={loading}
              className={`p-4 rounded-xl border bg-gradient-to-br text-left space-y-3 cursor-pointer group transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${c.color} disabled:opacity-50 disabled:pointer-events-none`}
            >
              <div className="p-2 w-fit rounded-lg bg-card border border-border/50 shadow-sm group-hover:scale-105 transition-transform">
                <Icon size={16} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-text group-hover:text-primary transition-colors">{c.title}</h3>
                <p className="text-[10px] text-muted leading-relaxed leading-snug">{c.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
export default AIChat;
