import {
  Automaton,
  ConversionStep,
  DFASubsetMapping,
  NfaToDfaResult,
} from '../types/automaton';

/**
 * Generates a canonical DFA state label from a set of NFA states.
 */
export function subsetLabel(states: string[]): string {
  if (states.length === 0) return '∅';
  return '{' + [...states].sort().join(',') + '}';
}

/**
 * Parses a subset label back into an array of state names.
 */
export function parseSubsetLabel(label: string): string[] {
  if (label === '∅') return [];
  return label.replace(/[{}]/g, '').split(',').filter(s => s.length > 0);
}

/**
 * Converts an NFA to a DFA using the subset construction algorithm.
 *
 * Algorithm:
 * 1. Start with the subset {initialState}.
 * 2. For each unprocessed subset S and each symbol a:
 *    δ_DFA(S, a) = ∪ δ_NFA(q, a) for every q ∈ S
 * 3. Add newly discovered subsets to the worklist.
 * 4. A DFA state is accepting if it contains any NFA accepting state.
 * 5. Include the dead state ∅ if any transition leads to an empty set.
 */
export function nfaToDfa(nfa: Automaton): NfaToDfaResult {
  const steps: ConversionStep[] = [];
  const subsetMapping: DFASubsetMapping[] = [];

  // Helper: get all NFA targets for a given state+symbol (not epsilon)
  function nfaMove(states: string[], symbol: string): string[] {
    const result = new Set<string>();
    for (const state of states) {
      for (const t of nfa.transitions) {
        if (t.from === state && t.symbol === symbol) {
          result.add(t.to);
        }
      }
    }
    return Array.from(result).sort();
  }

  const initialSubset = [nfa.initialState].sort();
  const initialLabel = subsetLabel(initialSubset);

  // Map: subset label -> nfa states
  const subsets = new Map<string, string[]>();
  subsets.set(initialLabel, initialSubset);

  const worklist: string[] = [initialLabel];
  const processed = new Set<string>();

  // DFA transitions: Map<fromLabel, Map<symbol, toLabel>>
  const dfaTransitions = new Map<string, Map<string, string>>();

  steps.push({
    type: 'init-dfa',
    title: 'Initialize DFA',
    description: `Start with the DFA's initial state = {${nfa.initialState}} (the set containing only the NFA's initial state).`,
    highlightStates: initialSubset,
    data: { initialSubset, initialLabel },
  });

  const MAX_SUBSETS = 256;

  while (worklist.length > 0) {
    if (subsets.size > MAX_SUBSETS) {
      steps.push({
        type: 'complete',
        title: 'Warning: Large DFA',
        description: `Subset construction stopped after ${MAX_SUBSETS} DFA states. The automaton may be too large.`,
      });
      break;
    }

    const currentLabel = worklist.shift()!;
    if (processed.has(currentLabel)) continue;
    processed.add(currentLabel);

    const currentSubset = subsets.get(currentLabel)!;

    steps.push({
      type: 'process-subset',
      title: `Processing DFA state ${currentLabel}`,
      description: `Computing transitions from DFA state ${currentLabel} = NFA states {${currentSubset.join(', ')}} for each symbol in Σ = {${nfa.alphabet.join(', ')}}.`,
      highlightStates: currentSubset,
      data: { currentLabel, currentSubset },
    });

    if (!dfaTransitions.has(currentLabel)) {
      dfaTransitions.set(currentLabel, new Map());
    }

    for (const symbol of nfa.alphabet) {
      const nextStates = nfaMove(currentSubset, symbol);
      const nextLabel = subsetLabel(nextStates);

      dfaTransitions.get(currentLabel)!.set(symbol, nextLabel);

      steps.push({
        type: 'add-dfa-transition',
        title: `δ(${currentLabel}, ${symbol}) = ${nextLabel}`,
        description:
          nextStates.length === 0
            ? `No NFA state in {${currentSubset.join(', ')}} has a transition on '${symbol}'. Result: ∅ (dead state).`
            : `From NFA states {${currentSubset.join(', ')}} on symbol '${symbol}', we reach: {${nextStates.join(', ')}}.`,
        highlightStates: nextStates,
        data: { from: currentLabel, symbol, to: nextLabel, nextStates },
      });

      if (!subsets.has(nextLabel)) {
        subsets.set(nextLabel, nextStates);
        worklist.push(nextLabel);

        steps.push({
          type: 'add-dfa-state',
          title: `New DFA state: ${nextLabel}`,
          description: `Discovered new DFA state ${nextLabel} = {${nextStates.join(', ')}}.`,
          highlightStates: nextStates,
          data: { label: nextLabel, nfaStates: nextStates },
        });
      }
    }
  }

  // Build DFA automaton
  const dfaStates = Array.from(subsets.keys());
  const dfaAccepting: string[] = [];

  for (const [label, nfaStates] of subsets.entries()) {
    const isAccepting = nfaStates.some(s => nfa.acceptingStates.includes(s));
    const isInitial = label === initialLabel;
    const isDead = nfaStates.length === 0;

    if (isAccepting) dfaAccepting.push(label);

    subsetMapping.push({
      dfaState: label,
      nfaStates,
      isAccepting,
      isInitial,
      isDead,
    });
  }

  const dfaTransitionList = [];
  for (const [from, symMap] of dfaTransitions.entries()) {
    for (const [symbol, to] of symMap.entries()) {
      dfaTransitionList.push({ from, symbol, to });
    }
  }

  const dfa: Automaton = {
    states: dfaStates,
    alphabet: nfa.alphabet,
    initialState: initialLabel,
    acceptingStates: dfaAccepting,
    transitions: dfaTransitionList,
  };

  steps.push({
    type: 'complete',
    title: 'DFA Construction Complete',
    description: `The DFA has ${dfaStates.length} states. Accepting states: ${dfaAccepting.join(', ') || '(none)'}.`,
    data: { dfa, subsetMapping },
  });

  return { dfa, subsetMapping, steps };
}
