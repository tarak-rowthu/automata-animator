import {
  Automaton,
  ConversionStep,
  EpsilonClosureMap,
  EpsilonNfaToNfaResult,
} from '../types/automaton';
import { EPSILON, computeAllEpsilonClosures, epsilonClosure, epsilonClosureSet, normalizeEpsilon } from './epsilonClosure';

/**
 * Converts an ε-NFA to an equivalent NFA by eliminating epsilon transitions.
 *
 * Algorithm:
 * 1. Compute ε-closure for every state.
 * 2. For each state q and symbol a ∈ Σ:
 *    δ'(q, a) = ε-closure( ∪ δ(p, a) for p ∈ ε-closure(q) )
 * 3. New accepting states: F' = { q | ε-closure(q) ∩ F ≠ ∅ }
 * 4. Remove all ε-transitions.
 * 5. Initial state remains q0 (unchanged).
 */
export function epsilonNfaToNfa(epsilonNfa: Automaton): EpsilonNfaToNfaResult {
  const epsilonClosures = computeAllEpsilonClosures(epsilonNfa);
  const steps: ConversionStep[] = [];

  // Step 1: Show epsilon closures
  steps.push({
    type: 'compute-epsilon-closure',
    title: 'Step 1: Computing ε-Closures',
    description:
      'For each state q, compute ε-closure(q) — the set of states reachable from q via zero or more ε-transitions. Every state is always reachable from itself.',
    highlightStates: epsilonNfa.states,
    data: { epsilonClosures },
  });

  for (const state of epsilonNfa.states) {
    steps.push({
      type: 'highlight-state',
      title: `ε-closure(${state})`,
      description: `Computing ε-closure for state ${state}. Starting from ${state}, follow all ε-transitions (zero or more). Result: {${epsilonClosures[state].join(', ')}}`,
      highlightStates: epsilonClosures[state],
      data: { state, closure: epsilonClosures[state] },
    });
  }

  steps.push({
    type: 'show-closure-table',
    title: 'Step 2: ε-Closure Table',
    description: 'The complete ε-closure table for all states. This shows the reachability via epsilon transitions.',
    data: { epsilonClosures },
  });

  // Step 3: Compute new transitions
  const newTransitionMap: Map<string, Map<string, string[]>> = new Map();

  for (const state of epsilonNfa.states) {
    newTransitionMap.set(state, new Map());
  }

  for (const state of epsilonNfa.states) {
    const closure = epsilonClosures[state]; // ε-closure(q)

    for (const symbol of epsilonNfa.alphabet) {
      // Collect all states reachable by reading `symbol` from any state in closure
      const reachableBySymbol = new Set<string>();
      for (const p of closure) {
        for (const t of epsilonNfa.transitions) {
          if (t.from === p && normalizeEpsilon(t.symbol) === symbol) {
            reachableBySymbol.add(t.to);
          }
        }
      }

      // Then take ε-closure of those
      const finalSet = epsilonClosureSet(Array.from(reachableBySymbol), epsilonNfa);

      newTransitionMap.get(state)!.set(symbol, finalSet.sort());

      if (reachableBySymbol.size > 0 || finalSet.length > 0) {
        steps.push({
          type: 'compute-transition',
          title: `δ'(${state}, ${symbol})`,
          description: `ε-closure(${state}) = {${closure.join(', ')}}. From these states on '${symbol}': {${Array.from(reachableBySymbol).join(', ')}}. Then ε-closure: {${finalSet.join(', ')}}.`,
          highlightStates: [...closure, ...Array.from(reachableBySymbol), ...finalSet],
          data: {
            fromState: state,
            symbol,
            closureOfFrom: closure,
            reachableBySymbol: Array.from(reachableBySymbol),
            finalSet,
          },
        });
      }
    }
  }

  steps.push({
    type: 'show-transition-table',
    title: 'Step 3: New NFA Transition Table',
    description: 'The updated transition function δ\'(q, a) after removing ε-transitions.',
    data: { transitionMap: Object.fromEntries(
      Array.from(newTransitionMap.entries()).map(([k, v]) => [k, Object.fromEntries(v)])
    )},
  });

  // Step 4: Compute new accepting states
  const newAcceptingStates = epsilonNfa.states.filter(state => {
    const closure = epsilonClosures[state];
    return closure.some(s => epsilonNfa.acceptingStates.includes(s));
  });

  steps.push({
    type: 'identify-accepting',
    title: 'Step 4: New Accepting States',
    description: `F' = { q ∈ Q | ε-closure(q) ∩ F ≠ ∅ }. A state q is accepting in the new NFA if its ε-closure contains any accepting state of the original ε-NFA.`,
    highlightStates: newAcceptingStates,
    data: { newAcceptingStates, originalAccepting: epsilonNfa.acceptingStates },
  });

  // Build new NFA transitions (no epsilon)
  const newTransitions = [];
  for (const [state, symbolMap] of newTransitionMap.entries()) {
    for (const [symbol, targets] of symbolMap.entries()) {
      for (const target of targets) {
        newTransitions.push({ from: state, symbol, to: target });
      }
    }
  }

  const nfa: Automaton = {
    states: epsilonNfa.states,
    alphabet: epsilonNfa.alphabet,
    initialState: epsilonNfa.initialState,
    acceptingStates: newAcceptingStates,
    transitions: newTransitions,
  };

  steps.push({
    type: 'render-result',
    title: 'Step 5: Equivalent NFA',
    description: 'The resulting NFA has no ε-transitions and recognizes exactly the same language as the original ε-NFA.',
    data: { nfa },
  });

  return { nfa, epsilonClosures, steps };
}
