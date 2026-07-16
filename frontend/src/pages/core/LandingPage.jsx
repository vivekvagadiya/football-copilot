import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cpu, Zap, Trophy, Shield, ArrowRight, Activity, Terminal } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const LandingPage = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative overflow-hidden">
      {/* Hero Section */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-center max-w-3xl mx-auto space-y-6"
      >
        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] uppercase font-bold tracking-wider">
          <Terminal size={12} /> The Football Operating System (FOS) v1.0
        </motion.div>

        <motion.h1 
          variants={itemVariants} 
          className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-text leading-none"
        >
          Manage, Predict, and Analyze with{' '}
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Football Copilot
          </span>
        </motion.h1>

        <motion.p 
          variants={itemVariants} 
          className="text-sm sm:text-base text-muted max-w-2xl mx-auto leading-relaxed"
        >
          The first AI-Powered Operating System for football clubs, tactics, fixtures, and scout profiling. Built for gaffers, analysts, and advanced tacticians.
        </motion.p>

        <motion.div variants={itemVariants} className="flex justify-center gap-4 pt-4">
          <Button 
            variant="primary" 
            size="lg" 
            onClick={() => navigate('/dashboard')}
            className="group"
          >
            Launch System
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => navigate('/login')}
          >
            Access Core
          </Button>
        </motion.div>
      </motion.div>

      {/* Feature Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24"
      >
        {/* Card 1 */}
        <div className="bg-card border border-border p-6 rounded-xl space-y-4 hover:border-primary/30 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-primary/5 rounded-bl-full pointer-events-none group-hover:bg-primary/10 transition-colors" />
          <div className="p-3 bg-primary/10 rounded-lg w-fit text-primary border border-primary/20">
            <Cpu size={20} />
          </div>
          <h3 className="font-display font-bold text-base text-text">AI Tactical Engine</h3>
          <p className="text-xs text-muted leading-relaxed">
            Generate micro-commentaries, game simulations, and detailed xG outcomes using our mock LLM tactical prompt analyzer.
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-card border border-border p-6 rounded-xl space-y-4 hover:border-primary/30 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-secondary/5 rounded-bl-full pointer-events-none group-hover:bg-secondary/10 transition-colors" />
          <div className="p-3 bg-secondary/10 rounded-lg w-fit text-secondary border border-secondary/20">
            <Zap size={20} />
          </div>
          <h3 className="font-display font-bold text-base text-text">Live Action Engine</h3>
          <p className="text-xs text-muted leading-relaxed">
            Stream live actions, cards, goals, substitutions, and live xG timelines dynamically refreshed via internal timers.
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-card border border-border p-6 rounded-xl space-y-4 hover:border-primary/30 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-primary/5 rounded-bl-full pointer-events-none group-hover:bg-primary/10 transition-colors" />
          <div className="p-3 bg-primary/10 rounded-lg w-fit text-primary border border-primary/20">
            <Activity size={20} />
          </div>
          <h3 className="font-display font-bold text-base text-text">Scout Metrics & Radar</h3>
          <p className="text-xs text-muted leading-relaxed">
            Evaluate deep squads, player positions, goal metrics, transfers, and contracts in a clean, unified matrix interface.
          </p>
        </div>
      </motion.div>

      {/* Visual System Mockup */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="mt-24 border border-border bg-card rounded-2xl p-4 shadow-2xl relative overflow-hidden"
      >
        <div className="flex items-center gap-1.5 border-b border-border/70 pb-3 mb-4 text-xs text-muted">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          <span className="ml-2 font-mono text-[10px]">tactics_system_layout.sh</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1 border border-border/60 bg-background/50 rounded-xl p-3.5 space-y-3">
            <div className="h-4 w-24 bg-border/40 rounded animate-pulse" />
            <div className="h-8 w-full bg-primary/10 border border-primary/20 rounded-lg" />
            <div className="space-y-1.5">
              <div className="h-3 w-16 bg-border/30 rounded" />
              <div className="h-3 w-28 bg-border/30 rounded" />
              <div className="h-3 w-20 bg-border/30 rounded" />
            </div>
          </div>
          <div className="md:col-span-3 border border-border/60 bg-background/50 rounded-xl p-4 flex flex-col justify-between min-h-[220px]">
            <div className="flex justify-between items-center border-b border-border/40 pb-2">
              <span className="text-[10px] text-primary font-bold">COGNITIVE MATCH RADAR</span>
              <span className="text-[9px] text-muted">SYSTEM STATUS: ACTIVE</span>
            </div>
            <div className="flex justify-center items-center py-6 text-xs text-muted font-mono">
              [ Tactical Field Model Loaded Successfully ]
            </div>
            <div className="h-2 w-full bg-border/40 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-2/3" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export default LandingPage;
