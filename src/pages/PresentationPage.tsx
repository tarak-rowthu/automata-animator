import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { Automaton, DFASubsetMapping, EpsilonClosureMap } from '../types/automaton';
import { AutomatonCanvas } from '../components/automaton/AutomatonCanvas';
import { computeAllEpsilonClosures } from '../algorithms/epsilonClosure';
import { EXAMPLE_AUTOMATON } from '../data/exampleAutomaton';
import { epsilonNfaToNfa } from '../algorithms/epsilonNfaToNfa';
import { nfaToDfa } from '../algorithms/nfaToDfa';
import { simulateEpsilonNfa } from '../algorithms/simulation';

interface PresentationPageProps {
  automaton: Automaton;
  nfa: Automaton | null;
  dfa: Automaton | null;
  epsilonClosures: EpsilonClosureMap | null;
  dfaMapping: DFASubsetMapping[] | null;
}

const SAMPLE_STRINGS = ['', 'a', 'b', 'ab', 'aab', 'abb'];

export const PresentationPage: React.FC<PresentationPageProps> = ({
  automaton: propAutomaton, nfa: propNfa, dfa: propDfa, epsilonClosures: propClosures, dfaMapping: propMapping
}) => {
  const [slide, setSlide] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [simString, setSimString] = useState('ab');

  // Use example automaton if none built
  const automaton = propAutomaton.states.length > 0 ? propAutomaton : EXAMPLE_AUTOMATON;

  // Compute if not available
  const nfaResult = React.useMemo(() => epsilonNfaToNfa(automaton), [automaton.states.join(',')]);
  const nfa = propNfa || nfaResult.nfa;
  const epsilonClosures = propClosures || nfaResult.epsilonClosures;
  const dfaResult = React.useMemo(() => nfaToDfa(nfa), [nfa.states.join(',')]);
  const dfa = propDfa || dfaResult.dfa;
  const dfaMapping = propMapping || dfaResult.subsetMapping;

  const simResult = React.useMemo(() => simulateEpsilonNfa(automaton, simString), [automaton, simString]);

  const SLIDES = [
    {
      title: 'Automata Animator',
      subtitle: 'Visualize. Convert. Simulate. Recognize.',
      content: (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '2rem', lineHeight: 1.7 }}>
            An Interactive Tool for Formal Languages & Automata Theory
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', maxWidth: 700, margin: '0 auto' }}>
            {['ε-NFA','NFA','DFA'].map((label, i) => (
              <div key={label} className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900 }} className="gradient-text">{label}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.4rem' }}>
                  {['Epsilon NFA', 'Converted NFA', 'Subset DFA'][i]}
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'The ε-NFA',
      subtitle: `States: {${automaton.states.join(', ')}} — Alphabet: {${automaton.alphabet.join(', ')}}`,
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
          <AutomatonCanvas automaton={automaton} height={280} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="formula-block">Initial state: {automaton.initialState}</div>
            <div className="formula-block">Accepting states: &#123;{automaton.acceptingStates.join(', ')}&#125;</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="automaton-table" style={{ fontSize: '0.85rem' }}>
                <thead><tr><th>From</th><th>Symbol</th><th>To</th></tr></thead>
                <tbody>
                  {automaton.transitions.map((t, i) => (
                    <tr key={i}>
                      <td>{t.from}</td>
                      <td style={{ color: t.symbol === 'ε' ? '#a78bfa' : '#94a3b8' }}>{t.symbol}</td>
                      <td>{t.to}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Computing Epsilon Closures',
      subtitle: 'ε-closure(q) = all states reachable from q via ε-transitions',
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <div className="formula-block" style={{ marginBottom: '1rem' }}>
              {'ε-closure(q) = smallest S such that:\n(1) q ∈ S\n(2) r ∈ S ∧ r →ε s ⟹ s ∈ S'}
            </div>
            <table className="automaton-table">
              <thead><tr><th>State</th><th>ε-Closure</th></tr></thead>
              <tbody>
                {automaton.states.map(s => (
                  <tr key={s}>
                    <td>{s}</td>
                    <td>&#123;{(epsilonClosures?.[s] || []).join(', ')}&#125;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AutomatonCanvas automaton={automaton} highlightedStates={[automaton.states[0] || '']} height={260} />
        </div>
      ),
    },
    {
      title: 'Converting ε-NFA → NFA',
      subtitle: "δ'(q, a) = ε-closure(⋃ δ(p, a) for p ∈ ε-closure(q))",
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <div className="formula-block" style={{ marginBottom: '1rem' }}>
              {"F' = {q | ε-closure(q) ∩ F ≠ ∅}\nNew accepting: {" + nfa.acceptingStates.join(', ') + '}'}
            </div>
            <table className="automaton-table">
              <thead>
                <tr><th>State</th>{nfa.alphabet.map(s => <th key={s}>{s}</th>)}</tr>
              </thead>
              <tbody>
                {nfa.states.map(state => (
                  <tr key={state}>
                    <td style={{ color: nfa.acceptingStates.includes(state) ? '#34d399' : '#94a3b8' }}>
                      {nfa.initialState === state ? '→ ' : ''}{state}{nfa.acceptingStates.includes(state) ? ' *' : ''}
                    </td>
                    {nfa.alphabet.map(sym => {
                      const targets = nfa.transitions.filter(t => t.from === state && t.symbol === sym).map(t => t.to);
                      return <td key={sym}>{targets.length ? `{${targets.join(',')}}` : '∅'}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AutomatonCanvas automaton={nfa} height={260} />
        </div>
      ),
    },
    {
      title: 'New Accepting States',
      subtitle: "A state is accepting if its ε-closure reaches any accepting state of the original ε-NFA",
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <div className="formula-block" style={{ maxWidth: 600, width: '100%', textAlign: 'center' }}>
            {"F' = {q ∈ Q | ε-closure(q) ∩ F ≠ ∅}\n\nOriginal accepting: {" + automaton.acceptingStates.join(', ') + '}\nNew accepting: {' + nfa.acceptingStates.join(', ') + '}'}
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {automaton.states.map(s => {
              const hasAcceptingInClosure = (epsilonClosures?.[s] || []).some(x => automaton.acceptingStates.includes(x));
              return (
                <div key={s} className="glass-card" style={{ padding: '1rem', textAlign: 'center', minWidth: 130 }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: hasAcceptingInClosure ? '#34d399' : '#60a5fa', marginBottom: '0.4rem' }}>{s}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ε-closure: &#123;{(epsilonClosures?.[s] || []).join(', ')}&#125;</div>
                  <div style={{ marginTop: '0.4rem' }}>
                    {hasAcceptingInClosure ? <span className="badge badge-green">Accepting</span> : <span className="badge badge-red">Not Accepting</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ),
    },
    {
      title: 'Subset Construction (NFA → DFA)',
      subtitle: 'Each DFA state = a subset of NFA states',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="formula-block">
            {'δ_DFA(S, a) = ⋃ δ_NFA(q, a) for every q ∈ S\n\nDFA initial state: {' + nfa.initialState + '}'}
          </div>
          <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto' }}>
            <table className="automaton-table" style={{ minWidth: 400 }}>
              <thead>
                <tr><th>DFA State</th><th>NFA Subset</th>{dfa.alphabet.map(s => <th key={s}>{s}</th>)}<th>Accept</th></tr>
              </thead>
              <tbody>
                {dfa.states.map(s => {
                  const mapping = dfaMapping?.find(m => m.dfaState === s);
                  return (
                    <tr key={s}>
                      <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>{s}</td>
                      <td>&#123;{mapping?.nfaStates.join(',') || ''}&#125;</td>
                      {dfa.alphabet.map(sym => {
                        const to = dfa.transitions.find(t => t.from === s && t.symbol === sym)?.to || '∅';
                        return <td key={sym} style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace' }}>{to}</td>;
                      })}
                      <td>{mapping?.isAccepting ? '✓' : '–'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ),
    },
    {
      title: 'The Generated DFA',
      subtitle: `${dfa.states.length} states — Accepts the same language as the original ε-NFA`,
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1.5rem' }}>
          <AutomatonCanvas automaton={dfa} height={300} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 160 }}>
            <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>DFA Facts</div>
            <div className="formula-block" style={{ fontSize: '0.8rem' }}>States: {dfa.states.length}</div>
            <div className="formula-block" style={{ fontSize: '0.8rem' }}>Initial: {dfa.initialState}</div>
            <div className="formula-block" style={{ fontSize: '0.8rem' }}>Accepting: {dfa.acceptingStates.length}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Testing Sample Strings',
      subtitle: 'Simulating the ε-NFA on sample inputs',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {SAMPLE_STRINGS.map(s => (
              <button
                key={s}
                onClick={() => setSimString(s)}
                className={simString === s ? 'btn-primary' : 'btn-secondary'}
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                {s === '' ? 'ε' : s}
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <AutomatonCanvas automaton={automaton} height={220} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div className="formula-block">Input: "{simString || 'ε'}"</div>
              <div className={simResult.accepted ? 'result-accepted' : 'result-rejected'}>
                {simResult.accepted ? '✓ ACCEPTED' : '✗ REJECTED'}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6 }}>{simResult.explanation}</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Language Equivalence',
      subtitle: 'ε-NFA, NFA, and DFA all recognize the same language',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <div className="formula-block" style={{ maxWidth: 600, width: '100%', textAlign: 'center' }}>
            {'L(ε-NFA) = L(NFA) = L(DFA)\n\nAll three models are equivalent in expressive power.\nThey all recognize exactly the Regular Languages.'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', maxWidth: 700 }}>
            {['ε-NFA', 'NFA', 'DFA'].map(label => (
              <div key={label} className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <div className="gradient-text" style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: '0.5rem' }}>{label}</div>
                <span className="badge badge-green">Same Language</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Conclusion',
      subtitle: 'Key Takeaways',
      content: (
        <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            'ε-closures capture all states silently reachable via epsilon transitions.',
            'The ε-NFA → NFA conversion rewrites each transition using the epsilon closure formula.',
            'The NFA → DFA subset construction tracks all possible active NFA states simultaneously.',
            'All three automata recognize exactly the same class of regular languages.',
            'Visualization aids understanding of the mathematical definitions.',
          ].map((point, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)',
                borderRadius: 8, padding: '0.85rem 1rem'
              }}
            >
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '0.75rem', fontWeight: 700
              }}>{i + 1}</div>
              <span style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6 }}>{point}</span>
            </motion.div>
          ))}
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <div className="gradient-text" style={{ fontSize: '1.3rem', fontWeight: 900 }}>Thank You!</div>
          </div>
        </div>
      ),
    },
  ];

  const currentSlide = SLIDES[slide];

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') setSlide(s => Math.min(SLIDES.length - 1, s + 1));
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') setSlide(s => Math.max(0, s - 1));
      if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
        else document.exitFullscreen?.();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const containerStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', height: '100%',
    background: 'linear-gradient(135deg, #020817 0%, #0a0f1e 100%)',
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.5rem', borderBottom: '1px solid rgba(59,130,246,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div className="gradient-text" style={{ fontWeight: 900, fontSize: '1rem' }}>AUTOMATA ANIMATOR — Presentation Mode</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#475569' }}>{slide + 1} / {SLIDES.length}</span>
          <button className="btn-secondary" onClick={() => setSlide(s => Math.max(0, s - 1))} disabled={slide === 0}><ChevronLeft size={16} /></button>
          <button className="btn-primary" onClick={() => setSlide(s => Math.min(SLIDES.length - 1, s + 1))} disabled={slide === SLIDES.length - 1}><ChevronRight size={16} /></button>
          <button className="btn-secondary" onClick={() => document.documentElement.requestFullscreen?.()}><Maximize2 size={14} /></button>
        </div>
      </div>

      {/* Slide */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            style={{ flex: 1 }}
          >
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h1 className="gradient-text" style={{ fontSize: 'clamp(1.5rem,4vw,2.5rem)', fontWeight: 900, marginBottom: '0.4rem' }}>
                {currentSlide.title}
              </h1>
              <p style={{ color: '#64748b', fontSize: '1rem' }}>{currentSlide.subtitle}</p>
            </div>
            <div style={{ maxWidth: 960, margin: '0 auto' }}>
              {currentSlide.content}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slide thumbnails */}
      <div style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid rgba(59,130,246,0.1)', display: 'flex', gap: '4px', justifyContent: 'center' }}>
        {SLIDES.map((s, i) => (
          <div
            key={i}
            onClick={() => setSlide(i)}
            title={s.title}
            style={{
              width: i === slide ? 24 : 8, height: 8, borderRadius: 4, cursor: 'pointer',
              background: i === slide ? '#3b82f6' : i < slide ? '#10b981' : 'rgba(59,130,246,0.2)',
              transition: 'all 0.3s'
            }}
          />
        ))}
      </div>
      <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#1e293b', paddingBottom: '0.5rem' }}>
        Use ← → arrow keys to navigate · F for fullscreen
      </div>
    </div>
  );
};
