# AgentArena ⚔️🤖

AgentArena is a multi-agent orchestration and simulation framework built with **Next.js 16**, **React 19**, and **Zustand**. It enables AI agents to collaborate or compete through structured, multi-phase problem-solving workflows (Decompose, Investigate, Propose, Debate, Critique, Revise, Judge, Synthesize, and Results) with real-time SSE event streaming and interactive controls.

---

## 🚀 What the Project Does

- **Multi-Agent Orchestration**: Coordinate multiple AI agents in either **Collaborative** or **Competitive** modes to break down and solve complex real-world challenges.
- **Multi-Phase Workflow**: Orchestrates agents across distinct execution phases:
  1. **Decompose**: Deconstructs complex prompts into manageable subproblems.
  2. **Investigate**: Gathers evidence, data, and context.
  3. **Propose**: Generates independent candidate solutions.
  4. **Debate**: Facilitates agent-to-agent cross-examination.
  5. **Critique**: Aggressively tests and identifies risks in proposals.
  6. **Revise**: Refines approaches based on feedback.
  7. **Judge**: Scores and evaluates proposals across metrics (feasibility, cost, impact, risk).
  8. **Synthesize**: Merges insights into a final comprehensive recommendation.
  9. **Results**: Generates key findings, evidence items, scoreboards, and timeline visualization.
- **Real-Time SSE Event Streaming**: Live updates streamed to the frontend UI as events occur in the engine.
- **Interactive Controls**: Full control over simulation execution, including Play/Pause playback, server-side Abort cancellation, and offline Replay.
- **Multiple Provider Support**: Supports OpenAI, Gemini, Claude, Ollama, as well as a zero-cost local Mock provider for testing.

---

## 🛠️ How to Run It

### Prerequisites

- **Node.js**: v18.x or higher
- **npm** (or `yarn` / `pnpm` / `bun`)

### Steps

1. **Clone the repository** (if not already local):
   ```bash
   git clone <repository-url>
   cd "Agent Arena"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables** (Optional):
   Create a `.env.local` file in the root directory if using live LLM providers:
   ```env
   OPENAI_API_KEY=your_openai_api_key
   GEMINI_API_KEY=your_gemini_api_key
   ```
   *(Note: The application includes a Mock provider that works without API keys for local development.)*

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```

5. **Access the App**:
   Open [http://localhost:3000](http://localhost:3000) in your web browser.

6. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

---

## 🤖 What We Built with AO (Agent Orchestrator)

We used **AO (Agent Orchestrator)** with the **AGY** agent to work on our existing AgentArena codebase.

### Workflow & Experience

- **Connected Existing Repository**: Connected our existing AgentArena Git repository directly to AO.
- **Read-Only Analysis**: Used an AO agent session to first analyze the existing codebase without modifying any files. The agent identified incomplete functionality and key technical debt/issues.
- **Focused Task Assignment**: We gave the agent a focused task to implement missing Play, Abort, and Replay functionality.
- **Isolated Worktree**: AO provided an isolated worktree for the agent, allowing it to modify the project without directly affecting our main working copy.
- **System Inspection**: The agent inspected the existing:
  - Arena engine
  - Zustand state
  - SSE streaming
  - Arena API
  - Existing controls
- **Implementation Executed**: Instructed the agent to implement:
  - **Play/Pause**: For event playback control.
  - **Abort**: With server-side cancellation.
  - **Replay**: Using previously recorded events without calling the AI again.
- **Verification**: The agent then ran the relevant checks and reported the implementation.
