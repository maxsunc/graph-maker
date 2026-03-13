/* @vitest-environment jsdom */

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

type MockNode = {
    id: string;
    position: { x: number; y: number };
    data?: { selected?: boolean };
};

type MockNodeChange = {
    id: string;
    type: string;
    position?: { x: number; y: number };
    selected?: boolean;
};

let lastReactFlowProps: Record<string, unknown> | null = null;

vi.mock("./layout", () => ({
    computeAutoLayout: (nodes: Array<{ id: string; position: { x: number; y: number } }>) =>
        new Map(nodes.map((node) => [node.id, node.position]))
}));

vi.mock("html-to-image", () => ({
    toPng: vi.fn(async () => "data:image/png;base64,mock"),
    toJpeg: vi.fn(async () => "data:image/jpeg;base64,mock")
}));

vi.mock("reactflow", async () => {
    const React = await import("react");

    const applyNodeChanges = (changes: MockNodeChange[], nodes: MockNode[]) => {
        let next = [...nodes];
        for (const change of changes) {
            if (change.type === "position" && change.position) {
                next = next.map((node) =>
                    node.id === change.id ? { ...node, position: change.position! } : node
                );
            }
            if (change.type === "select") {
                next = next.map((node) =>
                    node.id === change.id
                        ? { ...node, data: { ...(node.data ?? {}), selected: Boolean(change.selected) } }
                        : node
                );
            }
            if (change.type === "remove") {
                next = next.filter((node) => node.id !== change.id);
            }
        }
        return next;
    };

    return {
        Position: { Top: "top", Bottom: "bottom" },
        Handle: () => null,
        Background: () => null,
        Controls: () => null,
        MiniMap: () => null,
        ReactFlow: (props: Record<string, unknown>) => {
            lastReactFlowProps = props;
            return React.createElement("div", { "data-testid": "reactflow" });
        },
        addEdge: (connection: Record<string, unknown>, edges: Array<Record<string, unknown>>) => [
            ...edges,
            connection
        ],
        applyNodeChanges,
        applyEdgeChanges: (_changes: unknown, edges: Array<Record<string, unknown>>) => edges
    };
});

function getUndoButton(): HTMLButtonElement {
    return screen.getByRole("button", { name: "Undo" });
}

function getNodePosition(id: string): { x: number; y: number } {
    const props = lastReactFlowProps as { nodes: Array<{ id: string; position: { x: number; y: number } }> };
    const node = props.nodes.find((n) => n.id === id);
    if (!node) {
        throw new Error(`Missing node ${id}`);
    }
    return node.position;
}

describe("App undo/redo integration", () => {
    afterEach(() => {
        cleanup();
    });

    beforeEach(() => {
        lastReactFlowProps = null;
        vi.restoreAllMocks();

        Object.defineProperty(URL, "createObjectURL", {
            configurable: true,
            writable: true,
            value: vi.fn(() => "blob:mock-url")
        });
        Object.defineProperty(URL, "revokeObjectURL", {
            configurable: true,
            writable: true,
            value: vi.fn(() => undefined)
        });
        vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    });

    it("records node drag as a single undo step per gesture", () => {
        render(<App />);

        const before = getNodePosition("n-1");

        act(() => {
            (lastReactFlowProps as { onNodeDragStart: () => void }).onNodeDragStart();
            (lastReactFlowProps as { onNodesChange: (changes: MockNodeChange[]) => void }).onNodesChange([
                { id: "n-1", type: "position", position: { x: before.x + 50, y: before.y + 10 } }
            ]);
            (lastReactFlowProps as { onNodesChange: (changes: MockNodeChange[]) => void }).onNodesChange([
                { id: "n-1", type: "position", position: { x: before.x + 120, y: before.y + 40 } }
            ]);
            (lastReactFlowProps as { onNodeDragStop: () => void }).onNodeDragStop();
        });

        const moved = getNodePosition("n-1");
        expect(moved).not.toEqual(before);
        expect(getUndoButton().disabled).toBe(false);

        fireEvent.click(getUndoButton());

        expect(getUndoButton().disabled).toBe(true);
        expect(getNodePosition("n-1")).toEqual(before);
    });

    it("does not create undo history for no-op auto-layout", () => {
        render(<App />);

        expect(getUndoButton().disabled).toBe(true);
        fireEvent.click(screen.getByRole("button", { name: "Auto Layout" }));
        expect(getUndoButton().disabled).toBe(true);
    });

    it("keeps validation and save behavior working after undo", () => {
        render(<App />);

        fireEvent.click(screen.getByRole("button", { name: "Add Node" }));
        expect(screen.getByText("Validation: Ready")).toBeTruthy();
        expect(getUndoButton().disabled).toBe(false);

        fireEvent.click(getUndoButton());
        expect(screen.getByText("Validation: Ready")).toBeTruthy();
        expect(getUndoButton().disabled).toBe(true);

        fireEvent.click(screen.getByRole("button", { name: "Save JSON" }));
        expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    });

    it("shows Cmd/Option shortcut hints on macOS", () => {
        vi.spyOn(window.navigator, "platform", "get").mockReturnValue("MacIntel");
        vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (Macintosh; Intel Mac OS X)");

        render(<App />);

        expect(screen.getByText("Cmd+Z: Undo")).toBeTruthy();
        expect(screen.getByText("Cmd+Shift+Z: Redo")).toBeTruthy();
        expect(screen.getByText("Cmd+Option+L: Auto Layout")).toBeTruthy();
    });
});
