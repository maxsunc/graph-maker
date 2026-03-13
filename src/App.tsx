import { useCallback, useMemo, useRef, useState } from "react";
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
    if (!canvasRef.current) {
      return;
    }
    const dataUrl = await toPng(canvasRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "transparent"
    });
    downloadDataUrl(dataUrl, "tree-diagram.png");
  }, []);

  const onExportJpg = useCallback(async () => {
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
  }, []);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>Tree Maker</h1>
          <p>Build node trees, add details, and export your diagram.</p>
        </div>
        <div className="actions">
          <button onClick={onAddNode}>Add Node</button>
          <button onClick={onDeleteSelected} disabled={!selectedNodeId}>
            Delete Selected
          </button>
          <button onClick={onExportPng}>Export PNG</button>
          <button onClick={onExportJpg}>Export JPG</button>
        </div>
      </header>

      <section className="canvas-wrap" ref={canvasRef}>
        <ReactFlow
          nodes={hydratedNodes}
          edges={edges}
          nodeTypes={nodeTypes}
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
