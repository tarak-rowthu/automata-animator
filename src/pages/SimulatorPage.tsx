import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, RefreshCw, Sparkles, CheckCircle2, XCircle, Info } from 'lucide-react';
import { Automaton, SimulationResult, Transition } from '../types/automaton';
import { simulateEpsilonNfa, simulateNfa, simulateDfa } from '../algorithms/simulation';
import { AutomatonCanvas } from '../components/automaton/AutomatonCanvas';
import { EXAMPLE_TEST_STRINGS } from '../data/exampleAutomaton';
import { testEquivalence } from '../algorithms/equivalenceTesting';
import { SimulationResultModal } from '../components/simulator/SimulationResultModal';
import { CelebrationBanner } from '../components/simulator/CelebrationBanner';
import { FinalStateInspector } from '../components/automaton/FinalStateInspector';

interface SimulatorPageProps {
  epsilonNfa: Automaton;
  nfa: Automaton | null;
  dfa: Automaton | null;
  initialSelected?: 'epsilon-nfa' | 'nfa' | 'dfa';
}

type AutomatonType = 'epsilon-nfa' | 'nfa' | 'dfa';

export const SimulatorPage: React.FC<SimulatorPageProps> = ({
  epsilonNfa,
  nfa,
  dfa,
  initialSelected = 'epsilon-nfa',
}) => {
  const [inputStr, setInputStr] = useState('ab');
  const [selected, setSelected] = useState<AutomatonType>(initialSelected);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [simStep, setSimStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(800);
  const [eqMaxLen, setEqMaxLen] = useState(4);
  const [eqReport, setEqReport] = useState<ReturnType<typeof testEquivalence> | null>(null);
  const [activeTab, setActiveTab] = useState<'sim' | 'compare' | 'equivalence'>('sim');

  // Interactive Inspector & Modals State
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(true);

  const intervalRef = useRef<number | null>(null);

  const currentAutomaton = selected === 'epsilon-nfa' ? epsilonNfa : selected === 'nfa' ? nfa : dfa;

  function simulate() {
    if (!currentAutomaton) return;
    let r: SimulationResult;
    if (selected === 'epsilon-nfa') r = simulateEpsilonNfa(currentAutomaton, inputStr);
    else if (selected === 'nfa') r = simulateNfa(currentAutomaton, inputStr);
    else r = simulateDfa(currentAutomaton, inputStr);

    setResult(r);
    setSimStep(0);
    setPlaying(false);
    setHasShownModal(false);
    setShowCelebration(true);
  }

  // Animation progression loop
  useEffect(() => {
    if (playing && result) {
      intervalRef.current = window.setInterval(() => {
        setSimStep(i => {
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

  // Trigger modal when final step is reached
  useEffect(() => {
    if (result && simStep === result.steps.length - 1 && !hasShownModal) {
      setShowResultModal(true);
      setHasShownModal(true);
    }
  }, [simStep, result, hasShownModal]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setPlaying(p => !p);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (result) setSimStep(i => Math.min(result.steps.length - 1, i + 1));
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setSimStep(i => Math.max(0, i - 1));
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setSimStep(0);
        setPlaying(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [result]);

  function runEquivalence() {
    const r = testEquivalence(epsilonNfa, nfa, dfa, eqMaxLen);
    setEqReport(r);
  }

  const currentSimStep = result?.steps[simStep];
  const activeStates = currentSimStep?.activeStates || [];
  const isFinalStep = Boolean(result && simStep === result.steps.length - 1);
  const isAccepted = Boolean(result?.accepted);

  // Compute active transitions currently traversed
  const activeTransitions: Transition[] = [];
  if (currentSimStep?.transition && currentAutomaton) {
    const { from, symbol, to } = currentSimStep.transition;
    for (const t of currentAutomaton.transitions) {
      if (from.includes(t.from) && to.includes(t.to)) {
        if (t.symbol === symbol || (symbol === null && t.symbol === 'ε')) {
          activeTransitions.push(t);
        }
      }
    }
  }

  // Active accepting states in current step
  const activeAcceptingStates = activeStates.filter(s =>
    currentAutomaton?.acceptingStates.includes(s)
  );

  // Compare all 3
  const compareResults = EXAMPLE_TEST_STRINGS.map(s => ({
    str: s,
    epsilonNfa: epsilonNfa.states.length > 0 ? simulateEpsilonNfa(epsilonNfa, s).accepted : null,
    nfaRes: nfa && nfa.states.length > 0 ? simulateNfa(nfa, s).accepted : null,
    dfaRes: dfa && dfa.states.length > 0 ? simulateDfa(dfa, s).accepted : null,
  }));

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
            <h2 style={{ fontWeight: 800, color: '#e2e8f0', fontSize: '1.1rem' }}>
              String Simulator & State Transition Animator
            </h2>
            <span className="badge badge-blue">Interactive Visualizer</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Simulate input strings step-by-step with animated state transitions and accepting state effects
          </p>
        </div>
        <div className="tab-bar">
          {(['sim', 'compare', 'equivalence'] as const).map(tab => (
            <div
              key={tab}
              className={`tab-item ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'sim' ? 'Simulate' : tab === 'compare' ? 'Compare All' : 'Equivalence Test'}
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
        {activeTab === 'sim' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Input Controls */}
            <div className="glass-card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.35rem' }}>
                    Input String
                  </label>
                  <input
                    className="input-field"
                    value={inputStr}
                    onChange={e => setInputStr(e.target.value)}
                    placeholder="Enter string (leave empty for ε)"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                    onKeyDown={e => e.key === 'Enter' && simulate()}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.35rem' }}>
                    Automaton
                  </label>
                  <select
                    className="input-field"
                    value={selected}
                    onChange={e => setSelected(e.target.value as AutomatonType)}
                    style={{ width: 'auto' }}
                  >
                    <option value="epsilon-nfa">ε-NFA</option>
                    <option value="nfa" disabled={!nfa}>NFA {!nfa ? '(not converted)' : ''}</option>
                    <option value="dfa" disabled={!dfa}>DFA {!dfa ? '(not converted)' : ''}</option>
                  </select>
                </div>
                <button className="btn-primary" onClick={simulate}>
                  <Play size={14} /> Simulate
                </button>
              </div>

              {/* Quick test strings */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.75rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#475569' }}>Quick test:</span>
                {EXAMPLE_TEST_STRINGS.map(s => (
                  <button
                    key={s}
                    onClick={() => {
                      setInputStr(s);
                    }}
                    className="badge badge-blue"
                    style={{ cursor: 'pointer', border: 'none', fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {s === '' ? 'ε' : s}
                  </button>
                ))}
              </div>
            </div>

            {/* Final State Celebration Banner */}
            {isFinalStep && isAccepted && showCelebration && (
              <CelebrationBanner
                inputString={inputStr}
                symbolsProcessed={inputStr.length}
                finalActiveStates={activeStates}
                acceptingStatesReached={activeAcceptingStates}
                onDismiss={() => setShowCelebration(false)}
                onInspectGraph={() => {
                  if (activeAcceptingStates.length > 0) {
                    setSelectedState(activeAcceptingStates[0]);
                  }
                }}
              />
            )}

            {/* Automaton Canvas with Animated State Transitions & Accepting States */}
            {currentAutomaton && (
              <div style={{ position: 'relative' }}>
                <AutomatonCanvas
                  automaton={currentAutomaton}
                  activeStates={activeStates}
                  activeTransitions={activeTransitions}
                  selectedState={selectedState}
                  onStateClick={stateId => setSelectedState(stateId)}
                  height={280}
                  isPaused={!playing}
                  isFinalCelebration={isFinalStep && isAccepted}
                />

                {/* State Inspector Drawer / Overlay */}
                {selectedState && (
                  <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 20 }}>
                    <FinalStateInspector
                      stateId={selectedState}
                      automaton={currentAutomaton}
                      activeStates={activeStates}
                      automatonType={selected}
                      originalAcceptingStates={epsilonNfa.acceptingStates}
                      onClose={() => setSelectedState(null)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Simulation Trace & Input Progress */}
            {result && (
              <>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={simStep}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="glass-card"
                    style={{ padding: '1rem' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="badge badge-blue">
                          Step {simStep + 1} of {result.steps.length}
                        </span>
                        {currentSimStep?.symbol && (
                          <span
                            style={{
                              fontFamily: 'JetBrains Mono, monospace',
                              color: '#fbbf24',
                              fontSize: '0.95rem',
                              fontWeight: 700,
                              background: 'rgba(251,191,36,0.1)',
                              padding: '2px 6px',
                              borderRadius: 4,
                            }}
                          >
                            Consuming symbol '{currentSimStep.symbol}'
                          </span>
                        )}
                        {!isFinalStep ? (
                          <span className="badge badge-violet" style={{ fontSize: '0.72rem' }}>
                            SIMULATION IN PROGRESS
                          </span>
                        ) : (
                          <span className={isAccepted ? 'badge badge-green' : 'badge badge-red'} style={{ fontSize: '0.72rem' }}>
                            {isAccepted ? 'FINAL STEP — ACCEPTED' : 'FINAL STEP — REJECTED'}
                          </span>
                        )}
                      </div>

                      {/* State Inspector Quick Trigger */}
                      <button
                        onClick={() => {
                          if (activeStates.length > 0) {
                            setSelectedState(activeStates[0]);
                          }
                        }}
                        className="btn-secondary"
                        style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                        disabled={activeStates.length === 0}
                      >
                        <Info size={12} /> Inspect Active State
                      </button>
                    </div>

                    <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                      {currentSimStep?.description}
                    </p>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.65rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Active States:</span>
                      {activeStates.length > 0 ? (
                        activeStates.map(s => {
                          const isAcc = currentAutomaton?.acceptingStates.includes(s);
                          return (
                            <button
                              key={s}
                              onClick={() => setSelectedState(s)}
                              className={isAcc ? 'badge badge-green' : 'badge badge-blue'}
                              style={{ cursor: 'pointer', border: 'none' }}
                              title="Click to inspect this state"
                            >
                              {s} {isAcc ? '★ (Accepting)' : ''}
                            </button>
                          );
                        })
                      ) : (
                        <span className="badge badge-red">∅ (Dead / Empty Set)</span>
                      )}

                      {/* Active accepting state callout */}
                      {activeAcceptingStates.length > 0 && (
                        <span style={{ fontSize: '0.75rem', color: '#34d399', marginLeft: 'auto', fontWeight: 600 }}>
                          ✓ Accepting state reached: {activeAcceptingStates.join(', ')}
                        </span>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Animated Input String Ticker */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Input tape:</span>
                  {(inputStr || 'ε').split('').map((ch, i) => {
                    const isCurrent = i === simStep - 1;
                    const isProcessed = i < simStep - 1;
                    return (
                      <div
                        key={i}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 6,
                          background: isCurrent
                            ? 'rgba(251,191,36,0.2)'
                            : isProcessed
                            ? 'rgba(16,185,129,0.15)'
                            : 'rgba(59,130,246,0.08)',
                          border: `1.5px solid ${
                            isCurrent ? '#fbbf24' : isProcessed ? '#10b981' : 'rgba(59,130,246,0.2)'
                          }`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: isCurrent ? '#fbbf24' : isProcessed ? '#34d399' : '#64748b',
                          boxShadow: isCurrent ? '0 0 12px rgba(251,191,36,0.3)' : undefined,
                          transition: 'all 0.25s',
                        }}
                      >
                        {ch}
                      </div>
                    );
                  })}
                </div>

                {/* Animation & Step Controls */}
                <div className="glass-card" style={{ padding: '0.75rem 1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setSimStep(0);
                        setPlaying(false);
                      }}
                      title="Restart simulation (R)"
                    >
                      <RefreshCw size={14} /> Restart
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => setSimStep(i => Math.max(0, i - 1))}
                      disabled={simStep === 0}
                      title="Previous Step (Left Arrow)"
                    >
                      <SkipBack size={14} /> Prev
                    </button>
                    <button
                      className="btn-primary"
                      onClick={() => setPlaying(!playing)}
                      style={{ minWidth: 95 }}
                      title="Play / Pause (Space)"
                    >
                      {playing ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Play</>}
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => setSimStep(i => Math.min(result.steps.length - 1, i + 1))}
                      disabled={simStep === result.steps.length - 1}
                      title="Next Step (Right Arrow)"
                    >
                      Next <SkipForward size={14} />
                    </button>

                    {/* Speed slider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Speed:</span>
                      <input
                        type="range"
                        min={200}
                        max={2000}
                        step={100}
                        value={speed}
                        onChange={e => setSpeed(Number(e.target.value))}
                        style={{ width: 80 }}
                      />
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', minWidth: 32 }}>
                        {(speed / 1000).toFixed(1)}s
                      </span>
                    </div>

                    {/* Button to reopen result modal if closed */}
                    {isFinalStep && (
                      <button
                        onClick={() => setShowResultModal(true)}
                        className="btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                      >
                        Result Modal
                      </button>
                    )}
                  </div>
                </div>

                {/* Final Result Card when simulation completes */}
                {isFinalStep && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={isAccepted ? 'result-accepted' : 'result-rejected'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      {isAccepted ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                      <span>{isAccepted ? '✓ STRING ACCEPTED' : '✗ STRING REJECTED'}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 400, marginTop: '0.4rem', opacity: 0.9 }}>
                      {result.explanation}
                    </div>
                  </motion.div>
                )}
              </>
            )}

            {/* Innovative Success / Rejection Modal */}
            <SimulationResultModal
              isOpen={showResultModal}
              onClose={() => setShowResultModal(false)}
              result={result}
              inputString={inputStr}
              automaton={currentAutomaton || epsilonNfa}
              automatonType={selected}
              onTestAnotherString={() => {
                setShowResultModal(false);
              }}
              onViewSimulation={() => {
                setShowResultModal(false);
              }}
            />
          </div>
        )}

        {/* Compare All Automata Tab */}
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
                      <td>
                        {e !== null ? (
                          e ? <span className="badge badge-green">Accept</span> : <span className="badge badge-red">Reject</span>
                        ) : '–'}
                      </td>
                      <td>
                        {n !== null ? (
                          n ? <span className="badge badge-green">Accept</span> : <span className="badge badge-red">Reject</span>
                        ) : '–'}
                      </td>
                      <td>
                        {d !== null ? (
                          d ? <span className="badge badge-green">Accept</span> : <span className="badge badge-red">Reject</span>
                        ) : '–'}
                      </td>
                      <td>
                        {agree ? (
                          <span className="badge badge-green">✓</span>
                        ) : (
                          <span className="badge badge-red">✗ MISMATCH</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Automated Equivalence Testing Tab */}
        {activeTab === 'equivalence' && (
          <div>
            <h3 style={{ color: '#60a5fa', fontWeight: 700, marginBottom: '0.75rem' }}>
              Automated Equivalence Testing
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem', lineHeight: 1.6 }}>
              Generate all strings up to a given length and compare acceptance across all three automata.
              This is bounded testing — not a formal proof of equivalence.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Max string length:</label>
              <input
                type="number"
                min={1}
                max={8}
                value={eqMaxLen}
                onChange={e => setEqMaxLen(Number(e.target.value))}
                className="input-field"
                style={{ width: 70 }}
              />
              <button className="btn-primary" onClick={runEquivalence}>Run Test</button>
            </div>
            {eqReport && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div
                  className={eqReport.allAgree ? 'result-accepted' : 'result-rejected'}
                  style={{ marginBottom: '1rem' }}
                >
                  {eqReport.allAgree
                    ? `✓ All ${eqReport.tested} strings agree across all automata`
                    : `✗ ${eqReport.mismatches.length} mismatch(es) found in ${eqReport.tested} tested strings`}
                </div>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
                  {eqReport.boundedNote}
                </p>
                {eqReport.mismatches.length > 0 && (
                  <table className="automaton-table">
                    <thead>
                      <tr><th>String</th><th>ε-NFA</th><th>NFA</th><th>DFA</th></tr>
                    </thead>
                    <tbody>
                      {eqReport.mismatches.map(m => (
                        <tr key={m.string}>
                          <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>{m.string || 'ε'}</td>
                          <td>
                            {m.epsilonNfaResult ? (
                              <span className="badge badge-green">Accept</span>
                            ) : (
                              <span className="badge badge-red">Reject</span>
                            )}
                          </td>
                          <td>
                            {m.nfaResult !== null ? (
                              m.nfaResult ? (
                                <span className="badge badge-green">Accept</span>
                              ) : (
                                <span className="badge badge-red">Reject</span>
                              )
                            ) : '–'}
                          </td>
                          <td>
                            {m.dfaResult !== null ? (
                              m.dfaResult ? (
                                <span className="badge badge-green">Accept</span>
                              ) : (
                                <span className="badge badge-red">Reject</span>
                              )
                            ) : '–'}
                          </td>
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
