import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, ArrowRight, GitBranch, Play, Sparkles, BookOpen } from 'lucide-react';
import type { AppPage } from '../types/automaton';

interface HomePageProps {
  onNavigate: (page: AppPage) => void;
  onLoadExample: () => void;
}

const FEATURES = [
  {
    icon: <Cpu size={22} />,
    title: 'ε-NFA Builder',
    desc: 'Create states, define transitions including ε-transitions, mark accepting states, and build your automaton visually.',
    color: '#3b82f6',
    page: 'builder' as AppPage,
  },
  {
    icon: <ArrowRight size={22} />,
    title: 'ε-NFA → NFA',
    desc: 'Visualize epsilon closures and eliminate epsilon transitions step by step with animated explanations.',
    color: '#8b5cf6',
    page: 'epsilon-nfa-to-nfa' as AppPage,
  },
  {
    icon: <GitBranch size={22} />,
    title: 'NFA → DFA',
    desc: 'Apply the subset construction algorithm and generate an equivalent deterministic automaton.',
    color: '#22d3ee',
    page: 'nfa-to-dfa' as AppPage,
  },
  {
    icon: <Play size={22} />,
    title: 'String Simulator',
    desc: 'Animate string processing on all three automata and verify language recognition.',
    color: '#10b981',
    page: 'simulator' as AppPage,
  },
];

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onLoadExample }) => {
  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: '2rem' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 3rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
            borderRadius: 999, padding: '0.3rem 0.9rem', fontSize: '0.75rem',
            color: '#60a5fa', fontWeight: 600, letterSpacing: '0.08em',
            marginBottom: '1.5rem'
          }}>
            <Sparkles size={12} />
            FORMAL LANGUAGES & AUTOMATA THEORY
          </div>

          <h1 className="gradient-text" style={{
            fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900,
            letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '0.75rem'
          }}>
            Automata Animator
          </h1>

          <p style={{ fontSize: '1rem', color: '#64748b', fontStyle: 'italic', marginBottom: '1rem' }}>
            Visualize. Convert. Simulate. Recognize.
          </p>

          <p style={{ fontSize: '1rem', color: '#94a3b8', lineHeight: 1.7, marginBottom: '2rem' }}>
            Explore the power of finite automata through interactive visualizations.
            Build an ε-NFA, understand epsilon closures, convert it into an equivalent NFA and DFA,
            and test whether strings belong to the language.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button
              className="btn-primary"
              style={{ padding: '0.8rem 2rem', fontSize: '1rem' }}
              onClick={() => onNavigate('builder')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Cpu size={18} />
              Start Exploring
            </motion.button>
            <motion.button
              className="btn-secondary"
              style={{ padding: '0.8rem 2rem', fontSize: '1rem' }}
              onClick={onLoadExample}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <BookOpen size={18} />
              Load Example Automaton
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Feature cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem', maxWidth: 960, margin: '0 auto 3rem'
      }}>
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.page}
            className="glass-card glass-card-hover"
            style={{ padding: '1.5rem', cursor: 'pointer' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
            onClick={() => onNavigate(f.page)}
            whileHover={{ y: -3 }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: `${f.color}20`, border: `1px solid ${f.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1rem', color: f.color
            }}>
              {f.icon}
            </div>
            <h3 style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '0.5rem' }}>{f.title}</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6 }}>{f.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Example automaton info */}
      <motion.div
        className="glass-card"
        style={{ maxWidth: 960, margin: '0 auto', padding: '1.5rem' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <h3 style={{ color: '#60a5fa', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen size={16} /> Preloaded Example ε-NFA
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
          <div>
            <div className="badge badge-blue" style={{ marginBottom: '0.5rem' }}>States</div>
            <div className="formula-block">Q = &#123;q0, q1, q2&#125;</div>
          </div>
          <div>
            <div className="badge badge-violet" style={{ marginBottom: '0.5rem' }}>Alphabet</div>
            <div className="formula-block">Σ = &#123;a, b&#125;</div>
          </div>
          <div>
            <div className="badge badge-green" style={{ marginBottom: '0.5rem' }}>Accepting</div>
            <div className="formula-block">F = &#123;q2&#125;</div>
          </div>
          <div>
            <div className="badge badge-amber" style={{ marginBottom: '0.5rem' }}>Language</div>
            <div className="formula-block">aⁿbᵐ | n≥0, m≥1</div>
          </div>
        </div>
      </motion.div>

      <div style={{ height: '2rem' }} />
    </div>
  );
};
