import { Automaton, SimulationResult, SimulationStep } from '../types/automaton';
import { EPSILON, epsilonClosure, epsilonClosureSet, normalizeEpsilon } from './epsilonClosure';

/**
 * Simulates an ε-NFA on input string using epsilon closures.
 */
export function simulateEpsilonNfa(automaton: Automaton, input: string): SimulationResult {
  const steps: SimulationStep[] = [];

  // Start: compute ε-closure of initial state
  const initialClosure = epsilonClosure(automaton.initialState, automaton);
  steps.push({
    symbol: null,
    activeStates: initialClosure,
    epsilonClosure: initialClosure,
    description: `Start: ε-closure({${automaton.initialState}}) = {${initialClosure.join(', ')}}`,
  });

  let currentStates = initialClosure;

  for (let i = 0; i < input.length; i++) {
    const symbol = input[i];

    // Move: for each active state, collect all states reachable by symbol
    const moved = new Set<string>();
    for (const state of currentStates) {
      for (const t of automaton.transitions) {
        if (t.from === state && normalizeEpsilon(t.symbol) === symbol) {
          moved.add(t.to);
        }
      }
    }

    // Then take ε-closure
    const nextClosure = epsilonClosureSet(Array.from(moved), automaton);

    steps.push({
      symbol,
      activeStates: nextClosure,
      transition: { from: currentStates, symbol, to: Array.from(moved) },
      epsilonClosure: nextClosure,
      description:
        moved.size === 0
          ? `Read '${symbol}': no transitions from {${currentStates.join(', ')}}. Active set becomes ∅.`
          : `Read '${symbol}': move({${currentStates.join(', ')}}, ${symbol}) = {${Array.from(moved).join(', ')}}. ε-closure = {${nextClosure.join(', ')}}.`,
    });

    currentStates = nextClosure;
  }

  const accepted = currentStates.some(s => automaton.acceptingStates.includes(s));

  return {
    accepted,
    steps,
    explanation: accepted
      ? `Accepted: after consuming "${input || 'ε'}", the active states {${currentStates.join(', ')}} contain accepting state(s) {${currentStates.filter(s => automaton.acceptingStates.includes(s)).join(', ')}}.`
      : `Rejected: after consuming "${input || 'ε'}", the active states {${currentStates.join(', ')}} contain no accepting state.`,
  };
}

/**
 * Simulates an NFA on input string (no epsilon transitions).
 */
export function simulateNfa(automaton: Automaton, input: string): SimulationResult {
  const steps: SimulationStep[] = [];
  let currentStates = [automaton.initialState];

  steps.push({
    symbol: null,
    activeStates: currentStates,
    description: `Start: initial state = {${automaton.initialState}}`,
  });

  for (let i = 0; i < input.length; i++) {
    const symbol = input[i];
    const nextStates = new Set<string>();

    for (const state of currentStates) {
      for (const t of automaton.transitions) {
        if (t.from === state && t.symbol === symbol) {
          nextStates.add(t.to);
        }
      }
    }

    const nextArr = Array.from(nextStates).sort();
    steps.push({
      symbol,
      activeStates: nextArr,
      transition: { from: currentStates, symbol, to: nextArr },
      description:
        nextArr.length === 0
          ? `Read '${symbol}': no transitions from {${currentStates.join(', ')}}. Active set = ∅.`
          : `Read '${symbol}': δ({${currentStates.join(', ')}}, ${symbol}) = {${nextArr.join(', ')}}.`,
    });

    currentStates = nextArr;
  }

  const accepted = currentStates.some(s => automaton.acceptingStates.includes(s));

  return {
    accepted,
    steps,
    explanation: accepted
      ? `Accepted: after consuming "${input || 'ε'}", the active states {${currentStates.join(', ')}} include accepting state(s).`
      : `Rejected: after consuming "${input || 'ε'}", the active states {${currentStates.join(', ')}} include no accepting state.`,
  };
}

/**
 * Simulates a DFA on input string.
 */
export function simulateDfa(automaton: Automaton, input: string): SimulationResult {
  const steps: SimulationStep[] = [];
  let currentState = automaton.initialState;

  steps.push({
    symbol: null,
    activeStates: [currentState],
    description: `Start: initial state = ${currentState}`,
  });

  for (let i = 0; i < input.length; i++) {
    const symbol = input[i];
    let nextState: string | undefined;

    for (const t of automaton.transitions) {
      if (t.from === currentState && t.symbol === symbol) {
        nextState = t.to;
        break;
      }
    }

    const next = nextState || '∅';
    steps.push({
      symbol,
      activeStates: nextState ? [nextState] : [],
      transition: {
        from: [currentState],
        symbol,
        to: nextState ? [nextState] : [],
      },
      description: nextState
        ? `Read '${symbol}': δ(${currentState}, ${symbol}) = ${nextState}.`
        : `Read '${symbol}': no transition from ${currentState} on '${symbol}'. Transition to dead state ∅.`,
    });

    currentState = next;
  }

  const accepted = automaton.acceptingStates.includes(currentState);

  return {
    accepted,
    steps,
    explanation: accepted
      ? `Accepted: the DFA ends in state ${currentState}, which is an accepting state.`
      : `Rejected: the DFA ends in state ${currentState}, which is not an accepting state.`,
  };
}
