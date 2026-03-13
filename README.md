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

## Notes

1. Current shortcut hints assume Windows key labels (`Ctrl+...`).
2. Future enhancement: platform-aware shortcut hints (`Cmd` on macOS).
3. Auto Layout uses `Ctrl+Alt+L` to avoid common browser conflicts.

## Run Locally

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

