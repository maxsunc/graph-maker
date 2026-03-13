# Story 2.4: Undo/Redo History Controls

Status: done

## Story

As a graph editor user,
I want undo and redo controls,
so that I can recover from mistakes and iterate on graph edits safely.

## Acceptance Criteria

1. The editor supports undo and redo for core graph operations (add node, delete node, move node, connect/disconnect edges, edit node title/description, auto layout).
2. Toolbar buttons for Undo and Redo are visible and correctly disabled when no action is available.
3. Keyboard shortcuts are supported on Windows assumptions:
   - `Ctrl+Z` for Undo
   - `Ctrl+Shift+Z` for Redo
4. Undo/redo integrates with existing validation, export, and save/load features without breaking current behavior.

## Tasks / Subtasks

- [x] Add history state model for graph snapshots (AC: 1)
  - [x] Track `past`, `present`, and `future` graph snapshots
  - [x] Capture snapshots for core graph operations
  - [x] Clear redo stack when a new change is introduced
- [x] Add Undo and Redo actions (AC: 1, 2)
  - [x] Implement undo handler
  - [x] Implement redo handler
  - [x] Add toolbar buttons with disabled state logic
- [x] Add keyboard shortcuts (AC: 3)
  - [x] Map `Ctrl+Z` to undo
  - [x] Map `Ctrl+Shift+Z` to redo
  - [x] Prevent shortcut handling while typing in text inputs
- [x] Verify compatibility with existing flows (AC: 4)
  - [x] Confirm validation updates correctly after undo/redo
  - [x] Confirm export/save/load still work after history operations

## Dev Notes

- Keep implementation dependency-free and local to current editor architecture.
- Prefer extracting pure helper logic for history state transitions to improve testability.
- Continue Windows-first shortcut hints and existing shortcut safety rules.

### Project Structure Notes

- Logic changes: src/App.tsx and extracted helper modules if needed
- Style changes: src/styles.css (for button states if required)
- Documentation updates: README.md and story artifact fields after implementation

### References

- Source: README.md product scope and delivered features.

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Debug Log References

- npm test
- npm run build

### Completion Notes List

- Added graph history model with `past`, `present`, and `future` snapshots.
- Implemented Undo/Redo toolbar actions with disabled states.
- Added keyboard shortcuts `Ctrl+Z` and `Ctrl+Shift+Z` with text-input safety.
- Kept validation/export/save/load behavior working after history operations.
- Added targeted unit tests for history transitions and shortcut resolution.
- Refined drag history behavior so one drag gesture maps to one undo step.
- Added no-op guard for auto-layout to avoid empty undo entries.
- Added App integration tests for undo/redo compatibility with validation and save behavior.

### File List

- src/App.tsx
- src/history.ts
- src/history.test.ts
- src/shortcuts.ts
- src/shortcuts.test.ts
- src/styles.css
- src/App.integration.test.tsx
- README.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- _bmad-output/implementation-artifacts/2-4-undo-redo-history-controls.md

### Change Log

- 2026-03-12: Implemented story 2.4 undo/redo history controls and marked story ready for review.
- 2026-03-12: Applied code-review fixes for drag history granularity, no-op auto-layout tracking, and integration test coverage.
