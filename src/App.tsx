import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  MarkerType,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  Handle,
  Position
} from "reactflow";
import { toJpeg, toPng } from "html-to-image";
import { pushHistory, redoHistory, resetHistory, undoHistory, type GraphHistoryState } from "./history";
import { computeAutoLayout } from "./layout";
import { resolveShortcutAction } from "./shortcuts";
import "reactflow/dist/style.css";

type TreeNodeData = {
  title: string;
  description: string;
  selected?: boolean;
  onChange: (id: string, patch: Partial<Omit<TreeNodeData, "onChange">>) => void;
};

type DiagramNodeRecord = {
  id: string;
  position: { x: number; y: number };
  title: string;
  description: string;
};

type DiagramEdgeRecord = {
  id: string;
  source: string;
  target: string;
  type?: string;
};

type DiagramSnapshotV1 = {
  schemaVersion: 1;
  nodes: DiagramNodeRecord[];
  edges: DiagramEdgeRecord[];
};

type LegacyDiagramSnapshot = {
  nodes?: Array<
    Partial<Node<{ title?: string; description?: string }>> & {
      title?: string;
      description?: string;
    }
  >;
  edges?: Array<Partial<Edge>>;
};

type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

type GraphSnapshot = {
  nodes: Node<TreeNodeData>[];
  edges: Edge[];
};

const nextNodePosition = (count: number) => ({
  x: 80 + (count % 4) * 250,
  y: 60 + Math.floor(count / 4) * 170
});

const seedNodes: Node<TreeNodeData>[] = [
  {
    id: "n-1",
    position: { x: 100, y: 120 },
    data: {
      title: "Root Idea",
      description: "Describe your main concept.",
      onChange: () => undefined
    },
    type: "treeNode"
  }
];

const seedEdges: Edge[] = [];
const graphEdgeColor = "#1c3f78";

function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

function makeUniqueId(base: string, used: Set<string>, prefix: string): string {
  const normalized = base.trim().length > 0 ? base : prefix;
  if (!used.has(normalized)) {
    used.add(normalized);
    return normalized;
  }

  let i = 2;
  while (used.has(`${normalized}-${i}`)) {
    i += 1;
  }
  const unique = `${normalized}-${i}`;
  used.add(unique);
  return unique;
}

function isTextInputFocused(): boolean {
  const active = document.activeElement;
  if (!active) {
    return false;
  }
  const tag = active.tagName.toLowerCase();
  return tag === "input" || tag === "textarea";
}

function includeInExport(node: HTMLElement): boolean {
  if (!("classList" in node)) {
    return true;
  }
  if (node.classList.contains("react-flow__minimap") || node.classList.contains("mini-map")) {
    return false;
  }
  return true;
}

