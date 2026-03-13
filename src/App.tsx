import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
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
  const [nodes, setNodes] = useState<Node<TreeNodeData>[]>(seedNodes);
  const [edges, setEdges] = useState<Edge[]>(seedEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const uploadRef = useRef<HTMLInputElement | null>(null);

  const updateNodeData = useCallback(
    (id: string, patch: Partial<Omit<TreeNodeData, "onChange">>) => {
      setNodes((curr) =>
        curr.map((node) =>
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
      );
    },
    []
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
    setNodes((current) => applyNodeChanges(changes, current));
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((current) => applyEdgeChanges(changes, current));
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((current) =>
      addEdge(
        {
          ...connection,
          id: `e-${connection.source}-${connection.target}-${Date.now()}`,
          type: "smoothstep"
        },
        current
      )
    );
  }, []);

  const onAddNode = useCallback(() => {
    setNodes((curr) => {
      const id = `n-${curr.length + 1}`;
      return [
        ...curr,
        {
          id,
          type: "treeNode",
          position: nextNodePosition(curr.length),
          data: {
            title: `Node ${curr.length + 1}`,
            description: "",
            onChange: updateNodeData
          }
        }
      ];
    });
  }, [updateNodeData]);

  const onDeleteSelected = useCallback(() => {
    if (!selectedNodeId) {
      return;
    }
    setNodes((curr) => curr.filter((node) => node.id !== selectedNodeId));
    setEdges((curr) =>
      curr.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId)
    );
    setSelectedNodeId(null);
  }, [selectedNodeId]);

  const onExportPng = useCallback(async () => {
    if (!validation.isValid) {
      window.alert("Fix validation errors before exporting PNG graph.");
      return;
    }
    if (!canvasRef.current) {
      return;
    }
    const dataUrl = await toPng(canvasRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "transparent"
    });
    downloadDataUrl(dataUrl, "tree-diagram.png");
  }, [validation.isValid]);

  const onExportJpg = useCallback(async () => {
    if (!validation.isValid) {
      window.alert("Fix validation errors before exporting JPG graph.");
      return;
    }
    if (!canvasRef.current) {
      return;
    }
    const dataUrl = await toJpeg(canvasRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      quality: 0.95
    });
    downloadDataUrl(dataUrl, "tree-diagram.jpg");
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
    downloadDataUrl(url, "tree-diagram.json");
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }, [edges, nodes]);

  const onChooseJsonFile = useCallback(() => {
    uploadRef.current?.click();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const key = event.key.toLowerCase();
      const isModifier = event.ctrlKey || event.metaKey;

      if ((event.key === "Delete" || event.key === "Backspace") && selectedNodeId) {
        event.preventDefault();
        onDeleteSelected();
        return;
      }

      if (isModifier && key === "s") {
        event.preventDefault();
        onSaveJson();
        return;
      }

      if (isModifier && key === "e") {
        event.preventDefault();
        void onExportPng();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onDeleteSelected, onExportPng, onSaveJson, selectedNodeId]);

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
              type: typeof edge.type === "string" ? edge.type : "smoothstep"
            };
          })
          .filter((edge) => nodeIdSet.has(edge.source) && nodeIdSet.has(edge.target));

        setNodes(loadedNodes.length > 0 ? loadedNodes : seedNodes);
        setEdges(loadedEdges);
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
          <button onClick={onAddNode}>Add Node</button>
          <button onClick={onDeleteSelected} disabled={!selectedNodeId}>
            Delete Selected
          </button>
          <button onClick={onSaveJson}>Save JSON</button>
          <button onClick={onChooseJsonFile}>Load JSON</button>
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
        <span>Delete or Backspace: Delete selected node</span>
        <span>Ctrl/Cmd+S: Save JSON</span>
        <span>Ctrl/Cmd+E: Export PNG</span>
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
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          onPaneClick={() => setSelectedNodeId(null)}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="rgba(17, 34, 68, 0.16)" gap={22} />
          <MiniMap pannable zoomable className="mini-map" />
          <Controls />
        </ReactFlow>
      </section>
    </main>
  );
}
