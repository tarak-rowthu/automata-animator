import { describe, it, expect } from 'vitest';
import { epsilonClosure, epsilonClosureSet, computeAllEpsilonClosures } from '../src/algorithms/epsilonClosure';
import { epsilonNfaToNfa } from '../src/algorithms/epsilonNfaToNfa';
import { nfaToDfa, subsetLabel } from '../src/algorithms/nfaToDfa';
import { simulateEpsilonNfa, simulateNfa, simulateDfa } from '../src/algorithms/simulation';
import { EXAMPLE_AUTOMATON } from '../src/data/exampleAutomaton';
import { Automaton } from '../src/types/automaton';

// ============ EPSILON CLOSURE TESTS ============

describe('epsilonClosure', () => {
  it('includes the state itself', () => {
    const aut: Automaton = {
      states: ['q0', 'q1'],
      alphabet: ['a'],
      initialState: 'q0',
      acceptingStates: [],
      transitions: [],
    };
    expect(epsilonClosure('q0', aut)).toContain('q0');
  });

  it('follows ε-transitions', () => {
    const aut: Automaton = {
      states: ['q0', 'q1', 'q2'],
      alphabet: ['a'],
      initialState: 'q0',
      acceptingStates: [],
      transitions: [
        { from: 'q0', symbol: 'ε', to: 'q1' },
        { from: 'q1', symbol: 'ε', to: 'q2' },
      ],
    };
    const closure = epsilonClosure('q0', aut);
    expect(closure).toContain('q0');
    expect(closure).toContain('q1');
    expect(closure).toContain('q2');
  });

  it('handles epsilon self-loops without infinite loop', () => {
    const aut: Automaton = {
      states: ['q0'],
      alphabet: ['a'],
      initialState: 'q0',
      acceptingStates: [],
      transitions: [{ from: 'q0', symbol: 'ε', to: 'q0' }],
    };
    const closure = epsilonClosure('q0', aut);
    expect(closure).toEqual(['q0']);
  });

  it('handles epsilon cycles without infinite loop', () => {
    const aut: Automaton = {
      states: ['q0', 'q1'],
      alphabet: [],
      initialState: 'q0',
      acceptingStates: [],
      transitions: [
        { from: 'q0', symbol: 'ε', to: 'q1' },
        { from: 'q1', symbol: 'ε', to: 'q0' },
      ],
    };
    const closure = epsilonClosure('q0', aut);
    expect(closure.sort()).toEqual(['q0', 'q1']);
  });

  it('computes epsilonClosureSet as union of individual closures', () => {
    const aut: Automaton = {
      states: ['q0', 'q1', 'q2'],
      alphabet: ['a'],
      initialState: 'q0',
      acceptingStates: [],
      transitions: [{ from: 'q1', symbol: 'ε', to: 'q2' }],
    };
    const result = epsilonClosureSet(['q0', 'q1'], aut);
    expect(result).toContain('q0');
    expect(result).toContain('q1');
    expect(result).toContain('q2');
  });
});

// ============ EXAMPLE AUTOMATON: ε-CLOSURE ============

describe('Example ε-NFA epsilon closures', () => {
  it('ε-closure(q0) = {q0, q1}', () => {
    const closure = epsilonClosure('q0', EXAMPLE_AUTOMATON).sort();
    expect(closure).toEqual(['q0', 'q1']);
  });

  it('ε-closure(q1) = {q1}', () => {
    const closure = epsilonClosure('q1', EXAMPLE_AUTOMATON).sort();
    expect(closure).toEqual(['q1']);
  });

  it('ε-closure(q2) = {q2}', () => {
    const closure = epsilonClosure('q2', EXAMPLE_AUTOMATON).sort();
    expect(closure).toEqual(['q2']);
  });
});

// ============ ε-NFA TO NFA CONVERSION ============

