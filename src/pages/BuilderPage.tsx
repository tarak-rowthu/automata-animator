import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Download, Upload, RefreshCw, CheckCircle, AlertCircle, Edit2, Cpu } from 'lucide-react';
import { Automaton, Transition } from '../types/automaton';
import { AutomatonCanvas } from '../components/automaton/AutomatonCanvas';
import { validateAutomaton } from '../algorithms/automatonValidation';
import { EXAMPLE_AUTOMATON } from '../data/exampleAutomaton';

import { FinalStateInspector } from '../components/automaton/FinalStateInspector';

interface BuilderPageProps {
  automaton: Automaton;
  onChange: (a: Automaton) => void;
}

export const BuilderPage: React.FC<BuilderPageProps> = ({ automaton, onChange }) => {
  const [newState, setNewState] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const [transFrom, setTransFrom] = useState('');
  const [transSym, setTransSym] = useState('');
  const [transTo, setTransTo] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonError, setJsonError] = useState('');
  const [activeTab, setActiveTab] = useState<'visual' | 'json'>('visual');
  const [selectedState, setSelectedState] = useState<string | null>(null);

  const validation = validateAutomaton(automaton);

  function addState() {
    const name = newState.trim();
    if (!name || automaton.states.includes(name)) return;
    onChange({ ...automaton, states: [...automaton.states, name] });
    setNewState('');
  }

  function removeState(s: string) {
    if (!confirm(`Delete state "${s}"?`)) return;
    const states = automaton.states.filter(x => x !== s);
    const transitions = automaton.transitions.filter(t => t.from !== s && t.to !== s);
    const acceptingStates = automaton.acceptingStates.filter(x => x !== s);
    const initialState = automaton.initialState === s ? (states[0] || '') : automaton.initialState;
    onChange({ ...automaton, states, transitions, acceptingStates, initialState });
  }

  function toggleAccepting(s: string) {
    const acc = automaton.acceptingStates.includes(s)
      ? automaton.acceptingStates.filter(x => x !== s)
      : [...automaton.acceptingStates, s];
    onChange({ ...automaton, acceptingStates: acc });
  }

  function setInitial(s: string) {
    onChange({ ...automaton, initialState: s });
  }

  function addAlphabetSymbol() {
    const sym = newSymbol.trim();
    if (!sym || sym === 'ε' || automaton.alphabet.includes(sym)) return;
    onChange({ ...automaton, alphabet: [...automaton.alphabet, sym] });
    setNewSymbol('');
  }

  function removeAlphabetSymbol(sym: string) {
    const transitions = automaton.transitions.filter(t => t.symbol !== sym);
    onChange({ ...automaton, alphabet: automaton.alphabet.filter(s => s !== sym), transitions });
  }

  function addTransition() {
    if (!transFrom || !transSym || !transTo) return;
    const sym = transSym.trim().toLowerCase() === 'epsilon' || transSym.trim() === 'ε' ? 'ε' : transSym.trim();
    const exists = automaton.transitions.some(t => t.from === transFrom && t.symbol === sym && t.to === transTo);
    if (exists) return;
    onChange({
      ...automaton,
      transitions: [...automaton.transitions, { from: transFrom, symbol: sym, to: transTo }]
    });
  }

  function removeTransition(t: Transition) {
    onChange({
      ...automaton,
      transitions: automaton.transitions.filter(x => !(x.from === t.from && x.symbol === t.symbol && x.to === t.to))
    });
  }

  function exportJson() {
    const data = JSON.stringify(automaton, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'automaton.json'; a.click();
  }

  function importJson() {
    try {
      const parsed = JSON.parse(jsonText) as Automaton;
      if (!parsed.states || !parsed.alphabet || !parsed.initialState) throw new Error('Invalid format');
      // Normalize epsilon
      parsed.transitions = parsed.transitions.map(t => ({
        ...t,
        symbol: (t.symbol.toLowerCase() === 'epsilon' || t.symbol === 'e') ? 'ε' : t.symbol
      }));
      onChange(parsed);
      setJsonMode(false);
      setJsonError('');
    } catch {
      setJsonError('Invalid JSON or missing required fields (states, alphabet, initialState, acceptingStates, transitions).');
    }
  }

  function resetAutomaton() {
    if (!confirm('Reset automaton? This cannot be undone.')) return;
    onChange({ states: [], alphabet: [], initialState: '', acceptingStates: [], transitions: [] });
  }

  const SYMBOL_OPTIONS = ['ε', ...automaton.alphabet];

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Canvas */}
      <div style={{ flex: 1, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ fontWeight: 800, color: '#e2e8f0', fontSize: '1.2rem' }}>Automaton Builder</h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => onChange(EXAMPLE_AUTOMATON)}>
              Load Example
            </button>
            <button className="btn-secondary" style={{ fontSize: '0.8rem' }} onClick={exportJson}>
              <Download size={14} /> Export JSON
            </button>
            <button className="btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => setJsonMode(!jsonMode)}>
              <Upload size={14} /> Import JSON
            </button>
            <button className="btn-danger" style={{ fontSize: '0.8rem' }} onClick={resetAutomaton}>
              <RefreshCw size={14} /> Reset
            </button>
          </div>
        </div>

        {/* Validation */}
        {!validation.valid && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', fontWeight: 600, marginBottom: '0.4rem' }}>
              <AlertCircle size={14} /> Validation Errors
            </div>
            {validation.errors.map((e, i) => <div key={i} style={{ fontSize: '0.8rem', color: '#fca5a5' }}>• {e}</div>)}
          </div>
        )}
        {validation.warnings.length > 0 && (
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, padding: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontWeight: 600, marginBottom: '0.4rem' }}>
              <AlertCircle size={14} /> Warnings
            </div>
            {validation.warnings.map((w, i) => <div key={i} style={{ fontSize: '0.8rem', color: '#fde68a' }}>• {w}</div>)}
          </div>
        )}
        {validation.valid && automaton.states.length > 0 && (
          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, padding: '0.6rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontSize: '0.85rem', fontWeight: 600 }}>
            <CheckCircle size={14} /> Valid automaton — ready for conversion
          </div>
        )}

        {/* JSON import */}
        {jsonMode && (
          <div className="glass-card" style={{ padding: '1rem' }}>
            <h4 style={{ color: '#60a5fa', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 700 }}>Import JSON</h4>
            <textarea
              className="input-field"
              style={{ height: 160, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', resize: 'vertical' }}
              value={jsonText}
              onChange={e => setJsonText(e.target.value)}
              placeholder='{"states":["q0","q1"],"alphabet":["a","b"],...}'
            />
            {jsonError && <div style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.4rem' }}>{jsonError}</div>}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button className="btn-primary" style={{ fontSize: '0.8rem' }} onClick={importJson}>Import</button>
              <button className="btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => { setJsonMode(false); setJsonError(''); }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Automaton canvas */}
        <AutomatonCanvas
          automaton={automaton}
          height={360}
          readOnly={false}
          selectedState={selectedState}
          onStateClick={setSelectedState}
        />

        {/* Selected State Inspector */}
        {selectedState && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <FinalStateInspector
              stateId={selectedState}
              automaton={automaton}
              automatonType="epsilon-nfa"
              originalAcceptingStates={automaton.acceptingStates}
              onClose={() => setSelectedState(null)}
            />
          </div>
        )}

        {/* Transition table */}
        {automaton.transitions.length > 0 && (
          <div className="glass-card" style={{ padding: '1rem', overflowX: 'auto' }}>
            <h4 style={{ color: '#60a5fa', marginBottom: '0.75rem', fontSize: '0.85rem', fontWeight: 700 }}>Transitions</h4>
            <table className="automaton-table">
              <thead>
                <tr><th>From</th><th>Symbol</th><th>To</th><th></th></tr>
              </thead>
              <tbody>
                {automaton.transitions.map((t, i) => (
                  <tr key={i}>
                    <td className={automaton.initialState === t.from ? 'table-initial' : ''}>{t.from}</td>
                    <td style={{ color: t.symbol === 'ε' ? '#a78bfa' : '#94a3b8' }}>{t.symbol}</td>
                    <td className={automaton.acceptingStates.includes(t.to) ? 'table-accepting' : ''}>{t.to}</td>
                    <td>
                      <button onClick={() => removeTransition(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Control panel */}
      <div style={{
        width: 260, minWidth: 260, padding: '1.25rem 1rem', borderLeft: '1px solid rgba(59,130,246,0.12)',
        overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem'
      }}>
        {/* States */}
        <div>
          <div className="section-header">
            <div className="section-header-icon"><Cpu size={14} /></div>
            States
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <input className="input-field" style={{ fontSize: '0.85rem' }} value={newState} onChange={e => setNewState(e.target.value)}
              placeholder="q0" onKeyDown={e => e.key === 'Enter' && addState()} />
            <button className="btn-primary" style={{ padding: '0.4rem 0.7rem' }} onClick={addState}><Plus size={14} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {automaton.states.map(s => (
              <div key={s} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'rgba(30,41,59,0.5)', borderRadius: 6, padding: '0.4rem 0.6rem',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', flex: 1,
                  color: automaton.acceptingStates.includes(s) ? '#34d399' : automaton.initialState === s ? '#a78bfa' : '#93c5fd'
                }}>{s}</span>
                {automaton.initialState === s && <span className="badge badge-violet" style={{ fontSize: '0.6rem' }}>start</span>}
                {automaton.acceptingStates.includes(s) && <span className="badge badge-green" style={{ fontSize: '0.6rem' }}>acc</span>}
                <button title="Set initial" onClick={() => setInitial(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8b5cf6', opacity: automaton.initialState === s ? 1 : 0.4 }}>
                  <Edit2 size={11} />
                </button>
                <button title="Toggle accepting" onClick={() => toggleAccepting(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981', opacity: automaton.acceptingStates.includes(s) ? 1 : 0.4 }}>
                  <CheckCircle size={11} />
                </button>
                <button title="Delete state" onClick={() => removeState(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Alphabet */}
        <div>
          <div className="section-header">
            <div className="section-header-icon"><Edit2 size={14} /></div>
            Alphabet
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <input className="input-field" style={{ fontSize: '0.85rem' }} value={newSymbol} onChange={e => setNewSymbol(e.target.value)}
              placeholder="a" onKeyDown={e => e.key === 'Enter' && addAlphabetSymbol()} />
            <button className="btn-primary" style={{ padding: '0.4rem 0.7rem' }} onClick={addAlphabetSymbol}><Plus size={14} /></button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {automaton.alphabet.map(sym => (
              <div key={sym} style={{
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
                borderRadius: 6, padding: '0.2rem 0.5rem', fontSize: '0.85rem', color: '#93c5fd',
                fontFamily: 'JetBrains Mono, monospace'
              }}>
                {sym}
                <button onClick={() => removeAlphabetSymbol(sym)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
            {automaton.alphabet.length === 0 && <span style={{ fontSize: '0.8rem', color: '#475569' }}>No symbols yet</span>}
          </div>
        </div>

        {/* Add transition */}
        <div>
          <div className="section-header">
            <div className="section-header-icon"><Plus size={14} /></div>
            Add Transition
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <select className="input-field" style={{ fontSize: '0.85rem' }} value={transFrom} onChange={e => setTransFrom(e.target.value)}>
              <option value="">From state...</option>
              {automaton.states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="input-field" style={{ fontSize: '0.85rem' }} value={transSym} onChange={e => setTransSym(e.target.value)}>
              <option value="">Symbol...</option>
              {SYMBOL_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="input-field" style={{ fontSize: '0.85rem' }} value={transTo} onChange={e => setTransTo(e.target.value)}>
              <option value="">To state...</option>
              {automaton.states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn-primary" style={{ fontSize: '0.85rem' }} onClick={addTransition}
              disabled={!transFrom || !transSym || !transTo}>
              <Plus size={14} /> Add Transition
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
