import { Automaton } from '../types/automaton';
import { simulateEpsilonNfa, simulateNfa, simulateDfa } from './simulation';

export interface EquivalenceReport {
  tested: number;
  mismatches: Array<{ string: string; epsilonNfaResult: boolean; nfaResult: boolean | null; dfaResult: boolean | null }>;
  allAgree: boolean;
  boundedNote: string;
}

/**
 * Generates all strings up to maxLength over an alphabet.
 */
export function generateTestStrings(alphabet: string[], maxLength: number): string[] {
  const results: string[] = [''];
  const queue: string[] = [''];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.length >= maxLength) continue;
    for (const symbol of alphabet) {
      const next = current + symbol;
      results.push(next);
      queue.push(next);
    }
  }

  return results;
}

/**
 * Compares acceptance across ε-NFA, NFA, and DFA for all strings up to maxLength.
 */
export function testEquivalence(
  epsilonNfa: Automaton,
  nfa: Automaton | null,
  dfa: Automaton | null,
  maxLength: number = 5
): EquivalenceReport {
  const strings = generateTestStrings(epsilonNfa.alphabet, maxLength);
  const mismatches: EquivalenceReport['mismatches'] = [];

  for (const str of strings) {
    const epsilonNfaResult = simulateEpsilonNfa(epsilonNfa, str).accepted;
    const nfaResult = nfa ? simulateNfa(nfa, str).accepted : null;
    const dfaResult = dfa ? simulateDfa(dfa, str).accepted : null;

    const agree =
      (nfaResult === null || epsilonNfaResult === nfaResult) &&
      (dfaResult === null || epsilonNfaResult === dfaResult);

    if (!agree) {
      mismatches.push({ string: str, epsilonNfaResult, nfaResult, dfaResult });
    }
  }

  return {
    tested: strings.length,
    mismatches,
    allAgree: mismatches.length === 0,
    boundedNote: `This is bounded testing over all strings of length ≤ ${maxLength}. It does not constitute a formal proof of equivalence.`,
  };
}
