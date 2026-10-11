import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Sparkles, RefreshCw, Eye, X, ArrowRight } from 'lucide-react';
import { Automaton, SimulationResult } from '../../types/automaton';

interface SimulationResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: SimulationResult | null;
  inputString: string;
  automaton: Automaton;
  automatonType: 'epsilon-nfa' | 'nfa' | 'dfa';
  onTestAnotherString: () => void;
  onViewSimulation: () => void;
}

export const SimulationResultModal: React.FC<SimulationResultModalProps> = ({
  isOpen,
  onClose,
  result,
  inputString,
  automaton,
  automatonType,
  onTestAnotherString,
  onViewSimulation,
}) => {
  if (!isOpen || !result) return null;

  const isAccepted = result.accepted;
  const lastStep = result.steps[result.steps.length - 1];
  const finalActiveStates = lastStep?.activeStates || [];
  const acceptingStatesReached = finalActiveStates.filter(s =>
    automaton.acceptingStates.includes(s)
  );

  const displayInput = inputString === '' ? 'ε (empty string)' : inputString;

  // Elaborate explanation based on automata theory
  let formalExplanation = '';
  if (isAccepted) {
    if (automatonType === 'dfa') {
      formalExplanation = `The DFA processed the input string and concluded in state ${finalActiveStates[0]}, which belongs to the set of accepting states F = {${automaton.acceptingStates.join(', ')}}.`;
    } else {
      formalExplanation = `In non-deterministic automata (${automatonType === 'epsilon-nfa' ? 'ε-NFA' : 'NFA'}), an input string is accepted if at least one active state reached after consuming the input belongs to the accepting set F. Here, accepting state(s) {${acceptingStatesReached.join(', ')}} were reached among active states {${finalActiveStates.join(', ')}}.`;
    }
  } else {
    if (finalActiveStates.length === 0) {
      formalExplanation = `The automaton reached a dead state / empty active set (∅) because there were no valid transitions defined for the remaining input symbol.`;
    } else {
      formalExplanation = `All computation paths concluded in states {${finalActiveStates.join(', ')}}. None of these active states intersect with the automaton's accepting states F = {${automaton.acceptingStates.join(', ')}}.`;
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
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
          maxWidth: 520,
          width: '100%',
          overflow: 'hidden',
          border: isAccepted ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(239, 68, 68, 0.45)',
          background: 'rgba(10, 15, 30, 0.95)',
          boxShadow: isAccepted
            ? '0 20px 50px -10px rgba(16, 185, 129, 0.2), 0 0 20px rgba(34, 211, 238, 0.15)'
            : '0 20px 50px -10px rgba(239, 68, 68, 0.2), 0 0 20px rgba(245, 158, 11, 0.15)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Shimmer top accent bar */}
        <div
          className={isAccepted ? 'shimmer-border' : 'shimmer-border-red'}
          style={{ height: 4, width: '100%' }}
        />

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

          {/* Icon and Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '1rem' }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isAccepted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: isAccepted ? '1.5px solid rgba(16, 185, 129, 0.5)' : '1.5px solid rgba(239, 68, 68, 0.5)',
                color: isAccepted ? '#34d399' : '#f87171',
              }}
            >
              {isAccepted ? <CheckCircle2 size={26} /> : <XCircle size={26} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    letterSpacing: '0.02em',
                    color: isAccepted ? '#34d399' : '#f87171',
                  }}
                >
                  {isAccepted ? 'LANGUAGE ACCEPTED' : 'LANGUAGE REJECTED'}
                </h3>
                {isAccepted && <Sparkles size={16} color="#22d3ee" />}
              </div>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                {isAccepted
                  ? '✓ The input string belongs to the language recognized by this automaton.'
                  : 'The input string is not accepted by this automaton.'}
              </p>
            </div>
          </div>

          {/* Details Table */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: 10,
              padding: '1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Input String:</span>
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: '#38bdf8',
                  background: 'rgba(56, 189, 248, 0.1)',
                  padding: '2px 8px',
                  borderRadius: 6,
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                }}
              >
                {displayInput}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Final Active States:</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                {finalActiveStates.length > 0
                  ? `{${finalActiveStates.join(', ')}}`
                  : '∅ (Empty Set)'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Accepting States Reached:</span>
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 600,
                  color: isAccepted ? '#34d399' : '#94a3b8',
                }}
              >
                {acceptingStatesReached.length > 0
                  ? `{${acceptingStatesReached.join(', ')}}`
                  : 'None'}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '0.5rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <span style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>Result:</span>
              <span
                className={isAccepted ? 'badge badge-green' : 'badge badge-red'}
                style={{ fontSize: '0.85rem', padding: '0.25rem 0.75rem', fontWeight: 800 }}
              >
                {isAccepted ? 'ACCEPTED' : 'REJECTED'}
              </span>
            </div>
          </div>

          {/* Short theoretical explanation */}
          <div
            style={{
              fontSize: '0.825rem',
              lineHeight: 1.6,
              color: isAccepted ? '#a7f3d0' : '#fecaca',
              background: isAccepted ? 'rgba(16, 185, 129, 0.07)' : 'rgba(239, 68, 68, 0.07)',
              border: isAccepted ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 8,
              padding: '0.75rem 0.9rem',
              marginBottom: '1.5rem',
            }}
          >
            {formalExplanation}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                onViewSimulation();
                onClose();
              }}
              className="btn-secondary"
              style={{ fontSize: '0.85rem' }}
            >
              <Eye size={15} /> View Simulation
            </button>
            <button
              onClick={() => {
                onTestAnotherString();
                onClose();
              }}
              className="btn-primary"
              style={{
                fontSize: '0.85rem',
                background: isAccepted
                  ? 'linear-gradient(135deg, #059669, #0d9488)'
                  : 'linear-gradient(135deg, #dc2626, #b45309)',
              }}
            >
              <RefreshCw size={15} /> {isAccepted ? 'Test Another String' : 'Try Another String'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
