import { Automaton } from '../types/automaton';

export const EXAMPLE_AUTOMATON: Automaton = {
  states: ['q0', 'q1', 'q2'],
  alphabet: ['a', 'b'],
  initialState: 'q0',
  acceptingStates: ['q2'],
  transitions: [
    { from: 'q0', symbol: 'ε', to: 'q1' },
    { from: 'q0', symbol: 'a', to: 'q0' },
    { from: 'q1', symbol: 'a', to: 'q1' },
    { from: 'q1', symbol: 'b', to: 'q2' },
    { from: 'q2', symbol: 'b', to: 'q2' },
  ],
};

export const EXAMPLE_TEST_STRINGS = ['', 'a', 'b', 'ab', 'aab', 'abb', 'aaabbb', 'ba'];

export const EXAMPLE_DESCRIPTION = `
This ε-NFA recognizes strings that consist of zero or more 'a's followed by at least one 'b',
with additional 'b's allowed after the first one. Specifically, it recognizes the language:
{ aⁿbᵐ | n ≥ 0, m ≥ 1 }.
`;
