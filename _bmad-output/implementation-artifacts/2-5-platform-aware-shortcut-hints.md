# Story 2.5: Platform-Aware Shortcut Hints

Status: done

## Story

As a graph editor user,
I want shortcut hints to match my operating system,
so that I can quickly learn commands without translating key labels.

## Acceptance Criteria

1. Shortcut hints show `Cmd`-style labels on macOS and `Ctrl`-style labels on Windows/Linux.
2. Auto Layout hint uses `Option` label on macOS and `Alt` label on Windows/Linux.
3. Existing shortcut behavior remains unchanged and still supports both Ctrl and Cmd modifiers.
4. Feature works without breaking existing validation, save/export, and undo/redo flows.

## Tasks / Subtasks

- [x] Add platform detection for shortcut hint labels (AC: 1, 2)
  - [x] Detect macOS platform from browser navigator metadata
  - [x] Compute shortcut hint strings from platform-specific modifier labels
- [x] Render platform-specific hints in shortcut panel (AC: 1, 2)
  - [x] Replace hardcoded shortcut hint text with derived labels
- [x] Verify behavior and compatibility (AC: 3, 4)
  - [x] Confirm shortcut resolver behavior remains unchanged
  - [x] Add integration test for macOS hint rendering
  - [x] Run targeted tests and production build

## Dev Notes

- Keep shortcut resolver behavior unchanged to avoid keybinding regressions.
- Scope this story to hint labels only; no new command mappings introduced.
- Reuse existing App integration test setup for behavior verification.

### Project Structure Notes

- Logic changes: src/App.tsx
- Test changes: src/App.integration.test.tsx
- Documentation updates: README.md and story artifact fields

### References

- Source: README.md notes section and existing shortcut UX.

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Debug Log References

- npm test -- --run src/history.test.ts src/shortcuts.test.ts src/App.integration.test.tsx
- npm run build

### Completion Notes List

- Added platform-aware shortcut hint labels in the App UI.
- macOS now shows `Cmd`/`Option` hints while other platforms continue using `Ctrl`/`Alt`.
- Kept existing shortcut dispatch logic unchanged so Ctrl/Cmd behavior still works.
- Added integration test coverage for macOS shortcut hint rendering.

### File List

- src/App.tsx
- src/App.integration.test.tsx
- README.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- _bmad-output/implementation-artifacts/2-5-platform-aware-shortcut-hints.md

### Change Log

- 2026-03-12: Implemented story 2.5 platform-aware shortcut hints and verified compatibility with existing flows.
