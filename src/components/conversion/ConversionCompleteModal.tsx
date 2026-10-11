import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Sparkles, X, ArrowRight, Table, Play, Eye } from 'lucide-react';
import { Automaton } from '../../types/automaton';

interface ConversionCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversionType: 'epsilon-to-nfa' | 'nfa-to-dfa';
  originalAutomaton: Automaton;
  convertedAutomaton: Automaton;
  onViewResult: () => void;
  onViewTable: () => void;
  onSimulate: () => void;
}

export const ConversionCompleteModal: React.FC<ConversionCompleteModalProps> = ({
  isOpen,
  onClose,
  conversionType,
  originalAutomaton,
  convertedAutomaton,
  onViewResult,
  onViewTable,
  onSimulate,
}) => {
  if (!isOpen) return null;

  const isEpsilonToNfa = conversionType === 'epsilon-to-nfa';

  // Computed metrics from real data
  const epsilonTransitionsEliminated = isEpsilonToNfa
    ? originalAutomaton.transitions.filter(t => t.symbol === 'ε').length
    : 0;

  const title = isEpsilonToNfa ? 'CONVERSION COMPLETE' : 'DFA GENERATION COMPLETE';
  const subtitle = isEpsilonToNfa
    ? 'ε-NFA to equivalent NFA without epsilon transitions'
    : 'NFA to equivalent DFA via subset construction algorithm';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(2, 8, 23, 0.75)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 16 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="glass-card shadow-2xl relative"
        style={{
          maxWidth: 540,
          width: '100%',
          overflow: 'hidden',
          border: '1px solid rgba(34, 211, 238, 0.45)',
          background: 'rgba(10, 15, 30, 0.96)',
          boxShadow: '0 20px 50px -10px rgba(6, 182, 212, 0.25), 0 0 25px rgba(59, 130, 246, 0.15)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Shimmer top accent bar */}
        <div className="shimmer-border" style={{ height: 4, width: '100%' }} />

        <div style={{ padding: '1.5rem 1.75rem' }}>
          {/* Close button */}
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              padding: '6px',
              border: 'none',
              background: 'transparent',
              color: '#94a3b8',
            }}
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(16, 185, 129, 0.2))',
                border: '1.5px solid rgba(34, 211, 238, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#22d3ee',
              }}
            >
              <Sparkles size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '0.02em' }}>
                  {title}
                </h3>
                <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                  100% Equivalent
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                {subtitle}
              </p>
            </div>
          </div>

          {/* Metrics / Output calculated */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 10,
              padding: '1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
            }}
          >
            {isEpsilonToNfa ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Epsilon transitions eliminated:</span>
                  <span style={{ fontWeight: 700, color: '#a78bfa', fontFamily: 'JetBrains Mono, monospace' }}>
                    {epsilonTransitionsEliminated} transitions
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Transition function updated:</span>
                  <span style={{ fontWeight: 700, color: '#38bdf8', fontFamily: 'JetBrains Mono, monospace' }}>
                    {convertedAutomaton.transitions.length} total transitions
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Accepting states recalculated:</span>
                  <span style={{ fontWeight: 700, color: '#34d399', fontFamily: 'JetBrains Mono, monospace' }}>
                    &#123;{convertedAutomaton.acceptingStates.join(', ') || 'none'}&#125;
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Equivalent NFA generated:</span>
                  <span style={{ fontWeight: 700, color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace' }}>
                    {convertedAutomaton.states.length} states, Σ = &#123;{convertedAutomaton.alphabet.join(', ')}&#125;
                  </span>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Reachable state subsets generated:</span>
                  <span style={{ fontWeight: 700, color: '#38bdf8', fontFamily: 'JetBrains Mono, monospace' }}>
                    {convertedAutomaton.states.length} DFA states
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>DFA transitions computed:</span>
                  <span style={{ fontWeight: 700, color: '#a78bfa', fontFamily: 'JetBrains Mono, monospace' }}>
                    {convertedAutomaton.transitions.length} transitions
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Accepting DFA states identified:</span>
                  <span style={{ fontWeight: 700, color: '#34d399', fontFamily: 'JetBrains Mono, monospace' }}>
                    &#123;{convertedAutomaton.acceptingStates.join(', ') || 'none'}&#125;
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Equivalent DFA generated:</span>
                  <span style={{ fontWeight: 700, color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace' }}>
                    Deterministic & complete
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                onViewResult();
                onClose();
              }}
              className="btn-secondary"
              style={{ fontSize: '0.85rem' }}
            >
              <Eye size={15} /> View Result
            </button>
            <button
              onClick={() => {
                onViewTable();
                onClose();
              }}
              className="btn-secondary"
              style={{ fontSize: '0.85rem' }}
            >
              <Table size={15} /> View Transition Table
            </button>
            <button
              onClick={() => {
                onSimulate();
                onClose();
              }}
              className="btn-primary"
              style={{ fontSize: '0.85rem' }}
            >
              <Play size={15} /> Simulate a String
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
