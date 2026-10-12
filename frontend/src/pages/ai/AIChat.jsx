import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Cpu,
  Trash2,
  ShieldAlert,
  Sparkles,
  CornerDownLeft,
  RotateCcw,
  RotateCw,
  History,
  Plus,
  MessageSquareCode,
  BookOpen,
  Database,
  Award,
  ShieldCheck,
  Filter,
  ChevronRight,
  Brain,
  Compass,
  Users2,
} from "lucide-react";
import {
  getAiConversationsApi,
  getAiConversationByIdApi,
  createAiConversationApi,
  sendMessageToAiConversationApi,
  deleteAiConversationApi,
  clearAllAiConversationsApi,
  getKnowledgeDocumentsApi,
  getUserMemoriesApi,
  getAiSuggestionsApi,
} from "../../api/ai.api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { AIResponseCard } from "../../components/ai/AIResponseCard";
import { KnowledgeBaseDrawer } from "../../components/ai/KnowledgeBaseDrawer";
import { MemoryManagerDrawer } from "../../components/ai/MemoryManagerDrawer";
import { useApp } from "../../context/AppContext";
import { Drawer } from "../../components/ui/Drawer";
import { useLocation, useNavigate } from "react-router-dom";
import { getCleanErrorMessage } from "../../api/axios";

// Keep track of processed prompt keys to prevent double-execution in StrictMode
const processedPrompts = new Set();

const RAG_CATEGORIES = [
  { id: "all", label: "All Knowledge" },
  { id: "tactics", label: "Tactics" },
  { id: "rules", label: "Rules & IFAB" },
  { id: "scouting", label: "Scouting & xG" },
  { id: "history", label: "History" },
];

