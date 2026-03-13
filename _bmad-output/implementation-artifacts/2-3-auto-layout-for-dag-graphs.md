# Story 2.3: Auto Layout for DAG Graphs

Status: ready-for-dev

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

- [ ] Add layout computation for DAG graphs (AC: 2)
  - [ ] Compute node depth levels from incoming edges
  - [ ] Handle multiple roots and disconnected components
  - [ ] Assign deterministic positions by level and order
- [ ] Add Auto Layout user action (AC: 1, 3)
  - [ ] Add toolbar button for Auto Layout
  - [ ] Add keyboard shortcut Ctrl+L for Auto Layout
- [ ] Ensure compatibility with existing features (AC: 4)
  - [ ] Keep validation behavior unchanged
  - [ ] Keep export actions working after layout updates

## Dev Notes

- Keep implementation local in src/App.tsx.
- Avoid adding new dependencies.
- Continue Windows-first shortcut hints.

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
