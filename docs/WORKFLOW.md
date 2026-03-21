# Development Workflow

All changes to Notemac++ go through pull requests with mandatory CI checks. No code is pushed directly to main.

## Branch Protection

The `main` branch has the following protections enforced:

- **Required status checks** — all 5 CI jobs must pass before a PR can be merged:
  - Unit Tests & Type Check
  - Web E2E Tests (Playwright)
  - Electron E2E Tests
  - Tauri E2E Tests (WebKit)
  - Tauri Binary Build & Rust Tests
- **Strict mode** — the branch must be up-to-date with main before merging
- **Admin enforcement** — no one can bypass the rules, including repo admins
- **Force pushes blocked**
- **Branch deletion blocked**

## Step-by-Step

### 1. Create a Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

Use descriptive branch names: `feature/shortcut-presets`, `fix/trailing-slash-e2e`, `docs/update-readme`, `refactor/normalize-shortcuts`.

### 2. Develop and Commit

Make changes, commit early and often. Run the type checker and tests locally before pushing.

```bash
git add <files>
git commit -m "feat: Add shortcut mapping presets"
npx tsc --noEmit && npx vitest run   # verify locally
```

### 3. Push and Open a PR

```bash
git push -u origin feature/your-feature-name
gh pr create --title "feat: Add shortcut mapping presets" --body "Summary of changes"
```

CI runs automatically on every PR targeting main. If the PR only changes docs, markdown, or other non-code files, the test jobs will pass immediately without running — no wasted CI time.

### 4. Wait for CI

All 5 required checks must pass. If any check fails: read the logs, fix the issue on your branch, push the fix. CI re-runs automatically. Repeat until green.

Tests must not use retries. If a test fails, the underlying code or test is fixed — not retried, not skipped, not disabled.

### 5. Merge

Once CI is green, merge the PR. Use squash merge for single-feature branches (cleaner history) or merge commit for branches with meaningful individual commits. Delete the feature branch after merging.

## Post-Merge Checklists

After every merge into main, complete the relevant checklists. These are mandatory.

### New Feature Checklist

**When:** After every PR that adds or modifies a feature.

**File:** `Notemac++ - New Feature Checklist.docx`

Covers: code quality, review & optimization, testing (unit + web E2E + Electron E2E), UI/UX, documentation, integration, and git/CI.

### New Version Release Checklist

**When:** When shipping a new version (after all features for the release are merged).

**File:** `Notemac++ - New Version Release Checklist.docx`

Covers: pre-release code review, pre-release verification, version bump, About dialog & UI, documentation, git & GitHub, GitHub Pages & web app, repo settings, and final smoke test.

## Quick Reference

| Action | Command |
|--------|---------|
| Create branch | `git checkout -b feature/name` |
| Push branch | `git push -u origin feature/name` |
| Open PR | `gh pr create --title "..." --body "..."` |
| Check CI status | `gh pr checks` |
| Update branch | `git pull origin main --rebase` |
| Merge PR | `gh pr merge --squash` |
| Delete branch | `git branch -d feature/name` |
| Run tests locally | `npx tsc --noEmit && npx vitest run` |
| Run web E2E | `npx playwright test` |
| Run Electron E2E | `npx playwright test --config=playwright-electron.config.ts` |
| Run Tauri E2E | `npx playwright test --config=playwright-tauri.config.ts` |

The full formatted version of this workflow is also available as `Notemac++ - Development Workflow.docx` in the project root.
