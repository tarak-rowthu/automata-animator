import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './components/layout/Sidebar';
import { HomePage } from './pages/HomePage';
import { BuilderPage } from './pages/BuilderPage';
import { EpsilonNfaToNfaPage } from './pages/EpsilonNfaToNfaPage';
import { NfaToDfaPage } from './pages/NfaToDfaPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { LearningPage } from './pages/LearningPage';
import { QuizPage } from './pages/QuizPage';
import { PresentationPage } from './pages/PresentationPage';
import { SettingsPage } from './pages/SettingsPage';
import {
  Automaton, AppPage, EpsilonClosureMap, DFASubsetMapping
} from './types/automaton';
import { EXAMPLE_AUTOMATON } from './data/exampleAutomaton';

const STORAGE_KEY = 'automata-animator-state';

const EMPTY_AUTOMATON: Automaton = {
  states: [],
  alphabet: [],
  initialState: '',
  acceptingStates: [],
  transitions: [],
};

function loadState(): Automaton {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Automaton;
      if (parsed && Array.isArray(parsed.states) && parsed.states.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return EXAMPLE_AUTOMATON;
}

function saveState(automaton: Automaton) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(automaton));
  } catch {}
}

function App() {
  const [page, setPage] = useState<AppPage>('home');
  const [automaton, setAutomaton] = useState<Automaton>(loadState);
  const [nfa, setNfa] = useState<Automaton | null>(null);
  const [dfa, setDfa] = useState<Automaton | null>(null);
  const [epsilonClosures, setEpsilonClosures] = useState<EpsilonClosureMap | null>(null);
  const [dfaMapping, setDfaMapping] = useState<DFASubsetMapping[] | null>(null);

  useEffect(() => {
    saveState(automaton);
  }, [automaton]);

  function handleAutomatonChange(a: Automaton) {
    setAutomaton(a);
    // Invalidate derived results when automaton changes
    setNfa(null);
    setDfa(null);
    setEpsilonClosures(null);
    setDfaMapping(null);
  }

  function loadExample() {
    handleAutomatonChange(EXAMPLE_AUTOMATON);
    setPage('builder');
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#020817' }}>
      {/* Sidebar - hidden in presentation mode */}
      {page !== 'presentation' && (
        <Sidebar current={page} onNavigate={setPage} />
      )}

      {/* Main content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            {page === 'home' && (
              <HomePage onNavigate={setPage} onLoadExample={loadExample} />
            )}
            {page === 'builder' && (
              <BuilderPage automaton={automaton} onChange={handleAutomatonChange} />
            )}
            {page === 'epsilon-nfa-to-nfa' && (
              <EpsilonNfaToNfaPage
                automaton={automaton}
                onConversionComplete={(convertedNfa, closures) => {
                  setNfa(convertedNfa);
                  setEpsilonClosures(closures);
                }}
                onNavigate={setPage}
              />
            )}
            {page === 'nfa-to-dfa' && (
              <NfaToDfaPage
                nfa={nfa}
                onConversionComplete={(convertedDfa, mapping) => {
                  setDfa(convertedDfa);
                  setDfaMapping(mapping);
                }}
                onNavigate={setPage}
              />
            )}
            {page === 'simulator' && (
              <SimulatorPage epsilonNfa={automaton} nfa={nfa} dfa={dfa} />
            )}
            {page === 'learning' && <LearningPage />}
            {page === 'quiz' && <QuizPage />}
            {page === 'presentation' && (
              <PresentationPage
                automaton={automaton}
                nfa={nfa}
                dfa={dfa}
                epsilonClosures={epsilonClosures}
                dfaMapping={dfaMapping}
              />
            )}
            {page === 'settings' && (
              <SettingsPage automaton={automaton} onChange={handleAutomatonChange} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Presentation mode exit button */}
        {page === 'presentation' && (
          <button
            onClick={() => setPage('home')}
            style={{
              position: 'fixed', top: 12, left: 12, zIndex: 100,
              background: 'rgba(10,15,30,0.9)', border: '1px solid rgba(59,130,246,0.3)',
              borderRadius: 6, padding: '0.3rem 0.7rem', color: '#60a5fa',
              cursor: 'pointer', fontSize: '0.75rem'
            }}
          >
            ← Exit
          </button>
        )}
      </main>
    </div>
  );
}

export default App;
