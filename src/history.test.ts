import { describe, expect, it } from "vitest";
import {
  type GraphHistoryState,
  pushHistory,
  redoHistory,
  resetHistory,
  undoHistory
} from "./history";

type N = { id: string };
type E = { id: string };

function state(nodes: string[]): GraphHistoryState<N, E> {
  return {
    past: [],
    present: {
      nodes: nodes.map((id) => ({ id })),
      edges: []
    },
    future: []
  };
}

describe("history helpers", () => {
  it("pushHistory appends past and clears future", () => {
    const start = state(["a"]);
    const withFuture: GraphHistoryState<N, E> = {
      ...start,
      future: [{ nodes: [{ id: "x" }], edges: [] }]
    };

    const next = pushHistory(withFuture, {
      nodes: [{ id: "b" }],
      edges: []
    });

    expect(next.past).toHaveLength(1);
    expect(next.past[0].nodes[0].id).toBe("a");
    expect(next.present.nodes[0].id).toBe("b");
    expect(next.future).toHaveLength(0);
  });

  it("undo and redo transition history correctly", () => {
    const s1 = state(["a"]);
    const s2 = pushHistory(s1, { nodes: [{ id: "b" }], edges: [] });
    const s3 = pushHistory(s2, { nodes: [{ id: "c" }], edges: [] });

    const undone = undoHistory(s3);
    expect(undone.present.nodes[0].id).toBe("b");
    expect(undone.future[0].nodes[0].id).toBe("c");

    const redone = redoHistory(undone);
    expect(redone.present.nodes[0].id).toBe("c");
  });

  it("resetHistory clears past and future", () => {
    const reset = resetHistory({ nodes: [{ id: "z" }], edges: [] });
    expect(reset.past).toHaveLength(0);
    expect(reset.future).toHaveLength(0);
    expect(reset.present.nodes[0].id).toBe("z");
  });
});
