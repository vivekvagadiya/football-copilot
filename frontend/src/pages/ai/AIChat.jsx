import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Cpu, Trash2, ShieldAlert, Sparkles, CornerDownLeft,
  RotateCcw, History, Plus, MessageSquareCode, BookOpen,
  Database, Award, ShieldCheck, Filter, ChevronRight
} from 'lucide-react';
import { 
  getAiConversationsApi, 
  getAiConversationByIdApi, 
  createAiConversationApi, 
  sendMessageToAiConversationApi, 
  deleteAiConversationApi, 
  clearAllAiConversationsApi,
  getKnowledgeDocumentsApi 
} from '../../api/ai.api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AIResponseCard } from '../../components/ai/AIResponseCard';
import { KnowledgeBaseDrawer } from '../../components/ai/KnowledgeBaseDrawer';
import { useApp } from '../../context/AppContext';
import { Drawer } from '../../components/ui/Drawer';
import { useLocation, useNavigate } from 'react-router-dom';

// Keep track of processed prompt keys to prevent double-execution in StrictMode
const processedPrompts = new Set();

const RAG_CATEGORIES = [
  { id: 'all', label: 'All Knowledge' },
  { id: 'tactics', label: 'Tactics' },
  { id: 'rules', label: 'Rules & IFAB' },
  { id: 'scouting', label: 'Scouting & xG' },
  { id: 'history', label: 'History' },
];

