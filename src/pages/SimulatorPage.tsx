import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, RefreshCw } from 'lucide-react';
import { Automaton, SimulationResult } from '../types/automaton';
import { simulateEpsilonNfa, simulateNfa, simulateDfa } from '../algorithms/simulation';
import { AutomatonCanvas } from '../components/automaton/AutomatonCanvas';
import { EXAMPLE_TEST_STRINGS } from '../data/exampleAutomaton';
import { testEquivalence } from '../algorithms/equivalenceTesting';

interface SimulatorPageProps {
  epsilonNfa: Automaton;
  nfa: Automaton | null;
  dfa: Automaton | null;
}

type AutomatonType = 'epsilon-nfa' | 'nfa' | 'dfa';

export const SimulatorPage: React.FC<SimulatorPageProps> = ({ epsilonNfa, nfa, dfa }) => {
  const [inputStr, setInputStr] = useState('ab');
  const [selected, setSelected] = useState<AutomatonType>('epsilon-nfa');
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [simStep, setSimStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(800);
  const [eqMaxLen, setEqMaxLen] = useState(4);
  const [eqReport, setEqReport] = useState<ReturnType<typeof testEquivalence> | null>(null);
  const intervalRef = useRef<number | null>(null);
  const [activeTab, setActiveTab] = useState<'sim' | 'compare' | 'equivalence'>('sim');

  function simulate() {
    const aut = selected === 'epsilon-nfa' ? epsilonNfa : selected === 'nfa' ? nfa : dfa;
    if (!aut) return;
    let r: SimulationResult;
    if (selected === 'epsilon-nfa') r = simulateEpsilonNfa(aut, inputStr);
    else if (selected === 'nfa') r = simulateNfa(aut, inputStr);
    else r = simulateDfa(aut, inputStr);
    setResult(r);
    setSimStep(0);
    setPlaying(false);
  }

  useEffect(() => {
    if (playing && result) {
      intervalRef.current = window.setInterval(() => {
        setSimStep(i => {
          if (i >= result.steps.length - 1) { setPlaying(false); return i; }
          return i + 1;
        });
      }, speed);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, speed, result]);

  function runEquivalence() {
    const r = testEquivalence(epsilonNfa, nfa, dfa, eqMaxLen);
    setEqReport(r);
  }

  const currentSimStep = result?.steps[simStep];
  const activeStates = currentSimStep?.activeStates || [];

  // Compare all 3
  const compareResults = EXAMPLE_TEST_STRINGS.map(s => ({
    str: s,
    epsilonNfa: epsilonNfa.states.length > 0 ? simulateEpsilonNfa(epsilonNfa, s).accepted : null,
    nfaRes: nfa && nfa.states.length > 0 ? simulateNfa(nfa, s).accepted : null,
    dfaRes: dfa && dfa.states.length > 0 ? simulateDfa(dfa, s).accepted : null,
  }));

  const currentAutomaton = selected === 'epsilon-nfa' ? epsilonNfa : selected === 'nfa' ? nfa : dfa;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ fontWeight: 800, color: '#e2e8f0', fontSize: '1.1rem' }}>String Simulator</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Test strings against all automata</p>
        </div>
        <div className="tab-bar">
          {(['sim', 'compare', 'equivalence'] as const).map(tab => (
            <div key={tab} className={`tab-item ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab === 'sim' ? 'Simulate' : tab === 'compare' ? 'Compare All' : 'Equivalence Test'}
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
        {activeTab === 'sim' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Input */}
            <div className="glass-card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.35rem' }}>Input String</label>
                  <input
                    className="input-field"
                    value={inputStr}
                    onChange={e => setInputStr(e.target.value)}
                    placeholder="Enter string (leave empty for ε)"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.35rem' }}>Automaton</label>
                  <select className="input-field" value={selected} onChange={e => setSelected(e.target.value as AutomatonType)} style={{ width: 'auto' }}>
                    <option value="epsilon-nfa">ε-NFA</option>
                    <option value="nfa" disabled={!nfa}>NFA {!nfa ? '(not converted)' : ''}</option>
                    <option value="dfa" disabled={!dfa}>DFA {!dfa ? '(not converted)' : ''}</option>
                  </select>
                </div>
                <button className="btn-primary" onClick={simulate}>Simulate</button>
              </div>

              {/* Quick strings */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.75rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#475569' }}>Quick test:</span>
                {EXAMPLE_TEST_STRINGS.map(s => (
                  <button
                    key={s}
                    onClick={() => setInputStr(s)}
                    className="badge badge-blue"
                    style={{ cursor: 'pointer', border: 'none', fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {s === '' ? 'ε' : s}
                  </button>
                ))}
              </div>
            </div>

            {/* Canvas */}
            {currentAutomaton && (
              <AutomatonCanvas
                automaton={currentAutomaton}
                activeStates={activeStates}
                height={260}
              />
            )}

            {/* Simulation trace */}
            {result && (
              <>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={simStep}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card"
                    style={{ padding: '1rem' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span className="badge badge-blue">Step {simStep + 1}/{result.steps.length}</span>
                      {currentSimStep?.symbol && (
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#fbbf24', fontSize: '1rem' }}>
                          '{currentSimStep.symbol}'
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6 }}>{currentSimStep?.description}</p>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Active:</span>
                      {activeStates.length > 0
                        ? activeStates.map(s => <span key={s} className="badge badge-blue">{s}</span>)
                        : <span className="badge badge-red">∅</span>}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Input display */}
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {(inputStr || 'ε').split('').map((ch, i) => (
                    <div key={i} style={{
                      width: 32, height: 32, borderRadius: 6,
                      background: i === simStep - 1 ? 'rgba(251,191,36,0.2)' : i < simStep - 1 ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.08)',
                      border: `1px solid ${i === simStep - 1 ? '#fbbf24' : i < simStep - 1 ? '#10b981' : 'rgba(59,130,246,0.2)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem',
                      color: i === simStep - 1 ? '#fbbf24' : i < simStep - 1 ? '#34d399' : '#64748b',
                      transition: 'all 0.2s'
                    }}>{ch}</div>
                  ))}
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button className="btn-secondary" onClick={() => { setSimStep(0); setPlaying(false); }}><RefreshCw size={14} /></button>
                  <button className="btn-secondary" onClick={() => setSimStep(i => Math.max(0, i - 1))} disabled={simStep === 0}><SkipBack size={14} /></button>
                  <button className="btn-primary" onClick={() => setPlaying(!playing)} style={{ minWidth: 80 }}>
                    {playing ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Play</>}
                  </button>
                  <button className="btn-secondary" onClick={() => setSimStep(i => Math.min(result.steps.length - 1, i + 1))} disabled={simStep === result.steps.length - 1}><SkipForward size={14} /></button>
                  <input type="range" min={200} max={2000} step={100} value={speed} onChange={e => setSpeed(Number(e.target.value))} style={{ width: 70 }} />
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{(speed / 1000).toFixed(1)}s</span>
                </div>

                {/* Final result */}
                {simStep === result.steps.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={result.accepted ? 'result-accepted' : 'result-rejected'}
                  >
                    {result.accepted ? '✓ STRING ACCEPTED' : '✗ STRING REJECTED'}
                    <div style={{ fontSize: '0.85rem', fontWeight: 400, marginTop: '0.4rem', opacity: 0.8 }}>
                      {result.explanation}
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'compare' && (
          <div>
            <h3 style={{ color: '#60a5fa', fontWeight: 700, marginBottom: '1rem' }}>Compare All Automata</h3>
            <table className="automaton-table">
              <thead>
                <tr>
                  <th>String</th>
                  <th>ε-NFA</th>
                  <th>NFA</th>
                  <th>DFA</th>
                  <th>Agreement</th>
                </tr>
              </thead>
              <tbody>
                {compareResults.map(({ str, epsilonNfa: e, nfaRes: n, dfaRes: d }) => {
                  const agree = (n === null || e === n) && (d === null || e === d);
                  return (
                    <tr key={str}>
                      <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>{str === '' ? 'ε' : str}</td>
                      <td>{e !== null ? (e ? <span className="badge badge-green">Accept</span> : <span className="badge badge-red">Reject</span>) : '–'}</td>
                      <td>{n !== null ? (n ? <span className="badge badge-green">Accept</span> : <span className="badge badge-red">Reject</span>) : '–'}</td>
                      <td>{d !== null ? (d ? <span className="badge badge-green">Accept</span> : <span className="badge badge-red">Reject</span>) : '–'}</td>
                      <td>{agree ? <span className="badge badge-green">✓</span> : <span className="badge badge-red">✗ MISMATCH</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'equivalence' && (
          <div>
            <h3 style={{ color: '#60a5fa', fontWeight: 700, marginBottom: '0.75rem' }}>Automated Equivalence Testing</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem', lineHeight: 1.6 }}>
              Generate all strings up to a given length and compare acceptance across all three automata.
              This is bounded testing — not a formal proof of equivalence.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Max string length:</label>
              <input type="number" min={1} max={8} value={eqMaxLen} onChange={e => setEqMaxLen(Number(e.target.value))}
                className="input-field" style={{ width: 70 }} />
              <button className="btn-primary" onClick={runEquivalence}>Run Test</button>
            </div>
            {eqReport && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className={eqReport.allAgree ? 'result-accepted' : 'result-rejected'} style={{ marginBottom: '1rem' }}>
                  {eqReport.allAgree
                    ? `✓ All ${eqReport.tested} strings agree across all automata`
                    : `✗ ${eqReport.mismatches.length} mismatch(es) found in ${eqReport.tested} tested strings`}
                </div>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>{eqReport.boundedNote}</p>
                {eqReport.mismatches.length > 0 && (
                  <table className="automaton-table">
                    <thead><tr><th>String</th><th>ε-NFA</th><th>NFA</th><th>DFA</th></tr></thead>
                    <tbody>
                      {eqReport.mismatches.map(m => (
                        <tr key={m.string}>
                          <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>{m.string || 'ε'}</td>
                          <td>{m.epsilonNfaResult ? <span className="badge badge-green">Accept</span> : <span className="badge badge-red">Reject</span>}</td>
                          <td>{m.nfaResult !== null ? (m.nfaResult ? <span className="badge badge-green">Accept</span> : <span className="badge badge-red">Reject</span>) : '–'}</td>
                          <td>{m.dfaResult !== null ? (m.dfaResult ? <span className="badge badge-green">Accept</span> : <span className="badge badge-red">Reject</span>) : '–'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
