import React from 'react';
import { Settings, Download, Upload, RefreshCw, Info } from 'lucide-react';
import { Automaton } from '../types/automaton';
import { EXAMPLE_AUTOMATON } from '../data/exampleAutomaton';

interface SettingsPageProps {
  automaton: Automaton;
  onChange: (a: Automaton) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ automaton, onChange }) => {
  function exportJson() {
    const data = JSON.stringify(automaton, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'automaton.json'; a.click();
    URL.revokeObjectURL(url);
  }

  function clearStorage() {
    if (!confirm('Clear all saved data?')) return;
    localStorage.removeItem('automata-animator-state');
    window.location.reload();
  }

  return (
    <div style={{ padding: '1.5rem', overflowY: 'auto', height: '100%' }}>
      <h2 style={{ fontWeight: 800, color: '#e2e8f0', fontSize: '1.2rem', marginBottom: '1.5rem' }}>Settings</h2>

      <div style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Automaton info */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div className="section-header"><div className="section-header-icon"><Info size={14} /></div>Current Automaton</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="badge badge-blue">{automaton.states.length} states</span>
            <span className="badge badge-violet">{automaton.alphabet.length} symbols</span>
            <span className="badge badge-green">{automaton.acceptingStates.length} accepting</span>
            <span className="badge badge-amber">{automaton.transitions.length} transitions</span>
          </div>
        </div>

        {/* Export/Import */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div className="section-header"><div className="section-header-icon"><Download size={14} /></div>Export / Import</div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn-secondary" onClick={exportJson}><Download size={14} /> Export JSON</button>
            <button className="btn-secondary" onClick={() => onChange(EXAMPLE_AUTOMATON)}><Upload size={14} /> Load Example</button>
          </div>
        </div>

        {/* JSON Structure */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div className="section-header"><div className="section-header-icon"><Settings size={14} /></div>JSON Format</div>
          <pre className="formula-block" style={{ fontSize: '0.78rem', overflowX: 'auto' }}>{`{
  "states": ["q0", "q1", "q2"],
  "alphabet": ["a", "b"],
  "initialState": "q0",
  "acceptingStates": ["q2"],
  "transitions": [
    { "from": "q0", "symbol": "ε", "to": "q1" },
    { "from": "q0", "symbol": "a", "to": "q0" },
    { "from": "q1", "symbol": "b", "to": "q2" }
  ]
}`}</pre>
        </div>

        {/* Clear data */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div className="section-header"><div className="section-header-icon"><RefreshCw size={14} /></div>Reset</div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.75rem' }}>
            Clear all saved data and restart with a blank automaton.
          </p>
          <button className="btn-danger" onClick={clearStorage}><RefreshCw size={14} /> Clear All Data</button>
        </div>

        {/* About */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div className="section-header"><div className="section-header-icon"><Info size={14} /></div>About</div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.7 }}>
            <strong style={{ color: '#e2e8f0' }}>Automata Animator v1.0</strong><br />
            An interactive educational tool for Formal Languages and Automata Theory.<br /><br />
            Built with React, TypeScript, Vite, Tailwind CSS, and Framer Motion.<br /><br />
            Implements mathematically correct algorithms for ε-NFA to NFA conversion (epsilon closure method) and NFA to DFA conversion (subset construction).
          </p>
        </div>
      </div>
    </div>
  );
};
