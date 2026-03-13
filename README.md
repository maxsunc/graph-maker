# tree-maker

An interactive website for building directed graph diagrams with editable node text and export tools.

## Product Epics

1. Core Diagram Editing
- Create, move, connect, and delete nodes.
- Keep editing friction low with in-node title and description editing for graph nodes.

2. Node Content Authoring
- Each node supports a short title and detailed description.
- Selection state and visual hierarchy are obvious at a glance.

3. Export and Share
- Export canvas as transparent PNG.
- Export canvas as high-quality JPG.

4. Usability and Visual Design
- Fast, modern UI with responsive layout for desktop and mobile.
- Clean visual language with intentional typography and clear controls.

## Delivered In This Iteration

1. React Flow-based editor with draggable, connectable nodes.
2. Custom node card with editable title and description.
3. Add Node, Save JSON, Load JSON, Export PNG (transparent), Export JPG actions.
4. Responsive shell layout with custom styling.
5. Versioned diagram JSON format (`schemaVersion: 1`) with forgiving import for legacy snapshots.
6. Live DAG graph validation rules: no cycles, required title+description for each node, and export blocking when invalid.
7. Productivity upgrades: snap-to-grid editing and keyboard shortcuts for delete, save JSON, and export PNG.
8. One-click DAG auto-layout with deterministic level-based positioning and Ctrl+Alt+L shortcut.
9. Undo/Redo history controls with toolbar buttons and Windows shortcuts (`Ctrl+Z`, `Ctrl+Shift+Z`).
10. Platform-aware shortcut hints in UI (`Cmd`/`Option` on macOS, `Ctrl`/`Alt` on Windows/Linux).

## Notes

1. Shortcut hints are platform-aware (`Cmd`/`Option` for macOS, `Ctrl`/`Alt` otherwise).
2. Shortcut handling supports both `Ctrl` and `Cmd` modifiers.
3. Auto Layout uses `Ctrl+Alt+L` to avoid common browser conflicts.
4. Redo uses `Ctrl+Shift+Z` in this Windows-first implementation.

## Run Locally

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