describe('epsilonNfaToNfa (example automaton)', () => {
  const { nfa, epsilonClosures } = epsilonNfaToNfa(EXAMPLE_AUTOMATON);

  it('preserves the same state set', () => {
    expect(nfa.states.sort()).toEqual(EXAMPLE_AUTOMATON.states.sort());
  });

  it('initial state remains q0', () => {
    expect(nfa.initialState).toBe('q0');
  });

  it('removes all epsilon transitions', () => {
    const epsilonTrans = nfa.transitions.filter(t => t.symbol === 'ε');
    expect(epsilonTrans.length).toBe(0);
  });

  it("q0's new accepting status: q0 becomes accepting because ε-closure(q0) contains no accepting state... wait", () => {
    // ε-closure(q0) = {q0, q1}, neither is accepting in original (only q2 is).
    // Actually q0 should NOT be accepting.
    // Re-check: EXAMPLE_AUTOMATON.acceptingStates = ['q2']
    // ε-closure(q0) = {q0, q1} — does not contain q2
    // So q0 should NOT be accepting
    expect(nfa.acceptingStates).not.toContain('q0');
  });

  it('q2 remains accepting', () => {
    expect(nfa.acceptingStates).toContain('q2');
  });

  it("δ'(q0, a) includes q0 and q1", () => {
    // ε-closure(q0) = {q0, q1}
    // δ(q0, a) = {q0} (from q0--a-->q0)
    // δ(q1, a) = {q1} (from q1--a-->q1)
    // union = {q0, q1}
    // ε-closure({q0, q1}) = {q0, q1}
    const targets = nfa.transitions.filter(t => t.from === 'q0' && t.symbol === 'a').map(t => t.to).sort();
    expect(targets).toContain('q0');
    expect(targets).toContain('q1');
  });

  it("δ'(q0, b) = {q2}", () => {
    // ε-closure(q0) = {q0, q1}
    // δ(q0, b) = {} (no transition)
    // δ(q1, b) = {q2}
    // union = {q2}, ε-closure({q2}) = {q2}
    const targets = nfa.transitions.filter(t => t.from === 'q0' && t.symbol === 'b').map(t => t.to).sort();
    expect(targets).toEqual(['q2']);
  });

  it("δ'(q1, a) = {q1}", () => {
    const targets = nfa.transitions.filter(t => t.from === 'q1' && t.symbol === 'a').map(t => t.to).sort();
    expect(targets).toEqual(['q1']);
  });

  it("δ'(q1, b) = {q2}", () => {
    const targets = nfa.transitions.filter(t => t.from === 'q1' && t.symbol === 'b').map(t => t.to).sort();
    expect(targets).toEqual(['q2']);
  });

  it("δ'(q2, b) = {q2}", () => {
    const targets = nfa.transitions.filter(t => t.from === 'q2' && t.symbol === 'b').map(t => t.to).sort();
    expect(targets).toEqual(['q2']);
  });

  it("δ'(q2, a) = ∅", () => {
    const targets = nfa.transitions.filter(t => t.from === 'q2' && t.symbol === 'a').map(t => t.to);
    expect(targets).toEqual([]);
  });
});

// ============ NFA → DFA SUBSET CONSTRUCTION ============

describe('nfaToDfa (example NFA from ε-NFA)', () => {
  const { nfa } = epsilonNfaToNfa(EXAMPLE_AUTOMATON);
  const { dfa, subsetMapping } = nfaToDfa(nfa);

  it('has valid accepting states', () => {
    expect(dfa.acceptingStates.length).toBeGreaterThan(0);
  });

  it('initial state is subset containing q0', () => {
    expect(dfa.initialState).toBe('{q0}');
  });

  it('all accepting DFA states contain an accepting NFA state', () => {
    for (const acc of dfa.acceptingStates) {
      const mapping = subsetMapping.find(m => m.dfaState === acc);
      expect(mapping?.isAccepting).toBe(true);
    }
  });

  it('dead state ∅ has self-loops if present', () => {
    const deadState = dfa.states.find(s => s === '∅');
    if (deadState) {
      for (const sym of dfa.alphabet) {
        const t = dfa.transitions.find(t => t.from === '∅' && t.symbol === sym);
        expect(t?.to).toBe('∅');
      }
    }
  });

  it('subset label ∅ is consistent', () => {
    expect(subsetLabel([])).toBe('∅');
    expect(subsetLabel(['q0'])).toBe('{q0}');
    expect(subsetLabel(['q0', 'q1'])).toBe('{q0,q1}');
  });
});

