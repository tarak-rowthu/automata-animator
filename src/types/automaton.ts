// Core automaton types

export interface Transition {
  from: string;
  symbol: string;
  to: string;
}

export interface Automaton {
  states: string[];
  alphabet: string[];
  initialState: string;
  acceptingStates: string[];
  transitions: Transition[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface EpsilonClosureMap {
  [state: string]: string[];
}

export interface ConversionStep {
  type: string;
  title: string;
  description: string;
  highlightStates?: string[];
  highlightTransitions?: Transition[];
  data?: Record<string, unknown>;
}

export interface EpsilonNfaToNfaResult {
  nfa: Automaton;
  epsilonClosures: EpsilonClosureMap;
  steps: ConversionStep[];
}

export interface DFASubsetMapping {
  dfaState: string;
  nfaStates: string[];
  isAccepting: boolean;
  isInitial: boolean;
  isDead: boolean;
}

export interface NfaToDfaResult {
  dfa: Automaton;
  subsetMapping: DFASubsetMapping[];
  steps: ConversionStep[];
}

export interface SimulationStep {
  symbol: string | null;
  activeStates: string[];
  transition?: { from: string[]; symbol: string; to: string[] };
  epsilonClosure?: string[];
  description: string;
}

export interface SimulationResult {
  accepted: boolean;
  steps: SimulationStep[];
  explanation: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: string;
}

export interface Lesson {
  id: number;
  title: string;
  content: LessonSection[];
}

export interface LessonSection {
  type: 'text' | 'math' | 'example' | 'warning' | 'tip';
  content: string;
  title?: string;
}

// Using a const array + derived type to ensure runtime availability
export const APP_PAGES = [
  'home',
  'builder',
  'epsilon-nfa-to-nfa',
  'nfa-to-dfa',
  'simulator',
  'learning',
  'quiz',
  'presentation',
  'settings',
] as const;

export type AppPage = (typeof APP_PAGES)[number];
