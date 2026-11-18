# Cross-chat continuity protocol (mandatory)

## Why chats lose flow
Chats have finite context. Memory and projects may help with preferences and high-level continuity but are **not guaranteed to supply exact latest code, branch, test output or pending blocker**. Treat Git-tracked handoff artifacts as the source of truth.

## At the START of every new chat or Codex session
1. Open GitHub repository `9o9ame/AH-POS`, confirm current branch/HEAD, inspect recent commits and working-tree changes if local.
2. Read in this order: `AGENTS.md`, `README.md`, `docs/MASTER_ARCHITECTURE.md`, `PROJECT_CURRENT_STATE.md`, `PROJECT_PROGRESS.md`, `PROJECT_MILESTONES.csv`, `PROJECT_CHANGELOG.md`, relevant `docs/decisions/` and `PROJECT_UI_DESIGN_SYSTEM.md` for UI work.
3. Read only task-relevant source files. Cross-check documentation claims against code/tests. Report discrepancies before modifying risky logic.
4. Announce current verified milestone, branch, accepted % and precise next pending step, based on evidence.
5. Continue the previous approved work; **do not reset** architecture or re-ask facts answered by repo files.

## During work
- Maintain an explicit milestone task list and acceptance evidence. Implement one scoped vertical slice. Never count untested code as accepted.
- On architecture changes, add an ADR. On migration knowledge, update schema/mapping; never invent source tables.
- Avoid writing real backup/customer data or secrets to public GitHub.
- After each milestone (and before context gets long), checkpoint current state, progress, changelog and current task status in the same branch as code.
- If repo cannot be committed, clearly say so, provide a compact handoff in chat and downloadable patch. Do not claim saved/pushed if not verified.

## At the END of every chat/work session — completion checklist
- [ ] `PROJECT_CURRENT_STATE.md` updated: current branch, HEAD, completed work, exact pending work, blockers, tests with commands/outcomes.
- [ ] `PROJECT_PROGRESS.md` and `PROJECT_MILESTONES.csv` updated **only for accepted evidence**.
- [ ] `PROJECT_CHANGELOG.md` updated with date and meaningful changes.
- [ ] Related ADR and feature docs updated.
- [ ] Documentation and source changes committed/pushed or clearly reported as pending.
- [ ] Final assistant message includes commit SHA, current status and exact next command/task.

## Standard new chat prompt
> Continue project AH-POS from https://github.com/9o9ame/AH-POS . Read AGENTS.md, README.md, docs/MASTER_ARCHITECTURE.md, PROJECT_CURRENT_STATE.md, PROJECT_PROGRESS.md, PROJECT_MILESTONES.csv, PROJECT_CHANGELOG.md, and docs/CHAT_HANDOFF_PROTOCOL.md. Inspect current branch and latest commits, reconcile docs with actual code, explain current confirmed status briefly, then continue **only the next approved milestone**. P0 source SQL Server backup restoration/schema inventory must come before target schema assumptions. Maintain tenant isolation, accounting/stock integrity and original global UI design. Do not fabricate tests, migrations or completion. At milestone end update and commit handoff documents, so another chat can resume without relying on memory.

## Additional reliability
- Keep one ChatGPT **Project** for AH-POS if available; add concise project instructions pointing to repo sources and prefer opening chats within that project. This helps discovery but doesn't replace files.
- Use GitHub issues / PRs for durable work breakdown and approvals; mention issue number in current-state.
- Optional CI: add a future pre-merge check to detect missing mandatory current-state/progress updates for meaningful feature changes; don't enforce it for trivial docs without review.
- Limit context consumption by reading only high-signal source-of-truth docs and task-relevant files, not reprinting whole histories.
