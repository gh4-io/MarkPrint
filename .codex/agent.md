# Codex Agents – VS Code Cheat Sheet

> This assumes `~/.codex/config.toml` defines agents: `default`, `code`, and `research`
> and that the VS Code Codex extension is installed and using that config.

---

## How to Switch Agents in VS Code

- Open the **Codex / Chat** panel in VS Code.
- Look for the **Agent / Profile** dropdown (usually near the top of the panel).
- Select one of:
  - `default`
  - `code`
  - `research`
- All messages you send in that panel will use that agent’s:
  - `model`
  - `model_reasoning_effort`
  - `context_window`
  - `max_output_tokens`
  - `allowed_mcp_servers` (e.g. `ref`)

> Tip: keep the `default` agent selected most of the time; switch to `code` or `research` when you know you need “heavier” behavior.

---

## Agent Overview

### `default` – Quick Chat / Lightweight Help
- **Use when:**
  - Asking short questions (“What does git rebase do?”)
  - Getting small code snippets or explanations
  - You want fast responses and don’t care about big context
- **Typical config:**
  - `model = "gpt-5"`
  - `model_reasoning_effort = "low"`
  - `context_window ≈ 16k`
  - `max_output_tokens ≈ 2k`
  - `allowed_mcp_servers = []` (no tools)

---

### `code` – Deep Code Work / Debugging
- **Use when:**
  - You want full help on writing, refactoring, or debugging code
  - You’re working across multiple files or a larger codebase
  - You want stronger reasoning for tricky bugs or design changes
- **Typical config:**
  - `model = "gpt-5-reasoning"`
  - `model_reasoning_effort = "high"`
  - `context_window ≈ 131k` (big enough for multi-file context)
  - `max_output_tokens ≈ 8k` (long code blocks + explanations)
  - `allowed_mcp_servers = ["ref"]` (or more, if you add tools)

> Use this agent when you’re actively building or modifying code in the repo.

---

### `research` – Heavy Research / Long Reports
- **Use when:**
  - You want it to “pull in a lot and return a lot”
  - You’re comparing options, reading large docs, or doing architecture research
  - You expect a long, structured answer (sections, pros/cons, recommendations)
- **Typical config:**
  - `model = "gpt-5-reasoning"`
  - `model_reasoning_effort = "high"`
  - `context_window ≈ 160k` (large intake)
  - `max_output_tokens ≈ 12k` (long-form output)
  - `allowed_mcp_servers = ["ref"]` (and any other research tools)

> Use this agent when you want “read a lot, think hard, then give me a serious write-up.”

---

## Example Prompts by Agent

- **default**
  - “Explain the difference between `git pull` and `git fetch`.”
  - “What does this error mean?” (paste a short stack trace)

- **code**
  - “Refactor this function to be more testable and then write Jest tests for it.”
  - “Look at these three files and suggest a better module structure.”

- **research**
  - “Compare three options for implementing auth in this Node.js app: session cookies, JWT, and OAuth. Include pros/cons and a recommendation for this project.”
  - “Read the files in `./docs/` and summarize the current system architecture and its main risks.”

---

## Notes About Access / Sandbox

- In VS Code, the extension still **mediates file and tool access**.
- Your agents’ settings control **how they think and how much they can read/write in a single response**, but VS Code:
  - decides which files are sent,
  - keeps access scoped to the workspace / selections,
  - keeps things sandboxed for safety.

Use bigger `context_window` + `max_output_tokens` on `code` and `research` to take advantage of larger inputs and longer answers when the extension sends them.
