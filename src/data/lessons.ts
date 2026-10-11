import { Lesson } from '../types/automaton';

export const LESSONS: Lesson[] = [
  {
    id: 1,
    title: 'What Is a Finite Automaton?',
    content: [
      {
        type: 'text',
        content:
          'A finite automaton (FA) is a mathematical model of computation. It is a machine that reads an input string symbol by symbol, changes its internal state based on what it reads, and at the end declares whether the string is accepted or rejected.',
      },
      {
        type: 'text',
        title: 'The Five Components',
        content:
          'A finite automaton is defined by five components: (1) Q — a finite set of states, (2) Σ — a finite input alphabet, (3) δ — a transition function, (4) q₀ ∈ Q — the initial (start) state, and (5) F ⊆ Q — a set of accepting (final) states.',
      },
      {
        type: 'example',
        title: 'Simple Example',
        content:
          'Consider an automaton with Q = {q0, q1}, Σ = {a, b}, initial state q0, accepting state q1. A transition δ(q0, a) = q1 means: if in state q0 and reading "a", move to q1. The string "a" is accepted because we end in q1.',
      },
      {
        type: 'tip',
        content:
          'In a state diagram, states are drawn as circles. The initial state has an incoming arrow. Accepting states have double circles.',
      },
    ],
  },
  {
    id: 2,
    title: 'Understanding ε-NFAs',
    content: [
      {
        type: 'text',
        content:
          'An ε-NFA (Epsilon Non-deterministic Finite Automaton) is an extension of a basic NFA that allows spontaneous transitions — called epsilon (ε) transitions — that occur without consuming any input symbol.',
      },
      {
        type: 'text',
        title: 'Two Sources of Non-determinism',
        content:
          'An ε-NFA has two forms of non-determinism: (1) Multiple transitions for the same state and symbol — the machine can "choose" which one to take. (2) Epsilon transitions — the machine can change state without reading any input.',
      },
      {
        type: 'example',
        title: 'Epsilon Transition Example',
        content:
          'If q0 —ε→ q1, the automaton can move from q0 to q1 without reading any symbol. This means q0 and q1 are "equivalent starting positions." Epsilon transitions are useful for constructing automata in pieces and then connecting them.',
      },
      {
        type: 'warning',
        content:
          'Epsilon is not a symbol in the alphabet Σ. It represents the absence of input. You cannot literally input "ε" as a character.',
      },
    ],
  },
  {
    id: 3,
    title: 'Epsilon Closure',
    content: [
      {
        type: 'text',
        content:
          'The epsilon closure of a state q, written ε-closure(q), is the set of all states reachable from q using zero or more epsilon transitions. Importantly, q is always in its own epsilon closure.',
      },
      {
        type: 'math',
        title: 'Formal Definition',
        content:
          'ε-closure(q) = smallest set S such that:\n(1) q ∈ S\n(2) If r ∈ S and r —ε→ s, then s ∈ S',
      },
      {
        type: 'example',
        title: 'Computing ε-closure',
        content:
          'Suppose q0 —ε→ q1 and q1 —ε→ q2. Then:\n• ε-closure(q0) = {q0, q1, q2}\n• ε-closure(q1) = {q1, q2}\n• ε-closure(q2) = {q2}\nNote: ε-closures are computed per-state using a BFS/DFS from that state.',
      },
      {
        type: 'tip',
        content:
          'Use a stack or queue. Start with state q. Pop a state, add it to the closure, and push all its ε-successors that are not yet in the closure. Repeat until the stack is empty.',
      },
    ],
  },
  {
    id: 4,
    title: 'Converting ε-NFA to NFA',
    content: [
      {
        type: 'text',
        content:
          'Every ε-NFA can be converted to an equivalent NFA (without ε-transitions) using the epsilon closure. The key idea: if we can silently move from q to p via ε-transitions, then any transition from p should also be available from q.',
      },
      {
        type: 'math',
        title: 'New Transition Function',
        content:
          "δ'(q, a) = ε-closure( ⋃ δ(p, a) for all p ∈ ε-closure(q) )\n\nStep 1: Find ε-closure(q) — all states silently reachable from q.\nStep 2: From each of those states, follow symbol 'a' transitions.\nStep 3: Take the ε-closure of all reached states.",
      },
      {
        type: 'math',
        title: 'New Accepting States',
        content:
          "F' = { q ∈ Q | ε-closure(q) ∩ F ≠ ∅ }\n\nA state q becomes accepting if any state in its ε-closure is accepting in the original ε-NFA. This ensures that if the automaton can silently reach an accepting state, it should also accept from q.",
      },
      {
        type: 'warning',
        content:
          'The state set Q and initial state q₀ remain unchanged. Only the transition function and accepting states change. Do not merge states or replace q₀ with its epsilon closure.',
      },
    ],
  },
  {
    id: 5,
    title: 'Converting NFA to DFA (Subset Construction)',
    content: [
      {
        type: 'text',
        content:
          'The subset construction algorithm converts any NFA to an equivalent DFA. Each DFA state represents a subset of NFA states — the set of all NFA states that could be active simultaneously.',
      },
      {
        type: 'math',
        title: 'Algorithm Steps',
        content:
          '1. Start with DFA state {q₀} (NFA\'s initial state).\n2. For each DFA state S and input symbol a:\n   δ_DFA(S, a) = ⋃ δ_NFA(q, a) for every q ∈ S\n3. If the result is a new subset, add it as a new DFA state.\n4. Repeat until no new DFA states are discovered.\n5. A DFA state is accepting if it contains any NFA accepting state.',
      },
      {
        type: 'example',
        title: 'Dead State',
        content:
          "If δ_DFA(S, a) = ∅ (no NFA state has an 'a'-transition from S), create the dead state ∅. The dead state has self-loops: δ(∅, x) = ∅ for every x ∈ Σ.",
      },
      {
        type: 'tip',
        content:
          'An NFA with n states can have at most 2ⁿ DFA states (one for each subset). In practice, many subsets are unreachable and are never generated.',
      },
    ],
  },
  {
    id: 6,
    title: 'Language Recognition',
    content: [
      {
        type: 'text',
        content:
          'A finite automaton processes a string symbol by symbol, starting in the initial state. After reading the entire string, it checks whether the current state (or any current state, for NFA) is an accepting state.',
      },
      {
        type: 'text',
        title: 'NFA Acceptance',
        content:
          'An NFA accepts a string if there exists at least one sequence of transitions (including non-deterministic choices) that leads from the initial state to an accepting state after reading the entire string.',
      },
      {
        type: 'text',
        title: 'DFA Acceptance',
        content:
          'A DFA accepts a string if the unique computation (one path, since DFAs are deterministic) ends in an accepting state.',
      },
      {
        type: 'example',
        title: 'Empty String',
        content:
          "The empty string ε is accepted by an automaton if and only if its initial state is an accepting state. For an ε-NFA, it is accepted if any state in ε-closure(q₀) is accepting.",
      },
      {
        type: 'warning',
        content:
          'Common mistake: thinking that an NFA needs all paths to accept. Only one accepting path is needed. If any path leads to an accepting state, the string is accepted.',
      },
    ],
  },
];
