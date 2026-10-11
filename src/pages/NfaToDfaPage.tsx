import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, RefreshCw, FastForward, Info, Sparkles, CheckCircle2 } from 'lucide-react';
import { Automaton, AppPage, DFASubsetMapping } from '../types/automaton';
import { nfaToDfa, subsetLabel } from '../algorithms/nfaToDfa';
import { AutomatonCanvas } from '../components/automaton/AutomatonCanvas';
import { FinalStateInspector } from '../components/automaton/FinalStateInspector';
import { ConversionCompleteModal } from '../components/conversion/ConversionCompleteModal';

interface NfaToDfaPageProps {
  nfa: Automaton | null;
  onConversionComplete: (dfa: Automaton, mapping: DFASubsetMapping[]) => void;
  onNavigate?: (page: AppPage) => void;
}

export const NfaToDfaPage: React.FC<NfaToDfaPageProps> = ({ nfa, onConversionComplete, onNavigate }) => {
  const [result, setResult] = useState<ReturnType<typeof nfaToDfa> | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1500);
  const [activeTab, setActiveTab] = useState<'steps' | 'mapping' | 'dfa-table' | 'dfa-graph'>('steps');
  const [selectedDfaState, setSelectedDfaState] = useState<string | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [hasShownCompletionModal, setHasShownCompletionModal] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (nfa && nfa.states.length > 0) {
      const r = nfaToDfa(nfa);
      setResult(r);
      setStepIndex(0);
      setHasShownCompletionModal(false);
      onConversionComplete(r.dfa, r.subsetMapping);
    }
  }, [nfa?.states.join(','), nfa?.transitions.length]);

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

  // Open completion modal on reaching final step
  useEffect(() => {
    if (result && stepIndex === result.steps.length - 1 && !hasShownCompletionModal) {
      setShowCompletionModal(true);
      setHasShownCompletionModal(true);
    }
  }, [stepIndex, result, hasShownCompletionModal]);

  if (!nfa || nfa.states.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        <p>Convert an ε-NFA to NFA first, then come here to build the DFA.</p>
      </div>
    );
  }

  const currentStep = result?.steps[stepIndex];
  const dfa = result?.dfa;
  const subsetMapping = result?.subsetMapping || [];

  const highlightedStates = currentStep?.highlightStates || [];

  // Active DFA state in current step
  const currentDfaLabel =
    (currentStep?.data?.currentLabel as string) ||
    (currentStep?.data?.to as string) ||
    (currentStep?.data?.label as string) ||
    null;

  // Active subset member states in NFA
  const activeSubset =
    (currentStep?.data?.currentSubset as string[]) ||
    (currentStep?.data?.nextStates as string[]) ||
    (currentStep?.data?.nfaStates as string[]) ||
    [];

  const subsetContainsAccepting = activeSubset.some(s => nfa.acceptingStates.includes(s));

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

  // DFA transition table helper
  function getDfaCell(from: string, sym: string): string {
    return dfa?.transitions.find(t => t.from === from && t.symbol === sym)?.to || '∅';
  }

  // Map dfaState -> nfaStates for canvas labels
  const dfaSubsetsMap: Record<string, string[]> = {};
  for (const m of subsetMapping) {
    dfaSubsetsMap[m.dfaState] = m.nfaStates;
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
            <h2 style={{ fontWeight: 800, color: '#e2e8f0', fontSize: '1.1rem' }}>NFA → DFA Conversion</h2>
            <span className="badge badge-blue">Subset Construction</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Determinization via powerset state subsets and subset acceptance criterion
          </p>
        </div>
        <div className="tab-bar">
          {(['steps', 'mapping', 'dfa-table', 'dfa-graph'] as const).map(tab => (
            <div
              key={tab}
              className={`tab-item ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'steps'
                ? 'Step-by-Step'
                : tab === 'mapping'
                ? 'Subset Mapping'
                : tab === 'dfa-table'
                ? 'DFA Table'
                : 'DFA Graph'}
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
        {activeTab === 'steps' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Real-time Subset Acceptance Callout (Requirement 6) */}
            {activeSubset.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card"
                style={{
                  padding: '0.8rem 1.25rem',
                  border: subsetContainsAccepting
                    ? '1px solid rgba(16, 185, 129, 0.45)'
                    : '1px solid rgba(59, 130, 246, 0.3)',
                  background: subsetContainsAccepting
                    ? 'linear-gradient(135deg, rgba(6, 78, 59, 0.35) 0%, rgba(13, 22, 41, 0.8) 100%)'
                    : 'rgba(13, 22, 41, 0.7)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                  <span style={{ fontWeight: 800, color: subsetContainsAccepting ? '#34d399' : '#60a5fa', fontSize: '0.9rem' }}>
                    Current Subset: &#123;{activeSubset.join(', ')}&#125;
                  </span>
                  {subsetContainsAccepting ? (
                    <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>
                      <Sparkles size={11} /> ACCEPTING DFA STATE
                    </span>
                  ) : (
                    <span className="badge badge-blue" style={{ fontSize: '0.72rem' }}>
                      Non-Accepting Subset
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.825rem', color: '#cbd5e1' }}>
                  {subsetContainsAccepting ? (
                    <>
                      Subset contains accepting NFA state(s){' '}
                      <strong style={{ color: '#34d399' }}>
                        &#123;{activeSubset.filter(s => nfa.acceptingStates.includes(s)).join(', ')}&#125;
                      </strong>{' '}
                      ∈ F_NFA. Therefore, this DFA state is marked as <strong>ACCEPTING</strong>.
                    </>
                  ) : (
                    'None of the states in this subset belong to F_NFA. This DFA state is not accepting.'
                  )}
                </p>
              </motion.div>
            )}

            {/* Graphs side-by-side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.4rem', fontWeight: 600 }}>
                  NFA (Input — Subset states highlighted)
                </div>
                <AutomatonCanvas
                  automaton={nfa}
                  highlightedStates={activeSubset.length > 0 ? activeSubset : highlightedStates}
                  selectedState={selectedDfaState}
                  onStateClick={setSelectedDfaState}
                  height={220}
                />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.4rem', fontWeight: 600 }}>
                  DFA (Generated — {dfa?.states.length || 0} states)
                </div>
                <AutomatonCanvas
                  automaton={dfa || { states: [], alphabet: [], initialState: '', acceptingStates: [], transitions: [] }}
                  highlightedStates={currentDfaLabel ? [currentDfaLabel] : []}
                  selectedState={selectedDfaState}
                  onStateClick={setSelectedDfaState}
                  dfaSubsets={dfaSubsetsMap}
                  height={220}
                />
              </div>
            </div>

            {/* Interactive Final-State Inspector */}
            {selectedDfaState && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <FinalStateInspector
                  stateId={selectedDfaState}
                  automaton={dfa || nfa}
                  automatonType="dfa"
                  dfaMapping={subsetMapping}
                  dfaSubsets={dfaSubsetsMap}
                  originalAcceptingStates={nfa.acceptingStates}
                  onClose={() => setSelectedDfaState(null)}
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
                    <h3 style={{ color: '#22d3ee', fontWeight: 700 }}>{currentStep.title}</h3>
                  </div>
                  <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.7 }}>{currentStep.description}</p>

                  {Boolean(currentStep.data?.nextStates) && (
                    <div className="formula-block" style={{ marginTop: '0.75rem' }}>
                      δ_DFA({String(currentStep.data?.from || '')}, {String(currentStep.data?.symbol || '')}) = &#123;{Array.isArray(currentStep.data?.nextStates) ? (currentStep.data.nextStates as string[]).join(', ') : ''}&#125; → {String(currentStep.data?.to || '')}
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

        {activeTab === 'mapping' && (
          <div>
            <h3 style={{ color: '#22d3ee', fontWeight: 700, marginBottom: '1rem' }}>
              DFA State → NFA Subset Mapping
            </h3>
            <table className="automaton-table">
              <thead>
                <tr>
                  <th>DFA State</th>
                  <th>NFA States (Subset)</th>
                  <th>Initial?</th>
                  <th>Accepting?</th>
                  <th>Dead?</th>
                </tr>
              </thead>
              <tbody>
                {subsetMapping.map(m => (
                  <tr key={m.dfaState}>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>{m.dfaState}</td>
                    <td>{m.nfaStates.length > 0 ? `{${m.nfaStates.join(', ')}}` : '∅'}</td>
                    <td>{m.isInitial ? <span className="badge badge-violet">Yes</span> : '–'}</td>
                    <td>{m.isAccepting ? <span className="badge badge-green">Yes</span> : '–'}</td>
                    <td>{m.isDead ? <span className="badge badge-red">Yes</span> : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'dfa-table' && dfa && (
          <div>
            <h3 style={{ color: '#22d3ee', fontWeight: 700, marginBottom: '1rem' }}>DFA Transition Table</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="automaton-table">
                <thead>
                  <tr>
                    <th>DFA State</th>
                    {dfa.alphabet.map(sym => <th key={sym}>{sym}</th>)}
                    <th>Accepting?</th>
                  </tr>
                </thead>
                <tbody>
                  {dfa.states.map(s => {
                    const mapping = subsetMapping.find(m => m.dfaState === s);
                    return (
                      <tr key={s}>
                        <td className={dfa.initialState === s ? 'table-initial' : dfa.acceptingStates.includes(s) ? 'table-accepting' : ''}>
                          {dfa.initialState === s ? '→ ' : ''}{s}{dfa.acceptingStates.includes(s) ? ' *' : ''}
                        </td>
                        {dfa.alphabet.map(sym => (
                          <td key={sym} className={getDfaCell(s, sym) === '∅' ? 'table-dead' : ''}>
                            {getDfaCell(s, sym)}
                          </td>
                        ))}
                        <td>{mapping?.isAccepting ? <span className="badge badge-green">Yes</span> : '–'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'dfa-graph' && dfa && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ color: '#22d3ee', fontWeight: 700 }}>Generated DFA</h3>
              <span className="badge badge-green">Accepting States: &#123;{dfa.acceptingStates.join(', ')}&#125;</span>
            </div>
            <AutomatonCanvas
              automaton={dfa}
              height={450}
              selectedState={selectedDfaState}
              onStateClick={setSelectedDfaState}
              dfaSubsets={dfaSubsetsMap}
            />
            {selectedDfaState && (
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                <FinalStateInspector
                  stateId={selectedDfaState}
                  automaton={dfa}
                  automatonType="dfa"
                  dfaMapping={subsetMapping}
                  dfaSubsets={dfaSubsetsMap}
                  originalAcceptingStates={nfa.acceptingStates}
                  onClose={() => setSelectedDfaState(null)}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Conversion Completion Modal (Requirement 7) */}
      {dfa && (
        <ConversionCompleteModal
          isOpen={showCompletionModal}
          onClose={() => setShowCompletionModal(false)}
          conversionType="nfa-to-dfa"
          originalAutomaton={nfa}
          convertedAutomaton={dfa}
          onViewResult={() => setActiveTab('dfa-graph')}
          onViewTable={() => setActiveTab('dfa-table')}
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
