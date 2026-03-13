# Story 2.4: Undo/Redo History Controls

Status: ready-for-dev

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

- [ ] Add history state model for graph snapshots (AC: 1)
  - [ ] Track `past`, `present`, and `future` graph snapshots
  - [ ] Capture snapshots for core graph operations
  - [ ] Clear redo stack when a new change is introduced
- [ ] Add Undo and Redo actions (AC: 1, 2)
  - [ ] Implement undo handler
  - [ ] Implement redo handler
  - [ ] Add toolbar buttons with disabled state logic
- [ ] Add keyboard shortcuts (AC: 3)
  - [ ] Map `Ctrl+Z` to undo
  - [ ] Map `Ctrl+Shift+Z` to redo
  - [ ] Prevent shortcut handling while typing in text inputs
- [ ] Verify compatibility with existing flows (AC: 4)
  - [ ] Confirm validation updates correctly after undo/redo
  - [ ] Confirm export/save/load still work after history operations

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

### Completion Notes List

### File List

### Change Log
