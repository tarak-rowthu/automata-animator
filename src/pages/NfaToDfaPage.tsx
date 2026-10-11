import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, RefreshCw, FastForward, Info } from 'lucide-react';
import { Automaton, DFASubsetMapping } from '../types/automaton';
import { nfaToDfa, subsetLabel } from '../algorithms/nfaToDfa';
import { AutomatonCanvas } from '../components/automaton/AutomatonCanvas';

interface NfaToDfaPageProps {
  nfa: Automaton | null;
  onConversionComplete: (dfa: Automaton, mapping: DFASubsetMapping[]) => void;
}

export const NfaToDfaPage: React.FC<NfaToDfaPageProps> = ({ nfa, onConversionComplete }) => {
  const [result, setResult] = useState<ReturnType<typeof nfaToDfa> | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1500);
  const [activeTab, setActiveTab] = useState<'steps' | 'mapping' | 'dfa-table' | 'dfa-graph'>('steps');
  const [selectedDfaState, setSelectedDfaState] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (nfa && nfa.states.length > 0) {
      const r = nfaToDfa(nfa);
      setResult(r);
      setStepIndex(0);
      onConversionComplete(r.dfa, r.subsetMapping);
    }
  }, [nfa?.states.join(','), nfa?.transitions.length]);

  useEffect(() => {
    if (playing && result) {
      intervalRef.current = window.setInterval(() => {
        setStepIndex(i => {
          if (i >= result.steps.length - 1) { setPlaying(false); return i; }
          return i + 1;
        });
      }, speed);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, speed, result]);

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
  const dfaHighlight = highlightedStates.map(s => subsetLabel([s])).filter(l => dfa?.states.includes(l));

  function prev() { setStepIndex(i => Math.max(0, i - 1)); setPlaying(false); }
  function next() { setStepIndex(i => Math.min((result?.steps.length || 1) - 1, i + 1)); }
  function restart() { setStepIndex(0); setPlaying(false); }
  function skipToEnd() { setStepIndex((result?.steps.length || 1) - 1); setPlaying(false); }

  // DFA transition table helper
  function getDfaCell(from: string, sym: string): string {
    return dfa?.transitions.find(t => t.from === from && t.symbol === sym)?.to || '∅';
  }

  // Get subset info for selected DFA state
  const selectedMapping = selectedDfaState ? subsetMapping.find(m => m.dfaState === selectedDfaState) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ fontWeight: 800, color: '#e2e8f0', fontSize: '1.1rem' }}>NFA → DFA Conversion</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Subset construction algorithm</p>
        </div>
        <div className="tab-bar">
          {(['steps', 'mapping', 'dfa-table', 'dfa-graph'] as const).map(tab => (
            <div key={tab} className={`tab-item ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab === 'steps' ? 'Step-by-Step' : tab === 'mapping' ? 'Subset Mapping' : tab === 'dfa-table' ? 'DFA Table' : 'DFA Graph'}
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
        {activeTab === 'steps' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Graphs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.4rem', fontWeight: 600 }}>NFA (Input)</div>
                <AutomatonCanvas automaton={nfa} highlightedStates={highlightedStates} height={220} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.4rem', fontWeight: 600 }}>
                  DFA (Being built — {dfa?.states.length || 0} states)
                </div>
                <AutomatonCanvas
                  automaton={dfa || { states: [], alphabet: [], initialState: '', acceptingStates: [], transitions: [] }}
                  highlightedStates={currentStep?.data?.currentLabel ? [currentStep.data.currentLabel as string] : []}
                  height={220}
                  onStateClick={setSelectedDfaState}
                />
              </div>
            </div>

            {/* Selected DFA state info */}
            {selectedDfaState && selectedMapping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Info size={14} color="#60a5fa" />
                  <span style={{ color: '#60a5fa', fontWeight: 700, fontSize: '0.9rem' }}>DFA State: {selectedDfaState}</span>
                  {selectedMapping.isInitial && <span className="badge badge-violet">Initial</span>}
                  {selectedMapping.isAccepting && <span className="badge badge-green">Accepting</span>}
                  {selectedMapping.isDead && <span className="badge badge-red">Dead</span>}
                  <button onClick={() => setSelectedDfaState(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>✕</button>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  NFA states in this subset: <strong>{selectedMapping.nfaStates.length > 0 ? `{${selectedMapping.nfaStates.join(', ')}}` : '∅'}</strong>
                </p>
              </motion.div>
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
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.7 }}>{currentStep.description}</p>

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
                <button className="btn-secondary" onClick={restart}><RefreshCw size={15} /></button>
                <button className="btn-secondary" onClick={prev} disabled={stepIndex === 0}><SkipBack size={15} /></button>
                <button className="btn-primary" onClick={() => setPlaying(!playing)} style={{ minWidth: 90 }}>
                  {playing ? <><Pause size={15} /> Pause</> : <><Play size={15} /> Play</>}
                </button>
                <button className="btn-secondary" onClick={next} disabled={stepIndex === (result?.steps.length || 1) - 1}><SkipForward size={15} /></button>
                <button className="btn-secondary" onClick={skipToEnd}><FastForward size={15} /></button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Speed</span>
                  <input type="range" min={300} max={3000} step={100} value={speed} onChange={e => setSpeed(Number(e.target.value))} style={{ width: 80 }} />
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{(speed / 1000).toFixed(1)}s</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '3px', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                {result?.steps.map((_, i) => (
                  <div key={i} onClick={() => { setStepIndex(i); setPlaying(false); }} style={{
                    width: 8, height: 8, borderRadius: 2, cursor: 'pointer',
                    background: i < stepIndex ? '#10b981' : i === stepIndex ? '#3b82f6' : 'rgba(59,130,246,0.2)',
                    transition: 'background 0.2s'
                  }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mapping' && (
          <div>
            <h3 style={{ color: '#22d3ee', fontWeight: 700, marginBottom: '1rem' }}>DFA State → NFA Subset Mapping</h3>
            <table className="automaton-table">
              <thead><tr><th>DFA State</th><th>NFA States (Subset)</th><th>Initial?</th><th>Accepting?</th><th>Dead?</th></tr></thead>
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
                          <td key={sym} className={getDfaCell(s, sym) === '∅' ? 'table-dead' : ''}>{getDfaCell(s, sym)}</td>
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
            <h3 style={{ color: '#22d3ee', fontWeight: 700, marginBottom: '1rem' }}>Generated DFA</h3>
            <AutomatonCanvas automaton={dfa} height={450} onStateClick={setSelectedDfaState} />
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.75rem' }}>Click any state to see its NFA subset.</p>
            {selectedDfaState && selectedMapping && (
              <div className="glass-card" style={{ padding: '1rem', marginTop: '0.75rem' }}>
                <strong style={{ color: '#22d3ee' }}>{selectedDfaState}</strong> = NFA states &#123;{selectedMapping.nfaStates.join(', ')}&#125;
                {selectedMapping.isAccepting && <span className="badge badge-green" style={{ marginLeft: '0.5rem' }}>Accepting</span>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