export const AIChat = () => {
  const { user } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const userLetter = user?.username ? user.username[0].toUpperCase() : 'U';

  // MongoDB-backed conversation threads
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [loadingThreads, setLoadingThreads] = useState(true);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // RAG Mode and Knowledge Base States
  const [isRagMode, setIsRagMode] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isKnowledgeDrawerOpen, setIsKnowledgeDrawerOpen] = useState(false);
  const [knowledgeDocCount, setKnowledgeDocCount] = useState(0);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const intervalRef = useRef(null);

  // Load conversations from MongoDB on mount
  useEffect(() => {
    const fetchConversations = async () => {
      setLoadingThreads(true);
      try {
        const res = await getAiConversationsApi();
        const convs = res?.data || [];
        setThreads(convs);

        if (convs.length > 0) {
          const firstId = convs[0]._id;
          setActiveThreadId(firstId);

          // Fetch full message details for the first conversation
          const detailRes = await getAiConversationByIdApi(firstId);
          if (detailRes?.data) {
            setThreads((prev) =>
              prev.map((t) => (t._id === firstId ? detailRes.data : t))
            );
          }
        }
      } catch (err) {
        console.error('Failed to fetch AI conversations from MongoDB:', err);
      } finally {
        setLoadingThreads(false);
      }
    };

    fetchConversations();
  }, []);

  // Fetch count of knowledge documents
  useEffect(() => {
    getKnowledgeDocumentsApi({ limit: 1 })
      .then((res) => {
        const total = res?.data?.pagination?.total || 0;
        setKnowledgeDocCount(total);
      })
      .catch(() => {});
  }, []);

  // Cleanup typewriter interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const activeThread = threads.find((t) => t._id === activeThreadId);
  const messages = activeThread?.messages || [];

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

  // Select a thread and load full message history from MongoDB if needed
  const handleSelectThread = async (threadId) => {
    setActiveThreadId(threadId);
    const existing = threads.find((t) => t._id === threadId);

    // If messages aren't populated yet, fetch them
    if (!existing || !Array.isArray(existing.messages) || existing.messages.length <= 1) {
      try {
        const detailRes = await getAiConversationByIdApi(threadId);
        if (detailRes?.data) {
          setThreads((prev) =>
            prev.map((t) => (t._id === threadId ? detailRes.data : t))
          );
        }
      } catch (err) {
        console.error('Error fetching thread messages:', err);
      }
    }
  };

  // Create a brand new session in MongoDB
  const handleNewChat = async () => {
    try {
      const res = await createAiConversationApi({
        title: 'New Session',
        category: selectedCategory,
      });

      const newConv = res?.data;
      if (newConv) {
        setThreads((prev) => [newConv, ...prev]);
        setActiveThreadId(newConv._id);
      }
      setInput('');
    } catch (err) {
      console.error('Failed to create new conversation in MongoDB:', err);
    }
  };

  // Streaming typewriter effect for AI response
  const streamAIResponse = (threadId, fullResponse, sources = [], chunks = [], isRag = false) => {
    let currentText = '';
    const words = fullResponse.split(' ');
    let wordIdx = 0;

    const tempId = `ai-${Date.now()}`;
    setThreads((prev) =>
      prev.map((t) => {
        if (t._id === threadId) {
          return {
            ...t,
            messages: [
              ...(t.messages || []),
              {
                _id: tempId,
                sender: 'ai',
                text: '',
                sources,
                chunks,
                isRag,
              },
            ],
          };
        }
        return t;
      })
    );

    const interval = setInterval(() => {
      if (wordIdx < words.length) {
        currentText += (wordIdx === 0 ? '' : ' ') + words[wordIdx];
        setThreads((prev) =>
          prev.map((t) => {
            if (t._id === threadId) {
              return {
                ...t,
                messages: (t.messages || []).map((msg) =>
                  msg._id === tempId
                    ? { ...msg, text: currentText, sources, chunks, isRag }
                    : msg
                ),
              };
            }
            return t;
          })
        );
        wordIdx++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 18);

    intervalRef.current = interval;
  };

  const handleSendMessage = async (textToSend) => {
    if (!textToSend.trim() || isTyping) return;

    const currentInput = textToSend;
    setInput('');
    setIsTyping(true);

    let currentThreadId = activeThreadId;

    // If no active thread, create one in MongoDB first
    if (!currentThreadId) {
      try {
        const createRes = await createAiConversationApi({
          title: currentInput.length > 28 ? currentInput.substring(0, 28) + '...' : currentInput,
          category: selectedCategory !== 'all' ? selectedCategory : 'all',
        });
        const createdConv = createRes?.data;
        if (createdConv) {
          currentThreadId = createdConv._id;
          setActiveThreadId(currentThreadId);
          setThreads((prev) => [createdConv, ...prev]);
        }
      } catch (err) {
        console.error('Error creating conversation:', err);
        setIsTyping(false);
        return;
      }
    }

    const optimisticUserMessage = {
      _id: `u-${Date.now()}`,
      sender: 'user',
      text: currentInput,
      createdAt: new Date().toISOString(),
    };

    // Optimistically show user message
    setThreads((prev) =>
      prev.map((t) => {
        if (t._id === currentThreadId) {
          return {
            ...t,
            messages: [...(t.messages || []), optimisticUserMessage],
          };
        }
        return t;
      })
    );

    try {
      // Send to MongoDB backed endpoint (executes RAG/AI and persists turns in DB)
      const res = await sendMessageToAiConversationApi(currentThreadId, {
        prompt: currentInput,
        isRag: isRagMode,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
      });

      const { aiMessage, title } = res?.data || {};

      // Update thread title in state if auto-generated on first turn
      if (title) {
        setThreads((prev) =>
          prev.map((t) => (t._id === currentThreadId ? { ...t, title } : t))
        );
      }

      if (aiMessage) {
        streamAIResponse(
          currentThreadId,
          aiMessage.text,
          aiMessage.sources || [],
          aiMessage.chunks || [],
          aiMessage.isRag || isRagMode
        );
      } else {
        setIsTyping(false);
      }
    } catch (err) {
      setIsTyping(false);
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Could not connect to AI service.';

      setThreads((prev) =>
        prev.map((t) => {
          if (t._id === currentThreadId) {
            return {
              ...t,
              messages: [
                ...(t.messages || []),
                {
                  _id: `err-${Date.now()}`,
                  sender: 'ai',
                  text: `**System Error:** ${errMsg}`,
                },
              ],
            };
          }
          return t;
        })
      );
    }
  };

  // Handle initialPrompt from navigation state (e.g. AI Recommendations)
  useEffect(() => {
    const promptText = location.state?.initialPrompt;
    const transitionKey = `${location.key || 'default'}-${promptText}`;

    if (promptText && !processedPrompts.has(transitionKey)) {
      processedPrompts.add(transitionKey);

      if (processedPrompts.size > 20) {
        const firstKey = processedPrompts.values().next().value;
        processedPrompts.delete(firstKey);
      }

      navigate(location.pathname, { replace: true, state: {} });
      handleSendMessage(promptText);
    }
  }, [location.state, location.key, navigate]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(input);
    }
  };

  const handleDeleteThread = async (threadId, e) => {
    e.stopPropagation();
    try {
      await deleteAiConversationApi(threadId);
      setThreads((prev) => {
        const updated = prev.filter((t) => t._id !== threadId);
        if (activeThreadId === threadId) {
          const nextId = updated.length > 0 ? updated[0]._id : null;
          setActiveThreadId(nextId);
          if (nextId) handleSelectThread(nextId);
        }
        return updated;
      });
    } catch (err) {
      console.error('Failed to delete conversation from MongoDB:', err);
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearAllAiConversationsApi();
      setThreads([]);
      setActiveThreadId(null);
    } catch (err) {
      console.error('Failed to clear conversations from MongoDB:', err);
    }
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

        {loadingThreads ? (
          <div className="text-center py-8 text-muted space-y-2">
            <Cpu size={18} className="mx-auto text-primary animate-spin" />
            <p className="text-[10px]">Loading MongoDB archives...</p>
          </div>
        ) : threads.length === 0 ? (
          <div className="text-center py-10 px-4 border border-dashed border-border/60 rounded-2xl bg-card/20">
            <MessageSquareCode size={24} className="mx-auto text-muted/50 mb-2.5" />
            <p className="text-[11px] font-semibold text-muted">No tactical archives.</p>
            <p className="text-[9px] text-muted/70 mt-1">
              Conversations will persist in your cloud database.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {threads.map((ch) => {
              const isActive = ch._id === activeThreadId;
              return (
                <div
                  key={ch._id}
                  onClick={() => handleSelectThread(ch._id)}
                  className={`group w-full p-2.5 rounded-xl border flex items-center justify-between transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-primary/10 border-primary/40 text-text shadow-sm'
                      : 'border-transparent hover:border-border hover:bg-card/40 text-muted hover:text-text'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isActive ? 'bg-primary animate-pulse' : 'bg-muted/40'
                      }`}
                    />
                    <span className="text-xs font-semibold truncate leading-none">
                      {ch.title || 'Untitled Session'}
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteThread(ch._id, e)}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 text-muted transition-all cursor-pointer shrink-0"
                    title="Delete session from MongoDB"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Knowledge Base Explorer Button in Sidebar */}
        <div className="pt-2 border-t border-border/40">
          <button
            onClick={() => setIsKnowledgeDrawerOpen(true)}
            className="w-full p-2.5 rounded-xl border border-primary/20 bg-primary/[0.04] hover:bg-primary/[0.08] hover:border-primary/40 transition-all text-left flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-primary/10 text-primary">
                <Database size={13} />
              </span>
              <div>
                <div className="text-xs font-bold text-text group-hover:text-primary transition-colors">
                  Knowledge Hub
                </div>
                <div className="text-[9px] text-muted">
                  {knowledgeDocCount} indexed football dossiers
                </div>
              </div>
            </div>
            <ChevronRight
              size={14}
              className="text-muted group-hover:text-primary transition-colors"
            />
          </button>
        </div>
      </div>

      {threads.length > 0 && (
        <div className="pt-3 border-t border-border mt-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearHistory}
            className="w-full text-[10px] h-7 font-bold py-0 flex items-center justify-center gap-1.5 text-muted hover:text-red-400 hover:border-red-500/30"
          >
            <Trash2 size={10} />
            Clear cloud history
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

      {/* Knowledge Base Drawer */}
      <KnowledgeBaseDrawer
        isOpen={isKnowledgeDrawerOpen}
        onClose={() => setIsKnowledgeDrawerOpen(false)}
        onSelectDocumentPrompt={(prompt) => handleSendMessage(prompt)}
      />

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
                  {activeThread ? activeThread.title : 'New Session'}
                </h2>
              </div>
              <p className="text-[9px] text-muted tracking-wider uppercase font-semibold">
                Football Copilot Intelligence Unit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Knowledge Base button in header for desktop */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsKnowledgeDrawerOpen(true)}
              className="hidden sm:flex text-[10px] py-1 px-2.5 h-8 font-semibold items-center gap-1.5 text-text hover:text-primary hover:border-primary/40"
              title="Inspect Knowledge Documents"
            >
              <Database size={11} className="text-primary" />
              <span>Dossiers</span>
              {knowledgeDocCount > 0 && (
                <span className="bg-primary/20 text-primary text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                  {knowledgeDocCount}
                </span>
              )}
            </Button>

            <Button
              variant={activeThreadId === null ? 'outline' : 'primary'}
              size="sm"
              onClick={handleNewChat}
              className="text-[10px] py-1 px-2.5 h-8 font-semibold flex items-center gap-1"
              title="Start a new cloud chat session"
              disabled={isTyping}
            >
              <Plus
                size={11}
                className={activeThreadId === null ? 'text-text' : 'text-[#07120D]'}
              />
              <span>New Chat</span>
            </Button>
          </div>
        </div>

        {/* Sub-header: RAG Mode Switcher & Category Filter Pills */}
        <div className="px-4 py-2 border-b border-border/50 bg-card/40 flex items-center justify-between gap-3 overflow-x-auto shrink-0 no-scrollbar">
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsRagMode(!isRagMode)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                isRagMode
                  ? 'bg-primary/15 border-primary/40 text-primary shadow-sm'
                  : 'bg-card border-border/70 text-muted hover:text-text'
              }`}
              title={isRagMode ? 'RAG Grounding is Active' : 'Click to activate Grounded RAG'}
            >
              <ShieldCheck
                size={12}
                className={isRagMode ? 'text-primary animate-pulse' : 'text-muted'}
              />
              <span>{isRagMode ? 'Grounded RAG Mode' : 'Standard AI Mode'}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${isRagMode ? 'bg-primary' : 'bg-muted'}`} />
            </button>
          </div>

          {/* Category Filter Pills (Active when in RAG Mode) */}
          {isRagMode && (
            <div className="flex items-center gap-1.5 overflow-x-auto shrink-0">
              <span className="text-[9px] uppercase font-bold text-muted tracking-wider hidden md:inline">
                Focus:
              </span>
              {RAG_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2 py-0.5 rounded-md text-[9.5px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-primary text-[#07120D] font-bold shadow-sm'
                      : 'bg-card/60 text-muted hover:text-text border border-border/40'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Scrollable messages box */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
          {messages.length === 0 ? (
            <EmptyChatState
              onSelectPrompt={handleSendMessage}
              loading={isTyping}
              isRagMode={isRagMode}
            />
          ) : (
            <div className="space-y-4">
              {messages.map((m) => {
                const isAI = m.sender === 'ai';
                return (
                  <div
                    key={m._id || m.id || Math.random()}
                    className={`flex ${isAI ? 'justify-start' : 'justify-end'} w-full`}
                  >
                    {isAI ? (
                      <div className="w-full">
                        <AIResponseCard
                          content={m.text}
                          sources={m.sources || []}
                          chunks={m.chunks || []}
                          isRag={m.isRag || false}
                        />
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

          {/* Typing loader */}
          {isTyping && (
            <div className="flex justify-start">
              <Card
                hover={false}
                className="border border-border/60 bg-border/10 p-3 flex gap-2 items-center rounded-xl shadow-sm"
              >
                <Cpu size={14} className="text-primary animate-spin" />
                <span className="text-[10px] text-muted font-bold uppercase tracking-widest flex gap-1 select-none">
                  {isRagMode ? 'retrieving & synthesizing knowledge' : 'thinking'}
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce delay-100">.</span>
                  <span className="animate-bounce delay-200">.</span>
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
              placeholder={
                isRagMode
                  ? 'Ask about 3-2-4-1 tactics, Gegenpressing, VAR protocols, or PSR financial rules...'
                  : 'Type tactical layout, scout profile, or prompt...'
              }
              className="w-full py-1 px-2 bg-transparent text-xs text-text focus:outline-none placeholder-muted resize-none max-h-28 min-h-[24px] leading-relaxed font-medium"
              disabled={isTyping}
            />

            <div className="flex items-center justify-between px-2 pt-1 border-t border-border/20">
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-muted font-mono select-none">
                  {input.length} / 1000
                </span>
                {isRagMode && (
                  <span className="text-[9px] text-primary/80 font-semibold hidden sm:inline flex items-center gap-1">
                    • Knowledge Grounded ({selectedCategory.toUpperCase()})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {isTyping ? (
                  <div className="flex items-center gap-1.5 text-[9px] text-primary uppercase font-bold tracking-widest px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-lg animate-pulse">
                    <Cpu size={10} className="animate-spin" />
                    <span>analyzing</span>
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

// Sub-component for Empty Chat State showcasing Knowledge Base Dossiers
const EmptyChatState = ({ onSelectPrompt, loading, isRagMode }) => {
  const cards = [
    {
      title: '3-2-4-1 Box Midfield',
      category: 'Tactics',
      description: 'How inverted fullbacks overload half-spaces and establish rest defense.',
      prompt: 'How does the 3-2-4-1 box midfield overload half-spaces and maintain rest defense?',
      icon: Cpu,
      color: 'from-primary/10 to-primary/5 border-primary/20 hover:border-primary/45 text-primary',
    },
    {
      title: 'Gegenpressing Mechanics',
      category: 'Tactics',
      description: 'Space compression, 5-8 second recovery window, and PPDA analysis.',
      prompt: 'Explain Gegenpressing triggers, the 5-8 second rule, and PPDA measurement.',
      icon: Sparkles,
      color: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/45 text-emerald-400',
    },
    {
      title: 'VAR Red Card Protocols',
      category: 'Rules',
      description: 'IFAB Clear and obvious error thresholds and Attacking Possession Phase.',
      prompt: 'What are the IFAB Laws and VAR protocols for direct red cards and penalty checks?',
      icon: ShieldCheck,
      color: 'from-amber-500/10 to-amber-500/5 border-amber-500/20 hover:border-amber-500/45 text-amber-400',
    },
    {
      title: 'Premier League PSR Rules',
      category: 'Finance & Rules',
      description: '£105m allowable losses, allowable deductions, and 5-year amortization caps.',
      prompt: 'Explain Premier League PSR £105m loss limits and transfer fee amortization rules.',
      icon: Award,
      color: 'from-blue-500/10 to-blue-500/5 border-blue-500/20 hover:border-blue-500/45 text-blue-400',
    },
    {
      title: '2005 Istanbul Comeback',
      category: 'History',
      description: 'Benítez tactical shift neutralizing Kaká and Liverpool\'s 6-minute blitz.',
      prompt: 'Break down the tactical adjustments in the 2005 Istanbul Champions League final.',
      icon: BookOpen,
      color: 'from-purple-500/10 to-purple-500/5 border-purple-500/20 hover:border-purple-500/45 text-purple-400',
    },
    {
      title: 'xG, xA & Field Tilt',
      category: 'Scouting',
      description: 'Evaluating territory and chance quality beyond raw possession numbers.',
      prompt: 'What is Field Tilt and how does it differentiate from total possession in scouting?',
      icon: Database,
      color: 'from-cyan-500/10 to-cyan-500/5 border-cyan-500/20 hover:border-cyan-500/45 text-cyan-400',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto my-auto py-6 px-4 flex flex-col items-center justify-center text-center space-y-6 select-none">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 animate-pulse" />
        <div className="relative p-3.5 bg-card border border-border/80 rounded-2xl shadow-xl flex items-center justify-center">
          <Database size={32} className="text-primary animate-pulse" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2">
          <h1 className="font-display font-black text-xl md:text-2xl text-text tracking-tight">
            Football Copilot Intelligence
          </h1>
          {isRagMode && (
            <Badge
              variant="default"
              className="text-[10px] py-0.5 px-2 bg-primary/15 border-primary/30 text-primary font-bold"
            >
              RAG Engine
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted max-w-lg leading-relaxed mx-auto">
          Query indexed tactical treatises, IFAB rulebooks, historical dossiers, and recruitment metrics with cloud-synced MongoDB archives.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full mt-2">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <button
              key={i}
              onClick={() => !loading && onSelectPrompt(c.prompt)}
              disabled={loading}
              className={`p-3.5 rounded-xl border bg-gradient-to-br text-left space-y-2.5 cursor-pointer group transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${c.color} disabled:opacity-50 disabled:pointer-events-none`}
            >
              <div className="flex items-center justify-between">
                <div className="p-1.5 w-fit rounded-lg bg-card border border-border/50 shadow-sm group-hover:scale-105 transition-transform">
                  <Icon size={14} />
                </div>
                <span className="text-[8.5px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-border/40 text-muted">
                  {c.category}
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-text group-hover:text-primary transition-colors leading-snug">
                  {c.title}
                </h3>
                <p className="text-[10px] text-muted leading-relaxed line-clamp-2">
                  {c.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AIChat;
