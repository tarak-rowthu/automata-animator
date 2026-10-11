import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, X } from 'lucide-react';

interface CelebrationBannerProps {
  inputString: string;
  symbolsProcessed: number;
  finalActiveStates: string[];
  acceptingStatesReached: string[];
  onDismiss: () => void;
  onInspectGraph: () => void;
}

export const CelebrationBanner: React.FC<CelebrationBannerProps> = ({
  inputString,
  symbolsProcessed,
  finalActiveStates,
  acceptingStatesReached,
  onDismiss,
  onInspectGraph,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className="glass-card shadow-lg relative overflow-hidden"
      style={{
        border: '1px solid rgba(16, 185, 129, 0.45)',
        background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.45) 0%, rgba(13, 22, 41, 0.85) 100%)',
        backdropFilter: 'blur(12px)',
        padding: '0.85rem 1.25rem',
        marginBottom: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399',
            }}
          >
            <Sparkles size={16} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#34d399', letterSpacing: '0.03em' }}>
                SUCCESS — ACCEPTING STATE REACHED
              </span>
              <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                ACCEPTED
              </span>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
              <span>
                Input: <strong style={{ color: '#38bdf8', fontFamily: 'JetBrains Mono, monospace' }}>{inputString || 'ε'}</strong>
              </span>
              <span>
                Processed: <strong>{symbolsProcessed} {symbolsProcessed === 1 ? 'symbol' : 'symbols'}</strong>
              </span>
              <span>
                Final active: <strong style={{ fontFamily: 'JetBrains Mono, monospace' }}>&#123;{finalActiveStates.join(', ')}&#125;</strong>
              </span>
              <span>
                Accepting reached: <strong style={{ color: '#34d399', fontFamily: 'JetBrains Mono, monospace' }}>&#123;{acceptingStatesReached.join(', ')}&#125;</strong>
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={onInspectGraph}
            className="btn-secondary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
          >
            Inspect Graph
          </button>
          <button
            onClick={onDismiss}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Dismiss celebration banner"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