export const AIChat = () => {
  const { user } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const userLetter = user?.username ? user.username[0].toUpperCase() : "U";

  // MongoDB-backed conversation threads
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [loadingThreads, setLoadingThreads] = useState(true);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // RAG Mode and Knowledge Base States (Default: OFF)
  const [isRagMode, setIsRagMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isKnowledgeDrawerOpen, setIsKnowledgeDrawerOpen] = useState(false);
  const [knowledgeDocCount, setKnowledgeDocCount] = useState(0);

  // Sprint 19: Continuous AI Memory States
  const [useMemory, setUseMemory] = useState(true);
  const [isMemoryDrawerOpen, setIsMemoryDrawerOpen] = useState(false);
  const [userMemoriesCount, setUserMemoriesCount] = useState(0);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const intervalRef = useRef(null);

  const fetchMemoriesCount = () => {
    getUserMemoriesApi()
      .then((res) => {
        const count = Array.isArray(res?.data) ? res.data.length : 0;
        setUserMemoriesCount(count);
      })
      .catch(() => {});
  };

  // Load conversations from MongoDB on mount
  useEffect(() => {
    fetchMemoriesCount();
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
              prev.map((t) => (t._id === firstId ? detailRes.data : t)),
            );
          }
        }
      } catch (err) {
        console.error("Failed to fetch AI conversations from MongoDB:", err);
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Select a thread and load full message history from MongoDB if needed
  const handleSelectThread = async (threadId) => {
    setActiveThreadId(threadId);
    const existing = threads.find((t) => t._id === threadId);

    // If messages aren't populated yet, fetch them
    if (
      !existing ||
      !Array.isArray(existing.messages) ||
      existing.messages.length <= 1
    ) {
      try {
        const detailRes = await getAiConversationByIdApi(threadId);
        if (detailRes?.data) {
          setThreads((prev) =>
            prev.map((t) => (t._id === threadId ? detailRes.data : t)),
          );
        }
      } catch (err) {
        console.error("Error fetching thread messages:", err);
      }
    }
  };

  // Create a brand new session in MongoDB
  const handleNewChat = async () => {
    try {
      const res = await createAiConversationApi({
        title: "New Session",
        category: selectedCategory,
      });

      const newConv = res?.data;
      if (newConv) {
        setThreads((prev) => [newConv, ...prev]);
        setActiveThreadId(newConv._id);
      }
      setInput("");
    } catch (err) {
      console.error("Failed to create new conversation in MongoDB:", err);
    }
  };

  // Streaming typewriter effect for AI response
  const streamAIResponse = (
    threadId,
    fullResponse,
    sources = [],
    chunks = [],
    isRag = false,
    recalledMemories = [],
  ) => {
    let currentText = "";
    const words = fullResponse.split(" ");
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
                sender: "ai",
                text: "",
                sources,
                chunks,
                isRag,
                recalledMemories,
              },
            ],
          };
        }
        return t;
      }),
    );

    const interval = setInterval(() => {
      if (wordIdx < words.length) {
        currentText += (wordIdx === 0 ? "" : " ") + words[wordIdx];
        setThreads((prev) =>
          prev.map((t) => {
            if (t._id === threadId) {
              return {
                ...t,
                messages: (t.messages || []).map((msg) =>
                  msg._id === tempId
                    ? {
                        ...msg,
                        text: currentText,
                        sources,
                        chunks,
                        isRag,
                        recalledMemories,
                      }
                    : msg,
                ),
              };
            }
            return t;
          }),
        );
        wordIdx++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
        fetchMemoriesCount(); // background extraction may have learned a new fact
      }
    }, 18);

    intervalRef.current = interval;
  };

  const handleSendMessage = async (textToSend, options = {}) => {
    if (!textToSend.trim() || isTyping) return;

    const currentInput = textToSend;
    setInput("");
    setIsTyping(true);

    const targetIsRag = options.isRag !== undefined ? options.isRag : isRagMode;
    const targetCategory =
      options.category !== undefined
        ? options.category
        : selectedCategory !== "all"
          ? selectedCategory
          : undefined;

    // If card or action explicitly requested RAG mode, sync UI toggles
    if (options.isRag && !isRagMode) {
      setIsRagMode(true);
    }
    if (options.category && options.category !== selectedCategory) {
      setSelectedCategory(options.category);
    }

    let currentThreadId = activeThreadId;

    // If no active thread, create one in MongoDB first
    if (!currentThreadId) {
      try {
        const createRes = await createAiConversationApi({
          title:
            currentInput.length > 28
              ? currentInput.substring(0, 28) + "..."
              : currentInput,
          category:
            targetCategory && targetCategory !== "all" ? targetCategory : "all",
        });
        const createdConv = createRes?.data;
        if (createdConv) {
          currentThreadId = createdConv._id;
          setActiveThreadId(currentThreadId);
          setThreads((prev) => [createdConv, ...prev]);
        }
      } catch (err) {
        console.error("Error creating conversation:", err);
        setIsTyping(false);
        return;
      }
    }

    const optimisticUserMessage = {
      _id: `u-${Date.now()}`,
      sender: "user",
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
      }),
    );

    try {
      // Send to MongoDB backed endpoint (executes RAG/AI, recalls memory, and persists turns in DB)
      const res = await sendMessageToAiConversationApi(currentThreadId, {
        prompt: currentInput,
        isRag: targetIsRag,
        category:
          targetCategory && targetCategory !== "all"
            ? targetCategory
            : undefined,
        useMemory,
      });

      const { aiMessage, title } = res?.data || {};

      // Update thread title in state if auto-generated on first turn
      if (title) {
        setThreads((prev) =>
          prev.map((t) => (t._id === currentThreadId ? { ...t, title } : t)),
        );
      }

      if (aiMessage) {
        streamAIResponse(
          currentThreadId,
          aiMessage.text,
          aiMessage.sources || [],
          aiMessage.chunks || [],
          aiMessage.isRag || targetIsRag,
          aiMessage.recalledMemories || [],
        );
      } else {
        setIsTyping(false);
      }
    } catch (err) {
      setIsTyping(false);
      const rawErrMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Could not connect to AI service.";
      const cleanErrMsg = getCleanErrorMessage(rawErrMsg);

      setThreads((prev) =>
        prev.map((t) => {
          if (t._id === currentThreadId) {
            return {
              ...t,
              messages: [
                ...(t.messages || []),
                {
                  _id: `err-${Date.now()}`,
                  sender: "ai",
                  text: `**Service Notice:** ${cleanErrMsg}`,
                },
              ],
            };
          }
          return t;
        }),
      );
    }
  };

  // Handle initialPrompt from navigation state (e.g. AI Recommendations)
  useEffect(() => {
    const promptText = location.state?.initialPrompt;
    const transitionKey = `${location.key || "default"}-${promptText}`;

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
    if (e.key === "Enter" && !e.shiftKey) {
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
      console.error("Failed to delete conversation from MongoDB:", err);
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearAllAiConversationsApi();
      setThreads([]);
      setActiveThreadId(null);
    } catch (err) {
      console.error("Failed to clear conversations from MongoDB:", err);
    }
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full min-h-0">
      {/* Fixed Header */}
      <div className="text-[10px] text-muted uppercase font-bold tracking-wider flex items-center justify-between shrink-0 pb-3">
        <div className="flex items-center gap-1.5">
          <Cpu size={12} className="text-primary" /> Analytical Archives
        </div>
        {threads.length > 0 && (
          <span className="text-[9px] bg-border/40 px-1.5 py-0.5 rounded text-muted font-bold">
            {threads.length}
          </span>
        )}
      </div>

      {/* ONLY Scrollable Conversation List */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-1.5">
        {loadingThreads ? (
          <div className="text-center py-8 text-muted space-y-2">
            <Cpu size={18} className="mx-auto text-primary animate-spin" />
            <p className="text-[10px]">Loading MongoDB archives...</p>
          </div>
        ) : threads.length === 0 ? (
          <div className="text-center py-10 px-4 border border-dashed border-border/60 rounded-2xl bg-card/20">
            <MessageSquareCode
              size={24}
              className="mx-auto text-muted/50 mb-2.5"
            />
            <p className="text-[11px] font-semibold text-muted">
              No tactical archives.
            </p>
            <p className="text-[9px] text-muted/70 mt-1">
              Conversations will persist in your cloud database.
            </p>
          </div>
        ) : (
          threads.map((ch) => {
            const isActive = ch._id === activeThreadId;
            return (
              <div
                key={ch._id}
                onClick={() => handleSelectThread(ch._id)}
                className={`group w-full p-2.5 rounded-xl border flex items-center justify-between transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-primary/10 border-primary/40 text-text shadow-sm"
                    : "border-transparent hover:border-border hover:bg-card/40 text-muted hover:text-text"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isActive ? "bg-primary animate-pulse" : "bg-muted/40"
                    }`}
                  />
                  <span className="text-xs font-semibold truncate leading-none">
                    {ch.title || "Untitled Session"}
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
          })
        )}
      </div>

      {/* Fixed Bottom Hub & Actions */}
      <div className="shrink-0 pt-3 space-y-3">
        {/* Knowledge Base & Tactical Memory Hub in Sidebar */}
        <div className="border-t border-border/40 pt-3 space-y-1.5">
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

          <button
            onClick={() => setIsMemoryDrawerOpen(true)}
            className="w-full p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08] hover:border-emerald-500/40 transition-all text-left flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
                <Brain size={13} />
              </span>
              <div>
                <div className="text-xs font-bold text-text group-hover:text-emerald-400 transition-colors">
                  Tactical Memory
                </div>
                <div className="text-[9px] text-muted">
                  {userMemoriesCount} learned preferences
                </div>
              </div>
            </div>
            <ChevronRight
              size={14}
              className="text-muted group-hover:text-emerald-400 transition-colors"
            />
          </button>
        </div>

        {threads.length > 0 && (
          <div className="border-t border-border pt-3">
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
        onSelectDocumentPrompt={(prompt) =>
          handleSendMessage(prompt, { isRag: true })
        }
      />

      {/* Tactical Memory Drawer */}
      <MemoryManagerDrawer
        isOpen={isMemoryDrawerOpen}
        onClose={() => setIsMemoryDrawerOpen(false)}
        onMemoryUpdated={fetchMemoriesCount}
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
                  {activeThread ? activeThread.title : "New Session"}
                </h2>
              </div>
              <p className="text-[9px] text-muted tracking-wider uppercase font-semibold">
                Football Copilot Intelligence Unit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Memory button in header */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMemoryDrawerOpen(true)}
              className="hidden sm:flex text-[10px] py-1 px-2.5 h-8 font-semibold items-center gap-1.5 text-text hover:text-emerald-400 hover:border-emerald-500/40"
              title="Inspect & Manage Learned Memory"
            >
              <Brain size={11} className="text-emerald-400" />
              <span>Memory</span>
              {userMemoriesCount > 0 && (
                <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                  {userMemoriesCount}
                </span>
              )}
            </Button>

            {/* Tactical Planner Agent link */}
            {/* <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/planner')}
              className="hidden lg:flex text-[10px] py-1 px-2.5 h-8 font-semibold items-center gap-1.5 text-text hover:text-primary hover:border-primary/40"
              title="Launch Tactical Planner Studio"
            >
              <Compass size={11} className="text-primary animate-spin-slow" />
              <span>Planner</span>
            </Button> */}

            {/* Backroom Staff Multi-Agent Studio link */}
            {/* <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/agents')}
              className="hidden xl:flex text-[10px] py-1 px-2.5 h-8 font-semibold items-center gap-1.5 text-text hover:text-primary hover:border-primary/40"
              title="Open Backroom Staff Multi-Agent Studio"
            >
              <Users2 size={11} className="text-primary" />
              <span>Staff</span>
            </Button> */}

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
              variant={activeThreadId === null ? "outline" : "primary"}
              size="sm"
              onClick={handleNewChat}
              className="text-[10px] py-1 px-2.5 h-8 font-semibold flex items-center gap-1"
              title="Start a new cloud chat session"
              disabled={isTyping}
            >
              <Plus
                size={11}
                className={
                  activeThreadId === null ? "text-text" : "text-[#07120D]"
                }
              />
              <span>New Chat</span>
            </Button>
          </div>
        </div>

        {/* Sub-header: RAG Mode & Memory Personalization Switchers */}
        <div className="px-4 py-2 border-b border-border/50 bg-card/40 flex items-center justify-between gap-3 overflow-x-auto shrink-0 no-scrollbar">
          <div className="flex items-center gap-2 shrink-0">
            {/* RAG Mode Switch */}
            <button
              onClick={() => setIsRagMode(!isRagMode)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                isRagMode
                  ? "bg-primary/15 border-primary/40 text-primary shadow-sm"
                  : "bg-card border-border/70 text-muted hover:text-text"
              }`}
              title={
                isRagMode
                  ? "RAG Grounding is Active"
                  : "Click to activate Grounded RAG"
              }
            >
              <ShieldCheck
                size={12}
                className={
                  isRagMode ? "text-primary animate-pulse" : "text-muted"
                }
              />
              <span>
                {isRagMode ? "Grounded RAG Mode" : "Standard AI Mode"}
              </span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${isRagMode ? "bg-primary" : "bg-muted"}`}
              />
            </button>

            {/* Continuous Memory Switch */}
            <button
              onClick={() => setUseMemory(!useMemory)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                useMemory
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-sm"
                  : "bg-card border-border/70 text-muted hover:text-text"
              }`}
              title={
                useMemory
                  ? "Personalized Memory is Active"
                  : "Click to enable Memory Personalization"
              }
            >
              <Brain
                size={12}
                className={
                  useMemory ? "text-emerald-400 animate-pulse" : "text-muted"
                }
              />
              <span>{useMemory ? "Personalized Memory" : "Memory Off"}</span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${useMemory ? "bg-emerald-400" : "bg-muted"}`}
              />
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
                      ? "bg-primary text-[#07120D] font-bold shadow-sm"
                      : "bg-card/60 text-muted hover:text-text border border-border/40"
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
              onSelectPrompt={(prompt, opts) => handleSendMessage(prompt, opts)}
              loading={isTyping}
              isRagMode={isRagMode}
              activeCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          ) : (
            <div className="space-y-4">
              {messages.map((m) => {
                const isAI = m.sender === "ai";
                return (
                  <div
                    key={m._id || m.id || Math.random()}
                    className={`flex ${isAI ? "justify-start" : "justify-end"} w-full`}
                  >
                    {isAI ? (
                      <div className="w-full">
                        <AIResponseCard
                          content={m.text}
                          sources={m.sources || []}
                          chunks={m.chunks || []}
                          recalledMemories={m.recalledMemories || []}
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
                  {isRagMode
                    ? "retrieving & synthesizing knowledge"
                    : "thinking"}
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
                  ? "Ask about 3-2-4-1 tactics, Gegenpressing, VAR protocols, or PSR financial rules..."
                  : "Type tactical layout, scout profile, or prompt..."
              }
              className="w-full py-1 px-2 bg-transparent text-xs text-text focus:outline-none placeholder-muted resize-none max-h-28 min-h-[24px] leading-relaxed font-medium"
              disabled={isTyping}
            />

            <div className="flex items-center justify-between px-2 pt-1 border-t border-border/20">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRagMode(!isRagMode)}
                  className={`text-[9px] px-2 py-0.5 rounded-full font-bold transition-all border flex items-center gap-1 cursor-pointer ${
                    isRagMode
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "bg-card border-border/60 text-muted hover:text-text"
                  }`}
                  title="Toggle Knowledge Base RAG Grounding"
                >
                  <Database size={9} />
                  <span>RAG: {isRagMode ? "ON" : "OFF"}</span>
                </button>

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

// Sub-component for Empty Chat State with Dynamic & Shuffleable Suggestions
const EmptyChatState = ({
  onSelectPrompt,
  loading,
  isRagMode,
  activeCategory = "all",
  onCategoryChange,
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getCategoryTheme = (cat) => {
    switch (cat) {
      case "tactics":
        return {
          icon: Cpu,
          color:
            "from-primary/10 to-primary/5 border-primary/20 hover:border-primary/45 text-primary",
          badgeClass: "bg-primary/15 text-primary border-primary/25",
        };
      case "rules":
        return {
          icon: ShieldCheck,
          color:
            "from-amber-500/10 to-amber-500/5 border-amber-500/20 hover:border-amber-500/45 text-amber-400",
          badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/25",
        };
      case "history":
        return {
          icon: BookOpen,
          color:
            "from-purple-500/10 to-purple-500/5 border-purple-500/20 hover:border-purple-500/45 text-purple-400",
          badgeClass: "bg-purple-500/15 text-purple-400 border-purple-500/25",
        };
      case "scouting":
        return {
          icon: Compass,
          color:
            "from-cyan-500/10 to-cyan-500/5 border-cyan-500/20 hover:border-cyan-500/45 text-cyan-400",
          badgeClass: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
        };
      case "analytics":
        return {
          icon: Database,
          color:
            "from-blue-500/10 to-blue-500/5 border-blue-500/20 hover:border-blue-500/45 text-blue-400",
          badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/25",
        };
      default:
        return {
          icon: Sparkles,
          color:
            "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/45 text-emerald-400",
          badgeClass:
            "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
        };
    }
  };

  const fetchSuggestions = async (isManualShuffle = false) => {
    if (isManualShuffle) {
      setIsRefreshing(true);
    } else {
      setLoadingSuggestions(true);
    }

    try {
      const data = await getAiSuggestionsApi({
        category: activeCategory !== "all" ? activeCategory : undefined,
        limit: 6,
      });

      if (Array.isArray(data) && data.length > 0) {
        setSuggestions(data);
      }
    } catch (err) {
      console.warn("Error loading dynamic AI suggestions:", err);
    } finally {
      setLoadingSuggestions(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSuggestions(false);
  }, [activeCategory]);

  return (
    <div className="max-w-3xl mx-auto my-auto py-5 px-3 flex flex-col items-center justify-center text-center space-y-5 select-none w-full">
      {/* Visual Header Icon */}
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 animate-pulse" />
        <div className="relative p-3 bg-card border border-border/80 rounded-2xl shadow-xl flex items-center justify-center">
          <Database size={28} className="text-primary animate-pulse" />
        </div>
      </div>

      {/* Title & Description */}
      <div className="space-y-1.5 max-w-xl">
        <div className="flex items-center justify-center gap-2">
          <h1 className="font-display font-black text-xl md:text-2xl text-text tracking-tight">
            Football Copilot Intelligence
          </h1>
          {isRagMode && (
            <Badge
              variant="default"
              className="text-[9.5px] py-0.5 px-2 bg-primary/15 border-primary/30 text-primary font-bold shadow-sm"
            >
              RAG Engine
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted leading-relaxed mx-auto">
          Query tactical treatises, IFAB rulebooks, historical dossiers, and
          recruitment metrics dynamically synced with our live MongoDB archives.
        </p>
      </div>

      {/* Control bar: Category Filter Pills + Dynamic Shuffle Button */}
      <div className="flex flex-wrap items-center justify-between gap-2 w-full max-w-2xl px-1 pt-2 border-t border-border/30">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-[80%] no-scrollbar">
          {RAG_CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryChange && onCategoryChange(cat.id)}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-primary text-[#07120D] font-bold border-primary shadow-sm"
                    : "bg-card/70 text-muted hover:text-text border-border/60 hover:border-border"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => fetchSuggestions(true)}
          disabled={loadingSuggestions || isRefreshing}
          className="flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-1 rounded-lg bg-card/80 border border-border/70 hover:border-primary/50 text-text hover:text-primary transition-all shadow-sm cursor-pointer disabled:opacity-50"
          title="Shuffle suggestions from knowledge base"
        >
          <RotateCw
            size={11}
            className={isRefreshing ? "animate-spin text-primary" : ""}
          />
          <span>{isRefreshing ? "Refreshing..." : "Shuffle"}</span>
        </button>
      </div>

      {/* Dynamic Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
        {loadingSuggestions
          ? // Skeleton Loaders
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl border border-border/40 bg-card/40 text-left space-y-2.5 animate-pulse min-h-[105px]"
              >
                <div className="flex items-center justify-between">
                  <div className="w-6 h-6 rounded-lg bg-border/40" />
                  <div className="w-12 h-3.5 rounded bg-border/30" />
                </div>
                <div className="space-y-1.5">
                  <div className="w-3/4 h-3.5 rounded bg-border/40" />
                  <div className="w-full h-2.5 rounded bg-border/20" />
                  <div className="w-2/3 h-2.5 rounded bg-border/20" />
                </div>
              </div>
            ))
          : suggestions.map((c, i) => {
              const theme = getCategoryTheme(c.category);
              const Icon = theme.icon;
              return (
                <motion.button
                  key={c.id || i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: i * 0.03 }}
                  onClick={() =>
                    !loading &&
                    onSelectPrompt(c.prompt, {
                      isRag: true,
                      category: c.category,
                    })
                  }
                  disabled={loading}
                  className={`p-3.5 rounded-xl border bg-gradient-to-br text-left space-y-2 cursor-pointer group transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${theme.color} disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-1.5 w-fit rounded-lg bg-card border border-border/50 shadow-sm group-hover:scale-105 transition-transform">
                      <Icon size={14} />
                    </div>
                    <div className="flex items-center gap-1">
                      {c.isDbSource && (
                        <span className="text-[7.5px] font-mono px-1 py-0.2 rounded bg-primary/10 text-primary font-bold">
                          DB
                        </span>
                      )}
                      <span
                        className={`text-[8.5px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${theme.badgeClass}`}
                      >
                        {c.categoryLabel || c.category}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-text group-hover:text-primary transition-colors leading-snug line-clamp-1">
                      {c.title}
                    </h3>
                    <p className="text-[10.5px] text-muted leading-relaxed line-clamp-2">
                      {c.description}
                    </p>
                  </div>
                </motion.button>
              );
            })}
      </div>
    </div>
  );
};

export default AIChat;
