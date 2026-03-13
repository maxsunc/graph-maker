# Story 2.2: Graph Editor Productivity Tools

Status: ready-for-dev

## Story

As a graph editor user,
I want faster editing controls,
so that I can build and adjust diagrams with less friction.

## Acceptance Criteria

1. The editor snaps node movement to a visible grid.
2. Keyboard shortcuts are supported for common actions: delete selected node, save JSON, and export PNG.
3. Shortcut hints are visible in the UI.
4. Productivity features work alongside existing DAG validation and export guardrails.

## Tasks / Subtasks

- [ ] Add snap-to-grid editing behavior (AC: 1)
  - [ ] Enable grid snapping on node drag/move
- [ ] Add keyboard shortcuts (AC: 2)
  - [ ] Delete selected node with Delete/Backspace
  - [ ] Save JSON with Ctrl/Cmd+S
  - [ ] Export PNG with Ctrl/Cmd+E
- [ ] Add UI hint panel for shortcuts (AC: 3)
  - [ ] Render shortcut legend in the app shell
- [ ] Ensure integration with existing validation/export rules (AC: 4)
  - [ ] Keep export blocked when graph is invalid even via keyboard shortcut

## Dev Notes

- Core editor behavior is in src/App.tsx.
- Keep implementation client-side and lightweight.
- Reuse existing action handlers where possible.

### Project Structure Notes

- Logic changes: src/App.tsx
- Style changes: src/styles.css
- Documentation updates: README.md

### References

- Source: README.md product scope and delivered features.

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Debug Log References

### Completion Notes List

### File List

### Change Log