// ============ SIMULATION ============

describe('simulateEpsilonNfa (example)', () => {
  it('accepts "b"', () => {
    expect(simulateEpsilonNfa(EXAMPLE_AUTOMATON, 'b').accepted).toBe(true);
  });

  it('accepts "ab"', () => {
    expect(simulateEpsilonNfa(EXAMPLE_AUTOMATON, 'ab').accepted).toBe(true);
  });

  it('accepts "abb"', () => {
    expect(simulateEpsilonNfa(EXAMPLE_AUTOMATON, 'abb').accepted).toBe(true);
  });

  it('accepts "aab"', () => {
    expect(simulateEpsilonNfa(EXAMPLE_AUTOMATON, 'aab').accepted).toBe(true);
  });

  it('rejects "a" alone', () => {
    expect(simulateEpsilonNfa(EXAMPLE_AUTOMATON, 'a').accepted).toBe(false);
  });

  it('rejects "ba"', () => {
    expect(simulateEpsilonNfa(EXAMPLE_AUTOMATON, 'ba').accepted).toBe(false);
  });

  it('rejects empty string (q2 not in ε-closure(q0))', () => {
    // ε-closure(q0) = {q0, q1}, neither is q2, so empty string is rejected
    expect(simulateEpsilonNfa(EXAMPLE_AUTOMATON, '').accepted).toBe(false);
  });
});

describe('simulateNfa (converted NFA)', () => {
  const { nfa } = epsilonNfaToNfa(EXAMPLE_AUTOMATON);

  it('accepts "b"', () => {
    expect(simulateNfa(nfa, 'b').accepted).toBe(true);
  });

  it('accepts "ab"', () => {
    expect(simulateNfa(nfa, 'ab').accepted).toBe(true);
  });

  it('rejects "a"', () => {
    expect(simulateNfa(nfa, 'a').accepted).toBe(false);
  });

  it('rejects empty string', () => {
    expect(simulateNfa(nfa, '').accepted).toBe(false);
  });
});

describe('simulateDfa (converted DFA)', () => {
  const { nfa } = epsilonNfaToNfa(EXAMPLE_AUTOMATON);
  const { dfa } = nfaToDfa(nfa);

  it('accepts "b"', () => {
    expect(simulateDfa(dfa, 'b').accepted).toBe(true);
  });

  it('accepts "ab"', () => {
    expect(simulateDfa(dfa, 'ab').accepted).toBe(true);
  });

  it('accepts "abb"', () => {
    expect(simulateDfa(dfa, 'abb').accepted).toBe(true);
  });

  it('rejects "a"', () => {
    expect(simulateDfa(dfa, 'a').accepted).toBe(false);
  });

  it('rejects empty string', () => {
    expect(simulateDfa(dfa, '').accepted).toBe(false);
  });
});

// ============ CROSS-AUTOMATON AGREEMENT ============

describe('ε-NFA, NFA, and DFA agree on example strings', () => {
  const { nfa } = epsilonNfaToNfa(EXAMPLE_AUTOMATON);
  const { dfa } = nfaToDfa(nfa);

  const testCases = ['', 'a', 'b', 'ab', 'aa', 'bb', 'aab', 'abb', 'ba', 'aaabbb'];

  for (const input of testCases) {
    it(`agree on "${input || 'ε'}"`, () => {
      const r1 = simulateEpsilonNfa(EXAMPLE_AUTOMATON, input).accepted;
      const r2 = simulateNfa(nfa, input).accepted;
      const r3 = simulateDfa(dfa, input).accepted;
      expect(r1).toBe(r2);
      expect(r2).toBe(r3);
    });
  }
});
