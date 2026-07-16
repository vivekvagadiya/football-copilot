import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Cpu, Trash2, ShieldAlert, Sparkles, CornerDownLeft } from 'lucide-react';
import { apiService } from '../services/apiService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AIResponseCard } from '../components/ai/AIResponseCard';

export const AIChat = () => {
  const [messages, setMessages] = useState([
    { id: '1', sender: 'ai', text: "Systems online. I am your **Football Copilot**.\n\nAsk me about tactics, squad scouting, player ratings, or statistical briefs. How can I assist your session today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Previous mock chat threads
  const [chatHistory, setChatHistory] = useState([
    { id: 'ch1', title: 'Arsenal vs City Decider' },
    { id: 'ch2', title: 'Deep-lying Playmaker scouting' },
    { id: 'ch3', title: 'Haaland vs Yamal metrics' }
  ]);

  const [activeHistoryId, setActiveHistoryId] = useState(null);

  const messagesEndRef = useRef(null);

  // Suggestions pills
  const suggestions = [
    { label: 'Analyze Arsenal vs City', prompt: 'Analyze Arsenal vs Manchester City tactically.' },
    { label: 'Scout playmaker targets', prompt: 'Provide scouting options for a deep-lying playmaker.' },
    { label: 'Golden Boot details', prompt: 'Who is leading the golden boot metrics right now?' }
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Streaming Text effect
  const streamAIResponse = (fullResponse) => {
    let currentText = '';
    const words = fullResponse.split(' ');
    let wordIdx = 0;

    // Set temp response bubble
    const tempId = `ai-${Date.now()}`;
    setMessages(prev => [...prev, { id: tempId, sender: 'ai', text: '' }]);

    const interval = setInterval(() => {
      if (wordIdx < words.length) {
        currentText += (wordIdx === 0 ? '' : ' ') + words[wordIdx];
        setMessages(prev => 
          prev.map(msg => msg.id === tempId ? { ...msg, text: currentText } : msg)
        );
        wordIdx++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 45); // Speed of streaming
  };

  const handleSendMessage = async (textToSend) => {
    if (!textToSend.trim()) return;

    // Append User message
    const userMessage = { id: `u-${Date.now()}`, sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Call mock api
      const response = await apiService.askCopilot(textToSend);
      // Initiate streaming response
      streamAIResponse(response);
    } catch (err) {
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        id: `err-${Date.now()}`, 
        sender: 'ai', 
        text: "Critical Error: Could not connect to FOS intelligence matrix." 
      }]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(input);
    }
  };

  const loadHistoryThread = (threadTitle) => {
    setMessages([
      { id: '1', sender: 'ai', text: `Loaded thread: **${threadTitle}**. Analysis parameters synchronized.` }
    ]);
    handleSendMessage(`Provide a summary of ${threadTitle}`);
  };

  return (
    <div className="h-[calc(100vh-10rem)] border border-border rounded-2xl overflow-hidden flex bg-card/40">
      
      {/* Left panel (Chat History) */}
      <div className="w-60 border-r border-border bg-card/65 flex flex-col justify-between shrink-0 hidden md:flex">
        <div className="p-4 space-y-4">
          <div className="text-[10px] text-muted uppercase font-bold tracking-wider flex items-center gap-1.5">
            <Cpu size={12} /> Analytical Archives
          </div>
          <div className="space-y-1">
            {chatHistory.map(ch => (
              <button
                key={ch.id}
                onClick={() => loadHistoryThread(ch.title)}
                className="w-full text-left p-2.5 rounded-lg text-xs hover:bg-border/20 text-muted hover:text-text transition-colors truncate block font-medium cursor-pointer"
              >
                # {ch.title}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 border-t border-border/40">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setMessages([{ id: '1', sender: 'ai', text: "OS history cache cleared." }])}
            className="w-full text-[10px] py-1.5"
          >
            Clear local history
          </Button>
        </div>
      </div>

      {/* Center panel (Active Chat Room) */}
      <div className="flex-1 flex flex-col justify-between bg-background/25">
        
        {/* Scrollable messages box */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => {
            const isAI = m.sender === 'ai';
            return (
              <div 
                key={m.id}
                className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}
              >
                {isAI ? (
                  <AIResponseCard content={m.text} />
                ) : (
                  <div className="bg-primary text-[#07120D] text-xs font-semibold px-3 py-2 rounded-xl rounded-tr-none max-w-md shadow-sm border border-primary/20 leading-relaxed">
                    {m.text}
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing dots loader */}
          {isTyping && (
            <div className="flex justify-start">
              <Card hover={false} className="border border-border/60 bg-border/10 p-3 flex gap-2 items-center">
                <Cpu size={14} className="text-primary animate-spin" />
                <span className="text-[10px] text-muted font-bold uppercase tracking-widest flex gap-1">
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

        {/* Suggestion pills + Input box footer */}
        <div className="p-4 border-t border-border bg-card/65 space-y-3">
          {/* Suggestions */}
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(s.prompt)}
                className="text-[10px] bg-background border border-border/70 hover:border-primary/40 px-2.5 py-1 rounded-full text-muted hover:text-text cursor-pointer transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Text Input area */}
          <div className="relative flex items-center border border-border rounded-xl px-3 py-1.5 bg-background/50 focus-within:ring-2 focus-within:ring-primary/45">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Copilot tactical layouts, scouts, comparisons..."
              className="w-full py-2 bg-transparent text-xs text-text focus:outline-none placeholder-muted pr-10"
            />
            <Button 
              onClick={() => handleSendMessage(input)} 
              size="icon" 
              className="absolute right-2 rounded-lg w-7 h-7"
              disabled={!input.trim()}
            >
              <Send size={12} className="text-[#07120D]" />
            </Button>
          </div>
        </div>

      </div>

    </div>
  );
};
export default AIChat;
