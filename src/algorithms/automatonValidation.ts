import { Automaton, ValidationResult } from '../types/automaton';
import { normalizeEpsilon, EPSILON } from './epsilonClosure';

export function validateAutomaton(automaton: Automaton): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!automaton.states || automaton.states.length === 0) {
    errors.push('Automaton must have at least one state.');
  }

  if (!automaton.initialState) {
    errors.push('Automaton must have an initial state.');
  } else if (!automaton.states.includes(automaton.initialState)) {
    errors.push(`Initial state "${automaton.initialState}" is not in the state set.`);
  }

  if (!automaton.acceptingStates || automaton.acceptingStates.length === 0) {
    warnings.push('Automaton has no accepting states. It will reject all strings.');
  } else {
    for (const s of automaton.acceptingStates) {
      if (!automaton.states.includes(s)) {
        errors.push(`Accepting state "${s}" is not in the state set.`);
      }
    }
  }

  // Check for duplicate states
  const stateSet = new Set(automaton.states);
  if (stateSet.size !== automaton.states.length) {
    errors.push('Duplicate state names found.');
  }

  // Check transitions
  for (const t of automaton.transitions) {
    if (!stateSet.has(t.from)) {
      errors.push(`Transition from unknown state "${t.from}".`);
    }
    if (!stateSet.has(t.to)) {
      errors.push(`Transition to unknown state "${t.to}".`);
    }
    const sym = normalizeEpsilon(t.symbol);
    if (sym !== EPSILON && !automaton.alphabet.includes(sym)) {
      errors.push(`Transition symbol "${t.symbol}" is not in the alphabet and not epsilon.`);
    }
  }

  // Check for unreachable states
  const reachable = new Set<string>();
  const stack = [automaton.initialState];
  while (stack.length > 0) {
    const s = stack.pop()!;
    if (reachable.has(s)) continue;
    reachable.add(s);
    for (const t of automaton.transitions) {
      if (t.from === s && !reachable.has(t.to)) stack.push(t.to);
    }
  }
  for (const s of automaton.states) {
    if (!reachable.has(s)) warnings.push(`State "${s}" is unreachable from the initial state.`);
  }

  return { valid: errors.length === 0, errors, warnings };
}
