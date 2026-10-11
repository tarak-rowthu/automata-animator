import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, RefreshCw, FastForward, Sparkles, CheckCircle2 } from 'lucide-react';
import { Automaton, AppPage, EpsilonClosureMap } from '../types/automaton';
import { epsilonNfaToNfa } from '../algorithms/epsilonNfaToNfa';
import { AutomatonCanvas } from '../components/automaton/AutomatonCanvas';
import { validateAutomaton } from '../algorithms/automatonValidation';
import { FinalStateInspector } from '../components/automaton/FinalStateInspector';
import { ConversionCompleteModal } from '../components/conversion/ConversionCompleteModal';

interface EpsilonNfaToNfaPageProps {
  automaton: Automaton;
  onConversionComplete: (nfa: Automaton, closures: EpsilonClosureMap) => void;
  onNavigate?: (page: AppPage) => void;
}

export const EpsilonNfaToNfaPage: React.FC<EpsilonNfaToNfaPageProps> = ({
  automaton,
  onConversionComplete,
  onNavigate,
}) => {
  const [result, setResult] = useState<ReturnType<typeof epsilonNfaToNfa> | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1500);
  const [activeTab, setActiveTab] = useState<'steps' | 'closure-table' | 'nfa-table' | 'nfa-graph'>('steps');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [hasShownCompletionModal, setHasShownCompletionModal] = useState(false);

  const intervalRef = useRef<number | null>(null);
  const validation = validateAutomaton(automaton);

  useEffect(() => {
    if (validation.valid && automaton.states.length > 0) {
      const r = epsilonNfaToNfa(automaton);
      setResult(r);
      setStepIndex(0);
      setHasShownCompletionModal(false);
      onConversionComplete(r.nfa, r.epsilonClosures);
    }
  }, [automaton]);

  useEffect(() => {
    if (playing && result) {
      intervalRef.current = window.setInterval(() => {
        setStepIndex(i => {
          if (i >= result.steps.length - 1) {
            setPlaying(false);
            return i;
          }
          return i + 1;
        });
      }, speed);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, speed, result]);

  // When step reaches the last step, open completion popup
  useEffect(() => {
    if (result && stepIndex === result.steps.length - 1 && !hasShownCompletionModal) {
      setShowCompletionModal(true);
      setHasShownCompletionModal(true);
    }
  }, [stepIndex, result, hasShownCompletionModal]);

  if (!validation.valid || automaton.states.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        <p style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>Please build a valid automaton first.</p>
        <p style={{ fontSize: '0.85rem' }}>{validation.errors.join(' ')}</p>
      </div>
    );
  }

  const currentStep = result?.steps[stepIndex];
  const highlightedStates = currentStep?.highlightStates || [];
  const epsilonClosures = result?.epsilonClosures || {};
  const nfa = result?.nfa;

  // Check if current step is the accepting state calculation
  const isAcceptingStateStep =
    currentStep?.type === 'identify-accepting' ||
    Boolean(currentStep?.title?.toLowerCase().includes('accepting'));

  function prev() {
    setStepIndex(i => Math.max(0, i - 1));
    setPlaying(false);
  }
  function next() {
    setStepIndex(i => Math.min((result?.steps.length || 1) - 1, i + 1));
  }
  function restart() {
    setStepIndex(0);
    setPlaying(false);
    setHasShownCompletionModal(false);
  }
  function skipToEnd() {
    const last = (result?.steps.length || 1) - 1;
    setStepIndex(last);
    setPlaying(false);
    setShowCompletionModal(true);
  }

  // Build NFA transition display helper
  function getNfaCell(state: string, symbol: string): string {
    if (!nfa) return '∅';
    const targets = nfa.transitions.filter(t => t.from === state && t.symbol === symbol).map(t => t.to);
    return targets.length === 0 ? '∅' : `{${targets.join(', ')}}`;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid rgba(59,130,246,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ fontWeight: 800, color: '#e2e8f0', fontSize: '1.1rem' }}>ε-NFA → NFA Conversion</h2>
            <span className="badge badge-blue">Epsilon Elimination</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Eliminating epsilon transitions using epsilon closure & recalculated accepting states
          </p>
        </div>
        {/* Tabs */}
        <div className="tab-bar">
          {(['steps', 'closure-table', 'nfa-table', 'nfa-graph'] as const).map(tab => (
            <div
              key={tab}
              className={`tab-item ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'steps'
                ? 'Step-by-Step'
                : tab === 'closure-table'
                ? 'ε-Closure Table'
                : tab === 'nfa-table'
                ? 'NFA Table'
                : 'NFA Graph'}
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {/* Main content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
          {activeTab === 'steps' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Accepting States Updated Banner Notification (Requirement 6) */}
              {isAcceptingStateStep && nfa && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card"
                  style={{
                    padding: '0.9rem 1.25rem',
                    border: '1px solid rgba(16, 185, 129, 0.45)',
                    background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.35) 0%, rgba(13, 22, 41, 0.8) 100%)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                    <Sparkles size={16} color="#34d399" />
                    <span style={{ fontWeight: 800, color: '#34d399', fontSize: '0.95rem' }}>
                      ACCEPTING STATES UPDATED
                    </span>
                    <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                      Formula: F' = &#123; q ∈ Q | ε-closure(q) ∩ F ≠ ∅ &#125;
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                    <span>
                      Original ε-NFA Accepting: <strong style={{ color: '#93c5fd' }}>&#123;{automaton.acceptingStates.join(', ')}&#125;</strong>
                    </span>
                    <span>
                      New NFA Accepting States: <strong style={{ color: '#34d399' }}>&#123;{nfa.acceptingStates.join(', ')}&#125;</strong>
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Graphs side by side with state inspector click handlers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Original ε-NFA (Input)
                  </div>
                  <AutomatonCanvas
                    automaton={automaton}
                    highlightedStates={highlightedStates}
                    selectedState={selectedState}
                    onStateClick={setSelectedState}
                    height={240}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Resulting NFA (Accepting states highlighted)
                  </div>
                  <AutomatonCanvas
                    automaton={nfa || { states: [], alphabet: [], initialState: '', acceptingStates: [], transitions: [] }}
                    highlightedStates={isAcceptingStateStep ? nfa?.acceptingStates : []}
                    selectedState={selectedState}
                    onStateClick={setSelectedState}
                    height={240}
                  />
                </div>
              </div>

              {/* Interactive Final-State Inspector Drawer */}
              {selectedState && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <FinalStateInspector
                    stateId={selectedState}
                    automaton={nfa || automaton}
                    automatonType="nfa"
                    epsilonClosures={epsilonClosures}
                    originalAcceptingStates={automaton.acceptingStates}
                    onClose={() => setSelectedState(null)}
                  />
                </div>
              )}

              {/* Step display */}
              <AnimatePresence mode="wait">
                {currentStep && (
                  <motion.div
                    key={stepIndex}
                    className="glass-card"
                    style={{ padding: '1.25rem' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <span className="badge badge-blue">{stepIndex + 1} / {result?.steps.length}</span>
                      <h3 style={{ color: '#60a5fa', fontWeight: 700, fontSize: '1rem' }}>{currentStep.title}</h3>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.7 }}>{currentStep.description}</p>

                    {currentStep.highlightStates && currentStep.highlightStates.length > 0 && (
                      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Highlighted States:</span>
                        {currentStep.highlightStates.map(s => (
                          <span key={s} className="badge badge-amber">{s}</span>
                        ))}
                      </div>
                    )}

                    {/* Show closure formula if available */}
                    {Boolean(currentStep.data?.closure) && (
                      <div className="formula-block" style={{ marginTop: '0.75rem' }}>
                        ε-closure({String(currentStep.data?.state || '')}) = &#123;{Array.isArray(currentStep.data?.closure) ? (currentStep.data.closure as string[]).join(', ') : ''}&#125;
                      </div>
                    )}

                    {Boolean(currentStep.data?.finalSet) && (
                      <div className="formula-block" style={{ marginTop: '0.75rem' }}>
                        δ'({String(currentStep.data?.fromState || '')}, {String(currentStep.data?.symbol || '')}) = ε-closure(&#123;{Array.isArray(currentStep.data?.reachableBySymbol) ? (currentStep.data.reachableBySymbol as string[]).join(', ') : ''}&#125;) = &#123;{Array.isArray(currentStep.data?.finalSet) ? (currentStep.data.finalSet as string[]).join(', ') : ''}&#125;
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Controls */}
              <div className="glass-card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button className="btn-secondary" onClick={restart} title="Restart"><RefreshCw size={15} /></button>
                  <button className="btn-secondary" onClick={prev} disabled={stepIndex === 0}><SkipBack size={15} /></button>
                  <button className="btn-primary" onClick={() => setPlaying(!playing)} style={{ minWidth: 90 }}>
                    {playing ? <><Pause size={15} /> Pause</> : <><Play size={15} /> Play</>}
                  </button>
                  <button className="btn-secondary" onClick={next} disabled={stepIndex === (result?.steps.length || 1) - 1}><SkipForward size={15} /></button>
                  <button className="btn-secondary" onClick={skipToEnd} title="Skip to end"><FastForward size={15} /></button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Speed</span>
                    <input
                      type="range"
                      min={300}
                      max={3000}
                      step={100}
                      value={speed}
                      onChange={e => setSpeed(Number(e.target.value))}
                      style={{ width: 80 }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{(speed / 1000).toFixed(1)}s</span>
                  </div>

                  {stepIndex === (result?.steps.length || 1) - 1 && (
                    <button
                      onClick={() => setShowCompletionModal(true)}
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                    >
                      Completion Modal
                    </button>
                  )}
                </div>

                {/* Step progress pills */}
                <div style={{ display: 'flex', gap: '3px', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  {result?.steps.map((_, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setStepIndex(i);
                        setPlaying(false);
                      }}
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        cursor: 'pointer',
                        background: i < stepIndex ? '#10b981' : i === stepIndex ? '#3b82f6' : 'rgba(59,130,246,0.2)',
                        transition: 'background 0.2s',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'closure-table' && (
            <div>
              <h3 style={{ color: '#60a5fa', fontWeight: 700, marginBottom: '1rem' }}>ε-Closure Table</h3>
              <div className="formula-block" style={{ marginBottom: '1rem' }}>
                ε-closure(q) = all states reachable from q via zero or more ε-transitions
              </div>
              <table className="automaton-table">
                <thead>
                  <tr><th>State</th><th>ε-Closure</th><th>Becomes Accepting in NFA?</th><th>Reason</th></tr>
                </thead>
                <tbody>
                  {automaton.states.map(s => {
                    const closure = epsilonClosures[s] || [];
                    const intersects = closure.some(x => automaton.acceptingStates.includes(x));
                    return (
                      <tr key={s}>
                        <td className={automaton.initialState === s ? 'table-initial' : automaton.acceptingStates.includes(s) ? 'table-accepting' : ''}>
                          {automaton.initialState === s ? '→ ' : ''}{s}{automaton.acceptingStates.includes(s) ? ' *' : ''}
                        </td>
                        <td>&#123;{closure.join(', ')}&#125;</td>
                        <td>
                          {intersects ? (
                            <span className="badge badge-green">Yes</span>
                          ) : (
                            <span className="badge badge-red">No</span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                          {intersects
                            ? `Closure contains accepting state(s) {${closure.filter(x => automaton.acceptingStates.includes(x)).join(', ')}}`
                            : 'Closure contains no accepting states'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'nfa-table' && nfa && (
            <div>
              <h3 style={{ color: '#60a5fa', fontWeight: 700, marginBottom: '1rem' }}>
                NFA Transition Table (after ε-elimination)
              </h3>
              <table className="automaton-table">
                <thead>
                  <tr>
                    <th>State</th>
                    {nfa.alphabet.map(sym => <th key={sym}>{sym}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {nfa.states.map(s => (
                    <tr key={s}>
                      <td className={nfa.initialState === s ? 'table-initial' : nfa.acceptingStates.includes(s) ? 'table-accepting' : ''}>
                        {nfa.initialState === s ? '→ ' : ''}{s}{nfa.acceptingStates.includes(s) ? ' *' : ''}
                      </td>
                      {nfa.alphabet.map(sym => (
                        <td key={sym} className={getNfaCell(s, sym) === '∅' ? 'table-dead' : ''}>
                          {getNfaCell(s, sym)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#64748b' }}>
                → = initial state &nbsp; * = accepting state &nbsp; ∅ = empty set
              </div>
            </div>
          )}

          {activeTab === 'nfa-graph' && nfa && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ color: '#60a5fa', fontWeight: 700 }}>Equivalent NFA (no ε-transitions)</h3>
                <span className="badge badge-green">Accepting States: &#123;{nfa.acceptingStates.join(', ')}&#125;</span>
              </div>
              <AutomatonCanvas
                automaton={nfa}
                height={400}
                selectedState={selectedState}
                onStateClick={setSelectedState}
              />
              {selectedState && (
                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                  <FinalStateInspector
                    stateId={selectedState}
                    automaton={nfa}
                    automatonType="nfa"
                    epsilonClosures={epsilonClosures}
                    originalAcceptingStates={automaton.acceptingStates}
                    onClose={() => setSelectedState(null)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Conversion Completion Modal (Requirement 7) */}
      {nfa && (
        <ConversionCompleteModal
          isOpen={showCompletionModal}
          onClose={() => setShowCompletionModal(false)}
          conversionType="epsilon-to-nfa"
          originalAutomaton={automaton}
          convertedAutomaton={nfa}
          onViewResult={() => setActiveTab('nfa-graph')}
          onViewTable={() => setActiveTab('nfa-table')}
          onSimulate={() => {
            if (onNavigate) {
              onNavigate('simulator');
            }
          }}
        />
      )}
    </div>
  );
};
