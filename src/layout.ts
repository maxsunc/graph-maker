export type LayoutNode = { id: string };
export type LayoutEdge = { source: string; target: string };

export function computeAutoLayout(
    nodes: LayoutNode[],
    edges: LayoutEdge[]
): Map<string, { x: number; y: number }> {
    const sortedNodes = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
    const nodeIds = new Set(sortedNodes.map((node) => node.id));
    const adjacency = new Map<string, string[]>(sortedNodes.map((node) => [node.id, []]));
    const incoming = new Map<string, number>(sortedNodes.map((node) => [node.id, 0]));

    for (const edge of edges) {
        if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
            continue;
        }
        adjacency.set(edge.source, [...(adjacency.get(edge.source) ?? []), edge.target]);
        incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
    }

    for (const [id, list] of adjacency.entries()) {
        adjacency.set(id, [...list].sort((a, b) => a.localeCompare(b)));
    }

    const depth = new Map<string, number>(sortedNodes.map((node) => [node.id, 0]));
    const queue = sortedNodes
        .filter((node) => (incoming.get(node.id) ?? 0) === 0)
        .map((node) => node.id)
        .sort((a, b) => a.localeCompare(b));

    const visited = new Set<string>();
    while (queue.length > 0) {
        const current = queue.shift()!;
        visited.add(current);
        const currentDepth = depth.get(current) ?? 0;

        for (const child of adjacency.get(current) ?? []) {
            const childDepth = depth.get(child) ?? 0;
            if (childDepth < currentDepth + 1) {
                depth.set(child, currentDepth + 1);
            }
            incoming.set(child, (incoming.get(child) ?? 0) - 1);
            if ((incoming.get(child) ?? 0) === 0) {
                queue.push(child);
            }
        }
        queue.sort((a, b) => a.localeCompare(b));
    }

    let maxDepth = Math.max(...depth.values(), 0);
    const remaining = sortedNodes.map((node) => node.id).filter((id) => !visited.has(id));
    for (const id of remaining) {
        maxDepth += 1;
        depth.set(id, maxDepth);
    }

    const byDepth = new Map<number, string[]>();
    for (const node of sortedNodes) {
        const d = depth.get(node.id) ?? 0;
        byDepth.set(d, [...(byDepth.get(d) ?? []), node.id]);
    }
    for (const [d, ids] of byDepth.entries()) {
        byDepth.set(d, [...ids].sort((a, b) => a.localeCompare(b)));
    }

    const positions = new Map<string, { x: number; y: number }>();
    const depthKeys = [...byDepth.keys()].sort((a, b) => a - b);
    for (const d of depthKeys) {
        const ids = byDepth.get(d) ?? [];
        ids.forEach((id, index) => {
            positions.set(id, {
                x: 120 + d * 270,
                y: 80 + index * 170
            });
        });
    }

    return positions;
}
