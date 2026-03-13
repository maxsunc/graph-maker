# Story 2.3: Auto Layout for DAG Graphs

Status: review

## Story

As a graph editor user,
I want a one-click auto layout,
so that I can quickly organize large graphs into a readable structure.

## Acceptance Criteria

1. The editor provides an Auto Layout action in the toolbar.
2. Auto Layout arranges nodes by graph depth (left-to-right) while preserving DAG directionality.
3. Node positions are updated in one operation and can be further adjusted manually.
4. Feature works without breaking existing validation, export, and shortcut behavior.

## Tasks / Subtasks

- [x] Add layout computation for DAG graphs (AC: 2)
  - [x] Compute node depth levels from incoming edges
  - [x] Handle multiple roots and disconnected components
  - [x] Assign deterministic positions by level and order
- [x] Add Auto Layout user action (AC: 1, 3)
  - [x] Add toolbar button for Auto Layout
  - [x] Add keyboard shortcut Ctrl+Alt+L for Auto Layout
- [x] Ensure compatibility with existing features (AC: 4)
  - [x] Keep validation behavior unchanged
  - [x] Keep export actions working after layout updates

## Dev Notes

- Keep implementation local in src/App.tsx.
- Avoid adding new dependencies.
- Continue Windows-first shortcut hints.
- Use a browser-safer shortcut combo for Auto Layout.

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

- npm run build

### Completion Notes List

- Added a dependency-free DAG auto-layout algorithm based on node depth levels.
- Added deterministic placement for multiple roots and disconnected components.
- Added Auto Layout toolbar action and Ctrl+Alt+L shortcut.
- Kept existing validation and export guardrails unchanged.
- Added unit tests for layout determinism/depth behavior and shortcut resolution.

### File List

- src/App.tsx
- src/layout.ts
- src/shortcuts.ts
- src/layout.test.ts
- src/shortcuts.test.ts
- README.md
- package.json
- _bmad-output/implementation-artifacts/sprint-status.yaml
- _bmad-output/implementation-artifacts/2-3-auto-layout-for-dag-graphs.md

### Change Log

- 2026-03-12: Implemented story 2.3 auto layout, adopted browser-safer shortcut, and added targeted unit tests.
