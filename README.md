# tree-maker

An interactive website for building tree-style node diagrams with editable node text and export tools.

## Product Epics

1. Core Diagram Editing
- Create, move, connect, and delete nodes.
- Keep editing friction low with in-node title and description editing.

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
3. Add Node, Export PNG (transparent), Export JPG actions.
4. Responsive shell layout with custom styling.

## Run Locally

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

