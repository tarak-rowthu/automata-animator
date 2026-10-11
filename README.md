# Automata Animator

> **An Interactive Epsilon-NFA to NFA and DFA Conversion, Simulation, and Language Recognition Tool**  
> *Designed for Formal Languages & Automata Theory (FLAT) education and academic presentations.*

[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-50%2F50%20Passing-success?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Deploy](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel&logoColor=white)](https://vercel.com/)

---

## 📌 Project Overview

**Automata Animator** is a comprehensive educational web application created to demonstrate core theoretical computer science concepts:
1. Converting an **$\varepsilon$-NFA** (Nondeterministic Finite Automaton with $\varepsilon$-transitions) into an equivalent **NFA** (without $\varepsilon$-transitions).
2. Converting an **NFA** into an equivalent **DFA** (Deterministic Finite Automaton) using the **Subset Construction Algorithm** (Powerset Construction).
3. Simulating string acceptance character-by-character simultaneously across all three representations to verify language equivalence.

---

## ✨ Features

- **Interactive State Diagram Builder**:
  - Add, reposition (drag-and-drop), and delete states ($Q$).
  - Configure alphabet symbols ($\Sigma$) and add transitions ($\delta$), including $\varepsilon$-transitions.
  - Designate initial state ($q_0$) and final/accepting states ($F$).
  - Import/Export automaton models in standard JSON format.
  - Preloaded canonical examples (such as $(a \mid b)^*abb$).

- **$\varepsilon$-NFA $\rightarrow$ NFA Conversion**:
  - Step-by-step computation and visualization of **$\varepsilon$-closure** for every state: $\varepsilon\text{-closure}(q)$.
  - Step-by-step calculation of the new transition function:
    $$\delta'(q, a) = \varepsilon\text{-closure}\left(\bigcup_{p \in \varepsilon\text{-closure}(q)} \delta(p, a)\right)$$
  - Computation of new final states: $F' = \{q \in Q \mid \varepsilon\text{-closure}(q) \cap F \neq \emptyset\}$.
  - Interactive comparison tables and elimination diagrams.

- **NFA $\rightarrow$ DFA Subset Construction**:
  - Systematic power-set exploration starting from the initial state subset.
  - Step-by-step subset transition calculations:
    $$\delta_D(S, a) = \bigcup_{s \in S} \delta(s, a)$$
  - Dynamic DFA state naming ($A, B, C, \dots$) with mapping to original state sets (e.g., $\{q_0, q_1\}$).
  - Identification of trap/dead states and final states ($F_D = \{S \subseteq Q \mid S \cap F \neq \emptyset\}$).

- **Multi-Automaton String Simulator**:
  - Live character-by-character string tracing with animation tape.
  - Synchronous side-by-side execution on $\varepsilon$-NFA, NFA, and DFA to demonstrate language equivalence.
  - Play, pause, step forward/backward, and playback speed slider.
  - Final verdict with explanation of acceptance or rejection.
  - Automated bounded equivalence testing across all strings up to length $k$.

- **FLAT Learning Hub & Presentation Mode**:
  - Formal 5-tuple theoretical definitions ($Q, \Sigma, \delta, q_0, F$).
  - Fullscreen slide deck mode for classroom and faculty presentations.
  - Interactive knowledge-check quiz with instant feedback and scoring.

---

## 🛠️ Technology Stack

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite 8.3](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict typing, ESNext)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + Custom Glassmorphic Dark Design System (`src/index.css`)
- **Animations & Icons**: [Framer Motion](https://www.framer.com/motion/) & [Lucide React](https://lucide.dev/)
- **Diagrams / Graphs**: Custom SVG Automaton Graph Visualizer & [@xyflow/react](https://reactflow.dev/)
- **Unit Testing**: [Vitest](https://vitest.dev/) (50/50 test cases covering algorithms and simulations)
- **Deployment**: [Vercel](https://vercel.com/) (configured via `vercel.json` SPA rewrites)

---

## 🧮 Theoretical Background

### 1. $\varepsilon$-NFA to NFA Conversion
1. **$\varepsilon$-Closure Definition**:
   $\varepsilon\text{-closure}(q)$ is the set of all states reachable from $q$ following zero or more $\varepsilon$-transitions:
   $$\varepsilon\text{-closure}(q) = \{ p \in Q \mid q \xrightarrow{\varepsilon^*} p \}$$
2. **Transition Function Without $\varepsilon$**:
   For every state $q \in Q$ and input symbol $a \in \Sigma$:
   $$\delta'(q, a) = \varepsilon\text{-closure}(\delta(\varepsilon\text{-closure}(q), a))$$
3. **Accepting States**:
   A state $q$ becomes accepting in the new NFA if its $\varepsilon$-closure contains at least one original accepting state:
   $$F' = \{ q \in Q \mid \varepsilon\text{-closure}(q) \cap F \neq \emptyset \}$$

### 2. NFA to DFA Subset Construction
1. **Initial State**:
   $$q_{0, DFA} = \{ q_0 \} \quad (\text{or } \varepsilon\text{-closure}(q_0) \text{ if starting from } \varepsilon\text{-NFA})$$
2. **State Transition**:
   For any subset $S \subseteq Q$ and symbol $a \in \Sigma$:
   $$\delta_D(S, a) = \bigcup_{s \in S} \delta(s, a)$$
3. **Accepting Condition**:
   Any subset containing at least one state from $F$ is an accepting state in the DFA:
   $$F_D = \{ S \subseteq Q \mid S \cap F \neq \emptyset \}$$

---

## 🚀 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended, Node.js 20+ preferred)
- [npm](https://www.npmjs.com/) (included with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/automata-animator.git

# Navigate into the project directory
cd automata-animator

# Install dependencies
npm install
```

### Development Server

```bash
npm run dev
```
The application will be available at `http://localhost:5173/`.

### Running Tests

```bash
# Run unit test suite once
npm run test:run

# Run unit tests in interactive watch mode
npm run test
```

### Production Build

```bash
# Typecheck and compile production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🚢 Deployment on Vercel

The application includes a pre-configured [`vercel.json`](./vercel.json) tailored for single-page applications (SPAs):

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Method 1: Deploy via Vercel Dashboard (Recommended)
1. Push this repository to your GitHub account (see instructions below).
2. Go to [Vercel](https://vercel.com/) and sign in.
3. Click **Add New** $\rightarrow$ **Project**.
4. Import your **`automata-animator`** repository.
5. Vercel automatically detects the **Vite** framework preset with:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
6. Click **Deploy**. Vercel will build and deploy the app with automatic CI/CD on every push to `main`.

### Method 2: Deploy via Vercel CLI
```bash
# Install Vercel CLI globally (or run via npx)
npm install -g vercel

# Authenticate with Vercel
vercel login

# Deploy to production
vercel --prod
```

---

## 📁 Project Structure

```
FLA1/
├── src/
│   ├── algorithms/               # Formal TCS algorithm implementations
│   │   ├── automatonValidation.ts
│   │   ├── epsilonClosure.ts
│   │   ├── epsilonNfaToNfa.ts
│   │   ├── equivalenceTesting.ts
│   │   ├── nfaToDfa.ts
│   │   └── simulation.ts
│   ├── components/               # UI & visualization components
│   │   ├── automaton/
│   │   │   └── AutomatonCanvas.tsx
│   │   └── layout/
│   │       └── Sidebar.tsx
│   ├── data/                     # Examples and quiz questions
│   │   ├── exampleAutomaton.ts
│   │   └── quizQuestions.ts
│   ├── pages/                    # Main views
│   │   ├── BuilderPage.tsx
│   │   ├── EpsilonNfaToNfaPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── LearningPage.tsx
│   │   ├── NfaToDfaPage.tsx
│   │   ├── PresentationPage.tsx
│   │   ├── QuizPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── SimulatorPage.tsx
│   ├── types/                    # Formal 5-tuple and state typing
│   │   └── automaton.ts
│   ├── App.tsx                   # Main state & page router
│   ├── index.css                 # Dark theme design system tokens
│   └── main.tsx                  # React entry point
├── tests/                        # Vitest automated test suite
│   └── algorithms.test.ts
├── vercel.json                   # Vercel deployment & rewrite configuration
├── .env.example                  # Environment variable reference
├── .gitignore                    # Git exclusion rules
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
