import React from 'react';
import { motion } from 'framer-motion';
import {
  Home, Cpu, ArrowRight, GitBranch, Play, BookOpen, Brain, Presentation, Settings, ChevronRight
} from 'lucide-react';
import type { AppPage } from '../../types/automaton';

interface SidebarProps {
  current: AppPage;
  onNavigate: (page: AppPage) => void;
  collapsed?: boolean;
}

const NAV_ITEMS: { page: AppPage; label: string; icon: React.ReactNode; color: string }[] = [
  { page: 'home', label: 'Home', icon: <Home size={16} />, color: '#60a5fa' },
  { page: 'builder', label: 'Automaton Builder', icon: <Cpu size={16} />, color: '#a78bfa' },
  { page: 'epsilon-nfa-to-nfa', label: 'ε-NFA → NFA', icon: <ArrowRight size={16} />, color: '#22d3ee' },
  { page: 'nfa-to-dfa', label: 'NFA → DFA', icon: <GitBranch size={16} />, color: '#34d399' },
  { page: 'simulator', label: 'String Simulator', icon: <Play size={16} />, color: '#fbbf24' },
  { page: 'learning', label: 'Learning Mode', icon: <BookOpen size={16} />, color: '#f97316' },
  { page: 'quiz', label: 'Quiz & Practice', icon: <Brain size={16} />, color: '#f43f5e' },
  { page: 'presentation', label: 'Presentation', icon: <Presentation size={16} />, color: '#8b5cf6' },
  { page: 'settings', label: 'Settings', icon: <Settings size={16} />, color: '#94a3b8' },
];

export const Sidebar: React.FC<SidebarProps> = ({ current, onNavigate }) => {
  return (
    <aside
      style={{
        width: 220,
        minWidth: 220,
        background: 'rgba(10,15,30,0.95)',
        borderRight: '1px solid rgba(59,130,246,0.12)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem 0.75rem',
        gap: '0.2rem',
        overflowY: 'auto',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '0.5rem 0.5rem 1.25rem' }}>
        <div className="gradient-text" style={{ fontSize: '1.05rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
          AUTOMATA
        </div>
        <div className="gradient-text" style={{ fontSize: '1.05rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
          ANIMATOR
        </div>
        <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: '0.2rem', letterSpacing: '0.08em' }}>
          ε-NFA · NFA · DFA
        </div>
      </div>

      {/* Nav items */}
      {NAV_ITEMS.map(item => (
        <motion.div
          key={item.page}
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.98 }}
          className={`sidebar-item ${current === item.page ? 'active' : ''}`}
          onClick={() => onNavigate(item.page)}
          style={{
            color: current === item.page ? item.color : undefined,
            borderColor: current === item.page ? `${item.color}40` : undefined,
            background: current === item.page ? `${item.color}18` : undefined,
          }}
        >
          <span style={{ color: item.color, opacity: current === item.page ? 1 : 0.7 }}>{item.icon}</span>
          <span style={{ flex: 1 }}>{item.label}</span>
          {current === item.page && <ChevronRight size={12} style={{ color: item.color }} />}
        </motion.div>
      ))}

      {/* Bottom info */}
      <div style={{ marginTop: 'auto', padding: '0.75rem 0.5rem 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: '0.7rem', color: '#334155' }}>
          FLA Theory Tool v1.0
        </div>
      </div>
    </aside>
  );
};
