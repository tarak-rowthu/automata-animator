import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ArrowRight, ArrowLeft, Info, Sparkles, X } from 'lucide-react';
import { Automaton, Transition, DFASubsetMapping, EpsilonClosureMap } from '../../types/automaton';

interface FinalStateInspectorProps {
  stateId: string | null;
  automaton: Automaton;
  activeStates?: string[];
  dfaSubsets?: Record<string, string[]>;
  dfaMapping?: DFASubsetMapping[];
  epsilonClosures?: EpsilonClosureMap | null;
  originalAcceptingStates?: string[];
  automatonType?: 'epsilon-nfa' | 'nfa' | 'dfa';
  onClose: () => void;
}

export const FinalStateInspector: React.FC<FinalStateInspectorProps> = ({
  stateId,
  automaton,
  activeStates = [],
  dfaSubsets,
  dfaMapping,
  epsilonClosures,
  originalAcceptingStates = [],
  automatonType,
  onClose,
}) => {
  if (!stateId) return null;

  const isAccepting = automaton.acceptingStates.includes(stateId);
  const isInitial = automaton.initialState === stateId;
  const isActive = activeStates.includes(stateId);

  // Incoming and outgoing transitions
  const incomingTransitions = automaton.transitions.filter(t => t.to === stateId);
  const outgoingTransitions = automaton.transitions.filter(t => t.from === stateId);

  // DFA Subset Info
  const subset = dfaSubsets?.[stateId] || dfaMapping?.find(m => m.dfaState === stateId)?.nfaStates;

  // Determine explanation for why state is accepting
  let acceptingReason: string | null = null;
  if (isAccepting) {
    if (automatonType === 'dfa' || subset) {
      const memberAccepting = (subset || []).filter(s => originalAcceptingStates.includes(s));
      acceptingReason = memberAccepting.length > 0
        ? `Accepting DFA State: Subset {${(subset || []).join(', ')}} contains accepting NFA state(s) {${memberAccepting.join(', ')}}. By subset construction, any DFA state containing at least one NFA accepting state is an accepting state.`
        : `Accepting DFA State: Contains at least one accepting NFA state in its subset definition.`;
    } else if (automatonType === 'nfa' && epsilonClosures && epsilonClosures[stateId]) {
      const closure = epsilonClosures[stateId] || [];
      const reachedOriginal = closure.filter(s => originalAcceptingStates.includes(s));
      acceptingReason = reachedOriginal.length > 0
        ? `Accepting NFA State: ε-closure(${stateId}) = {${closure.join(', ')}} contains original accepting state(s) {${reachedOriginal.join(', ')}}. In ε-NFA to NFA conversion, F' = { q | ε-closure(q) ∩ F ≠ ∅ }.`
        : `Accepting state in the automaton.`;
    } else {
      acceptingReason = `Accepting State (F): If the automaton consumes all input symbols and is in this state, the string is accepted.`;
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="glass-card shadow-xl"
        style={{
          border: isAccepting ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(59, 130, 246, 0.3)',
          background: 'rgba(10, 15, 30, 0.95)',
          backdropFilter: 'blur(16px)',
          padding: '1rem',
          borderRadius: 12,
          maxWidth: 420,
          width: '100%',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: isAccepting ? '2px double #10b981' : '2px solid #3b82f6',
                background: isAccepting ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                color: isAccepting ? '#34d399' : '#60a5fa',
                fontWeight: 800,
                fontSize: '0.9rem',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {stateId}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '1rem' }}>
                  State <code style={{ color: '#38bdf8' }}>{stateId}</code>
                </span>
                {isInitial && <span className="badge badge-violet">Start</span>}
                {isAccepting ? (
                  <span className="badge badge-green flex items-center gap-1">
                    <Sparkles size={11} /> Accepting
                  </span>
                ) : (
                  <span className="badge badge-blue">Non-Accepting</span>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {isActive ? (
                  <span style={{ color: '#22d3ee', fontWeight: 600 }}>● Currently active in simulation</span>
                ) : (
                  <span>○ Inactive in current step</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '4px 6px', border: 'none', background: 'transparent', color: '#94a3b8' }}
            title="Close inspector"
          >
            <X size={16} />
          </button>
        </div>

        {/* Subset information if DFA */}
        {subset && subset.length > 0 && (
          <div
            style={{
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: 8,
              padding: '0.6rem 0.75rem',
              marginBottom: '0.75rem',
              fontSize: '0.85rem',
            }}
          >
            <div style={{ color: '#93c5fd', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.8rem' }}>
              NFA States Subset
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', color: '#e2e8f0', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {subset.map(s => {
                const memberIsAcc = originalAcceptingStates.includes(s);
                return (
                  <span
                    key={s}
                    className={memberIsAcc ? 'badge badge-green' : 'badge badge-blue'}
                    style={{ fontSize: '0.75rem' }}
                  >
                    {s} {memberIsAcc ? '(accepting)' : ''}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Epsilon-Closure information if ε-NFA */}
        {epsilonClosures && epsilonClosures[stateId] && (
          <div
            style={{
              background: 'rgba(139, 92, 246, 0.08)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: 8,
              padding: '0.6rem 0.75rem',
              marginBottom: '0.75rem',
              fontSize: '0.85rem',
            }}
          >
            <div style={{ color: '#c4b5fd', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.8rem' }}>
              ε-Closure({stateId})
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', color: '#e2e8f0' }}>
              &#123;{epsilonClosures[stateId].join(', ')}&#125;
            </div>
          </div>
        )}

        {/* Accepting reason box */}
        {acceptingReason && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 8,
              padding: '0.6rem 0.75rem',
              marginBottom: '0.75rem',
              fontSize: '0.8rem',
              color: '#a7f3d0',
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontWeight: 700, color: '#34d399', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <CheckCircle2 size={13} /> Theoretical Acceptance Justification
            </div>
            {acceptingReason}
          </div>
        )}

        {/* Transitions Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          {/* Incoming */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 8,
              padding: '0.5rem 0.65rem',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <ArrowLeft size={12} color="#60a5fa" /> Incoming ({incomingTransitions.length})
            </div>
            {incomingTransitions.length === 0 ? (
              <span style={{ fontSize: '0.75rem', color: '#475569' }}>None</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: 90, overflowY: 'auto' }}>
                {incomingTransitions.map((t, idx) => (
                  <div key={idx} style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', color: '#cbd5e1' }}>
                    {t.from} <span style={{ color: t.symbol === 'ε' ? '#a78bfa' : '#38bdf8' }}>({t.symbol})</span> →
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 8,
              padding: '0.5rem 0.65rem',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <ArrowRight size={12} color="#34d399" /> Outgoing ({outgoingTransitions.length})
            </div>
            {outgoingTransitions.length === 0 ? (
              <span style={{ fontSize: '0.75rem', color: '#475569' }}>None (dead/sink)</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: 90, overflowY: 'auto' }}>
                {outgoingTransitions.map((t, idx) => (
                  <div key={idx} style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', color: '#cbd5e1' }}>
                    → <span style={{ color: t.symbol === 'ε' ? '#a78bfa' : '#38bdf8' }}>({t.symbol})</span> {t.to}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
