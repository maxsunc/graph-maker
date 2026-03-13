import { describe, expect, it } from "vitest";
import { computeAutoLayout } from "./layout";

function p(id: string, positions: Map<string, { x: number; y: number }>) {
  return positions.get(id)!;
}

describe("computeAutoLayout", () => {
  it("places children to the right of parent depth", () => {
    const positions = computeAutoLayout(
      [{ id: "A" }, { id: "B" }, { id: "C" }],
      [
        { source: "A", target: "B" },
        { source: "A", target: "C" }
      ]
    );

    expect(p("A", positions).x).toBeLessThan(p("B", positions).x);
    expect(p("A", positions).x).toBeLessThan(p("C", positions).x);
    expect(p("B", positions).x).toBe(p("C", positions).x);
  });

  it("is deterministic for multiple roots and disconnected nodes", () => {
    const nodes = [{ id: "c" }, { id: "a" }, { id: "b" }, { id: "d" }];
    const edges = [{ source: "a", target: "b" }];

    const run1 = computeAutoLayout(nodes, edges);
    const run2 = computeAutoLayout(nodes, edges);

    expect(run1).toEqual(run2);
    expect(p("a", run1).x).toBeLessThan(p("b", run1).x);
    expect(p("c", run1).x).toBe(p("a", run1).x);
    expect(p("d", run1).x).toBe(p("a", run1).x);
  });
});