function validateDagGraph(nodes: Node<TreeNodeData>[], edges: Edge[]): ValidationResult {
  const errors: string[] = [];
  if (nodes.length === 0) {
    errors.push("Add at least one node.");
    return { isValid: false, errors };
  }

  const nodeIds = new Set(nodes.map((node) => node.id));
  const adjacency = new Map<string, string[]>(nodes.map((node) => [node.id, []]));

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      continue;
    }
    adjacency.set(edge.source, [...(adjacency.get(edge.source) ?? []), edge.target]);
  }

  for (const node of nodes) {
    if (!node.data.title.trim()) {
      errors.push(`Node ${node.id} is missing a title.`);
    }
    if (!node.data.description.trim()) {
      errors.push(`Node ${node.id} is missing a description.`);
    }
  }

  const state = new Map<string, 0 | 1 | 2>();
  let hasCycle = false;

  const visit = (id: string): void => {
    if (hasCycle) {
      return;
    }
    const current = state.get(id) ?? 0;
    if (current === 1) {
      hasCycle = true;
      return;
    }
    if (current === 2) {
      return;
    }
    state.set(id, 1);
    for (const next of adjacency.get(id) ?? []) {
      visit(next);
    }
    state.set(id, 2);
  };

  for (const node of nodes) {
    if ((state.get(node.id) ?? 0) === 0) {
      visit(node.id);
    }
  }

  if (hasCycle) {
    errors.push("Cycle detected. A DAG graph cannot contain loops.");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function TreeNode({ id, data }: { id: string; data: TreeNodeData }) {
  return (
    <div className={`tree-node ${data.selected ? "is-selected" : ""}`}>
      <Handle type="target" position={Position.Top} />
      <div className="node-header">Node</div>
      <label className="node-label" htmlFor={`${id}-title`}>
        Title
      </label>
      <input
        id={`${id}-title`}
        className="node-input"
        value={data.title}
        onChange={(e) => data.onChange(id, { title: e.target.value })}
        placeholder="Node title"
      />
      <label className="node-label" htmlFor={`${id}-description`}>
        Description
      </label>
      <textarea
        id={`${id}-description`}
        className="node-textarea"
        value={data.description}
        onChange={(e) => data.onChange(id, { description: e.target.value })}
        placeholder="Add details"
      />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export default function App() {
  const [historyState, setHistoryState] = useState<GraphHistoryState<Node<TreeNodeData>, Edge>>({
    past: [],
    present: {
      nodes: seedNodes,
      edges: seedEdges
    },
    future: []
  });
  const nodes = historyState.present.nodes;
  const edges = historyState.present.edges;
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const uploadRef = useRef<HTMLInputElement | null>(null);
  const dragStartSnapshotRef = useRef<GraphSnapshot | null>(null);
  const reactFlowInstanceRef = useRef<{ fitView: (options?: { padding?: number; duration?: number }) => void } | null>(null);
  const previousNodeCountRef = useRef(nodes.length);

  const applyPresentUpdate = useCallback(
    (updater: (present: GraphSnapshot) => GraphSnapshot, shouldTrack = true) => {
      setHistoryState((current) => {
        const nextPresent = updater(current.present);
        const unchanged =
          nextPresent.nodes === current.present.nodes && nextPresent.edges === current.present.edges;
        if (unchanged) {
          return current;
        }
        if (!shouldTrack) {
          return {
            ...current,
            present: nextPresent
          };
        }
        return pushHistory(current, nextPresent);
      });
    },
    []
  );

  const onUndo = useCallback(() => {
    setHistoryState((current) => undoHistory(current));
  }, []);

  const onRedo = useCallback(() => {
    setHistoryState((current) => redoHistory(current));
  }, []);

  const hasUndo = historyState.past.length > 0;
  const hasRedo = historyState.future.length > 0;

  const isMacPlatform = useMemo(() => {
    if (typeof navigator === "undefined") {
      return false;
    }
    const platformInfo = `${navigator.platform} ${navigator.userAgent}`.toLowerCase();
    return platformInfo.includes("mac");
  }, []);

  const shortcutHints = useMemo(() => {
    const mod = isMacPlatform ? "Cmd" : "Ctrl";
    const alt = isMacPlatform ? "Option" : "Alt";
    return {
      undo: `${mod}+Z: Undo`,
      redo: `${mod}+Shift+Z: Redo`,
      save: `${mod}+S: Save JSON`,
      autoLayout: `${mod}+${alt}+L: Auto Layout`,
      exportPng: `${mod}+E: Export PNG`
    };
  }, [isMacPlatform]);

  const updateNodeData = useCallback(
    (id: string, patch: Partial<Omit<TreeNodeData, "onChange">>) => {
      applyPresentUpdate((present) => ({
        ...present,
        nodes: present.nodes.map((node) =>
          node.id === id
            ? {
              ...node,
              data: {
                ...node.data,
                ...patch,
                onChange: updateNodeData
              }
            }
            : node
        )
      }));
    },
    [applyPresentUpdate]
  );

  const hydratedNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          selected: node.id === selectedNodeId,
          onChange: updateNodeData
        }
      })),
    [nodes, selectedNodeId, updateNodeData]
  );
  const validation = useMemo(() => validateDagGraph(nodes, edges), [nodes, edges]);

  const nodeTypes = useMemo(() => ({ treeNode: TreeNode }), []);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    const shouldTrack = changes.some((change) => change.type !== "select" && change.type !== "position");
    applyPresentUpdate(
      (present) => ({
        ...present,
        nodes: applyNodeChanges(changes, present.nodes)
      }),
      shouldTrack
    );
  }, [applyPresentUpdate]);

  const onNodeDragStart = useCallback(() => {
    dragStartSnapshotRef.current = {
      nodes,
      edges
    };
  }, [edges, nodes]);

  const onNodeDragStop = useCallback(() => {
    const dragStartSnapshot = dragStartSnapshotRef.current;
    dragStartSnapshotRef.current = null;
    if (!dragStartSnapshot) {
      return;
    }

    setHistoryState((current) => {
      const startById = new Map(
        dragStartSnapshot.nodes.map((node) => [node.id, node.position])
      );
      const moved = current.present.nodes.some((node) => {
        const startPosition = startById.get(node.id);
        return (
          startPosition &&
          (startPosition.x !== node.position.x || startPosition.y !== node.position.y)
        );
      });

      if (!moved) {
        return current;
      }

      return {
        past: [...current.past, dragStartSnapshot],
        present: current.present,
        future: []
      };
    });
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    const shouldTrack = changes.some((change) => change.type !== "select");
    applyPresentUpdate(
      (present) => ({
        ...present,
        edges: applyEdgeChanges(changes, present.edges)
      }),
      shouldTrack
    );
  }, [applyPresentUpdate]);

  const onConnect = useCallback((connection: Connection) => {
    applyPresentUpdate((present) => ({
      ...present,
      edges: addEdge(
        {
          ...connection,
          id: `e-${connection.source}-${connection.target}-${Date.now()}`,
          type: "smoothstep",
          style: {
            stroke: graphEdgeColor,
            strokeWidth: 2.6
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: graphEdgeColor,
            width: 20,
            height: 20
          }
        },
        present.edges
      )
    }));
  }, [applyPresentUpdate]);

  const onAddNode = useCallback(() => {
    applyPresentUpdate((present) => {
      const id = `n-${present.nodes.length + 1}`;
      return {
        ...present,
        nodes: [
          ...present.nodes,
          {
            id,
            type: "treeNode",
            position: nextNodePosition(present.nodes.length),
            data: {
              title: `Node ${present.nodes.length + 1}`,
              description: "Describe this node.",
              onChange: updateNodeData
            }
          }
        ]
      };
    });
  }, [applyPresentUpdate, updateNodeData]);

  const onDeleteSelected = useCallback(() => {
    if (!selectedNodeId) {
      return;
    }
    applyPresentUpdate((present) => ({
      ...present,
      nodes: present.nodes.filter((node) => node.id !== selectedNodeId),
      edges: present.edges.filter(
        (edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId
      )
    }));
    setSelectedNodeId(null);
  }, [applyPresentUpdate, selectedNodeId]);

  const onExportPng = useCallback(async () => {
    if (!validation.isValid) {
      window.alert("Fix validation errors before exporting PNG graph.");
      return;
    }
    if (!canvasRef.current) {
      return;
    }
    try {
      const dataUrl = await toPng(canvasRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "transparent",
        filter: includeInExport
      });
      downloadDataUrl(dataUrl, "graph-diagram.png");
    } catch {
      window.alert("PNG export failed. Please try again.");
    }
  }, [validation.isValid]);

  const onExportJpg = useCallback(async () => {
    if (!validation.isValid) {
      window.alert("Fix validation errors before exporting JPG graph.");
      return;
    }
    if (!canvasRef.current) {
      return;
    }
    try {
      const dataUrl = await toJpeg(canvasRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        quality: 0.95,
        filter: includeInExport
      });
      downloadDataUrl(dataUrl, "graph-diagram.jpg");
    } catch {
      window.alert("JPG export failed. Please try again.");
    }
  }, [validation.isValid]);

  const onSaveJson = useCallback(() => {
    const payload: DiagramSnapshotV1 = {
      schemaVersion: 1,
      nodes: nodes.map((node) => ({
        id: node.id,
        position: node.position,
        title: node.data.title,
        description: node.data.description
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type
      }))
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    downloadDataUrl(url, "graph-diagram.json");
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }, [edges, nodes]);

  const onChooseJsonFile = useCallback(() => {
    uploadRef.current?.click();
  }, []);

  const onAutoLayout = useCallback(() => {
    applyPresentUpdate((present) => {
      const positions = computeAutoLayout(present.nodes, present.edges);
      const changed = present.nodes.some((node) => {
        const nextPosition = positions.get(node.id);
        return (
          nextPosition &&
          (nextPosition.x !== node.position.x || nextPosition.y !== node.position.y)
        );
      });
      if (!changed) {
        return present;
      }
      return {
        ...present,
        nodes: present.nodes.map((node) => ({
          ...node,
          position: positions.get(node.id) ?? node.position
        }))
      };
    });
  }, [applyPresentUpdate]);

  useEffect(() => {
    if (selectedNodeId && !nodes.some((node) => node.id === selectedNodeId)) {
      setSelectedNodeId(null);
    }
  }, [nodes, selectedNodeId]);

  useEffect(() => {
    if (nodes.length === previousNodeCountRef.current) {
      return;
    }
    previousNodeCountRef.current = nodes.length;
    requestAnimationFrame(() => {
      reactFlowInstanceRef.current?.fitView({ padding: 0.2, duration: 180 });
    });
  }, [nodes.length]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const action = resolveShortcutAction({
        key: event.key,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        altKey: event.altKey,
        shiftKey: event.shiftKey,
        isTextInputFocused: isTextInputFocused(),
        hasSelectedNode: Boolean(selectedNodeId),
        hasUndo,
        hasRedo
      });
      if (!action) {
        return;
      }

      event.preventDefault();
      if (action === "delete") {
        onDeleteSelected();
        return;
      }
      if (action === "save") {
        onSaveJson();
        return;
      }
      if (action === "exportPng") {
        void onExportPng();
        return;
      }
      if (action === "autoLayout") {
        onAutoLayout();
        return;
      }
      if (action === "undo") {
        onUndo();
        return;
      }
      if (action === "redo") {
        onRedo();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    hasRedo,
    hasUndo,
    onAutoLayout,
    onDeleteSelected,
    onExportPng,
    onRedo,
    onSaveJson,
    onUndo,
    selectedNodeId
  ]);

  const onLoadJson = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) {
        return;
      }

      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as Partial<DiagramSnapshotV1 & LegacyDiagramSnapshot>;
        const parsedNodes = parsed.nodes;
        const parsedEdges = parsed.edges;
        if (!Array.isArray(parsedNodes) || !Array.isArray(parsedEdges)) {
          throw new Error("Invalid diagram format");
        }

        const usedNodeIds = new Set<string>();
        const rawToUniqueId = new Map<string, string>();
        const loadedNodes: Node<TreeNodeData>[] = parsedNodes.map((node, index) => {
          const rawId = typeof node.id === "string" ? node.id : `n-${index + 1}`;
          const uniqueId = makeUniqueId(rawId, usedNodeIds, `n-${index + 1}`);
          if (!rawToUniqueId.has(rawId)) {
            rawToUniqueId.set(rawId, uniqueId);
          }

          const titleFromSchema = "title" in node && typeof node.title === "string" ? node.title : undefined;
          const descFromSchema = "description" in node && typeof node.description === "string" ? node.description : undefined;

          const legacyData =
            "data" in node && node.data && typeof node.data === "object"
              ? (node.data as { title?: unknown; description?: unknown })
              : undefined;

          const titleFromLegacyData = typeof legacyData?.title === "string" ? legacyData.title : undefined;
          const descFromLegacyData =
            typeof legacyData?.description === "string" ? legacyData.description : undefined;

          const position =
            node.position && typeof node.position.x === "number" && typeof node.position.y === "number"
              ? node.position
              : nextNodePosition(index);

          return {
            id: uniqueId,
            type: "treeNode",
            position,
            data: {
              title: titleFromSchema ?? titleFromLegacyData ?? `Node ${index + 1}`,
              description: descFromSchema ?? descFromLegacyData ?? "",
              onChange: updateNodeData
            }
          };
        });

        const nodeIdSet = new Set(loadedNodes.map((node) => node.id));
        const usedEdgeIds = new Set<string>();
        const loadedEdges: Edge[] = parsedEdges
          .map((edge, index) => {
            const sourceRaw = typeof edge.source === "string" ? edge.source : "";
            const targetRaw = typeof edge.target === "string" ? edge.target : "";
            const source = rawToUniqueId.get(sourceRaw) ?? sourceRaw;
            const target = rawToUniqueId.get(targetRaw) ?? targetRaw;
            const edgeIdBase = typeof edge.id === "string" ? edge.id : `e-${index + 1}`;
            return {
              id: makeUniqueId(edgeIdBase, usedEdgeIds, `e-${index + 1}`),
              source,
              target,
              type: typeof edge.type === "string" ? edge.type : "smoothstep",
              style: {
                stroke: graphEdgeColor,
                strokeWidth: 2.6
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: graphEdgeColor,
                width: 20,
                height: 20
              }
            };
          })
          .filter((edge) => nodeIdSet.has(edge.source) && nodeIdSet.has(edge.target));

        setHistoryState(
          resetHistory({
            nodes: loadedNodes.length > 0 ? loadedNodes : seedNodes,
            edges: loadedEdges
          })
        );
        setSelectedNodeId(null);
      } catch {
        window.alert("Could not load this JSON file. Please select a valid graph-diagram export.");
      }
    },
    [updateNodeData]
  );

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>Graph Maker</h1>
          <p>Build directed graphs, add details, and export your diagram.</p>
        </div>
        <div className="actions">
          <button onClick={onUndo} disabled={!hasUndo}>
            Undo
          </button>
          <button onClick={onRedo} disabled={!hasRedo}>
            Redo
          </button>
          <button onClick={onAddNode}>Add Node</button>
          <button className="btn-danger" onClick={onDeleteSelected} disabled={!selectedNodeId}>
            Delete Selected
          </button>
          <button onClick={onSaveJson}>Save JSON</button>
          <button className="btn-alt" onClick={onChooseJsonFile}>Load JSON</button>
          <button className="btn-alt" onClick={onAutoLayout}>Auto Layout</button>
          <button onClick={onExportPng}>Export PNG</button>
          <button onClick={onExportJpg}>Export JPG</button>
        </div>
      </header>

      <section className={`validation-panel ${validation.isValid ? "ok" : "error"}`}>
        <strong>{validation.isValid ? "Validation: Ready" : "Validation: Issues found"}</strong>
        {validation.isValid ? (
          <span>Your diagram is a valid DAG graph and ready to export.</span>
        ) : (
          <ul>
            {validation.errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="shortcuts-panel">
        <strong>Shortcuts</strong>
        <span>{shortcutHints.undo}</span>
        <span>{shortcutHints.redo}</span>
        <span>Delete or Backspace: Delete selected node</span>
        <span>{shortcutHints.save}</span>
        <span>{shortcutHints.autoLayout}</span>
        <span>{shortcutHints.exportPng}</span>
      </section>

      <input
        ref={uploadRef}
        type="file"
        accept="application/json,.json"
        onChange={onLoadJson}
        className="file-input"
      />

      <section className="canvas-wrap" ref={canvasRef}>
        <ReactFlow
          nodes={hydratedNodes}
          edges={edges}
          nodeTypes={nodeTypes}
          snapToGrid
          snapGrid={[24, 24]}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStart={onNodeDragStart}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          onPaneClick={() => setSelectedNodeId(null)}
          defaultEdgeOptions={{
            type: "smoothstep",
            style: {
              stroke: graphEdgeColor,
              strokeWidth: 2.6
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: graphEdgeColor,
              width: 20,
              height: 20
            },
            interactionWidth: 32
          }}
          connectionLineStyle={{
            stroke: graphEdgeColor,
            strokeWidth: 2.4
          }}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          onInit={(instance) => {
            reactFlowInstanceRef.current = instance;
          }}
        >
          <Background color="rgba(17, 34, 68, 0.16)" gap={22} />
          <MiniMap pannable zoomable className="mini-map" />
          <Controls />
        </ReactFlow>
      </section>
    </main>
  );
}
