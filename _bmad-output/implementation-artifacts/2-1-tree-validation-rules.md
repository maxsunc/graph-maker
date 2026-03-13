# Story 2.1: Tree Validation Rules

Status: review

## Story

As a diagram editor user,
I want the app to validate my tree structure,
so that I can catch structural mistakes before sharing or exporting.

## Acceptance Criteria

1. The editor validates that exactly one root node exists.
2. The editor detects cycles and reports when the diagram is not a valid tree.
3. The editor validates required node fields (title and description) and reports missing data.
4. Validation feedback is visible in the UI and updates when nodes or edges change.

## Tasks / Subtasks

- [x] Add validation engine for tree constraints (AC: 1, 2, 3)
  - [x] Implement root count validation
  - [x] Implement directed cycle detection
  - [x] Implement required field checks for title and description
- [x] Add UI feedback panel for validation results (AC: 4)
  - [x] Show overall validity state
  - [x] Show individual validation errors
- [x] Wire validation to editor changes and export behavior (AC: 4)
  - [x] Recompute validation when nodes or edges change
  - [x] Block export and explain why when diagram is invalid

## Dev Notes

- Existing editor is in src/App.tsx with node and edge state managed in React.
- Keep implementation in TypeScript and preserve existing interaction patterns.
- Prefer lightweight in-memory validation; no backend needed.
- Keep UI responsive and readable on desktop and mobile.

### Project Structure Notes

- Main logic lives in src/App.tsx.
- Styling updates belong in src/styles.css.
- User-facing behavior changes should be reflected in README.md.

### References

- Source: README.md Product Epics and delivered features.

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Debug Log References

- npm run build

### Completion Notes List

- Added `validateTree` engine for single-root, cycle detection, and required title/description checks.
- Added live validation panel with clear valid/error status and issue list.
- Wired validation to state changes through memoized recalculation.
- Prevented PNG/JPG export while invalid and surfaced reason to user.

### File List

- src/App.tsx
- src/styles.css
- README.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- _bmad-output/implementation-artifacts/2-1-tree-validation-rules.md

### Change Log

- 2026-03-12: Implemented story 2.1 tree validation rules and marked story ready for review.
