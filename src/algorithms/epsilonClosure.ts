import { Automaton, EpsilonClosureMap } from '../types/automaton';

export const EPSILON = 'ε';

/**
 * Normalizes epsilon symbol variants to the canonical ε character.
 */
export function normalizeEpsilon(symbol: string): string {
  const lower = symbol.toLowerCase().trim();
  if (lower === 'epsilon' || lower === 'eps' || lower === 'e' || lower === 'ε') {
    return EPSILON;
  }
  return symbol.trim();
}

/**
 * Computes ε-closure for a single state.
 * ε-closure(q) = set of states reachable from q via zero or more ε-transitions.
 * Always includes q itself.
 */
export function epsilonClosure(state: string, automaton: Automaton): string[] {
  const closure = new Set<string>();
  const stack = [state];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (closure.has(current)) continue;
    closure.add(current);

    for (const t of automaton.transitions) {
      if (t.from === current && normalizeEpsilon(t.symbol) === EPSILON) {
        if (!closure.has(t.to)) {
          stack.push(t.to);
        }
      }
    }
  }

  return Array.from(closure).sort();
}

/**
 * Computes ε-closure for a set of states (union of individual closures).
 */
export function epsilonClosureSet(states: string[], automaton: Automaton): string[] {
  const closure = new Set<string>();
  for (const state of states) {
    const stateClosure = epsilonClosure(state, automaton);
    for (const s of stateClosure) closure.add(s);
  }
  return Array.from(closure).sort();
}

/**
 * Computes ε-closure for every state in the automaton.
 */
export function computeAllEpsilonClosures(automaton: Automaton): EpsilonClosureMap {
  const map: EpsilonClosureMap = {};
  for (const state of automaton.states) {
    map[state] = epsilonClosure(state, automaton);
  }
  return map;
}
