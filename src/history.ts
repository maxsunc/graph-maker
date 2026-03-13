export type GraphSnapshot<TNode, TEdge> = {
  nodes: TNode[];
  edges: TEdge[];
};

export type GraphHistoryState<TNode, TEdge> = {
  past: GraphSnapshot<TNode, TEdge>[];
  present: GraphSnapshot<TNode, TEdge>;
  future: GraphSnapshot<TNode, TEdge>[];
};

export function pushHistory<TNode, TEdge>(
  state: GraphHistoryState<TNode, TEdge>,
  nextPresent: GraphSnapshot<TNode, TEdge>
): GraphHistoryState<TNode, TEdge> {
  return {
    past: [...state.past, state.present],
    present: nextPresent,
    future: []
  };
}

export function undoHistory<TNode, TEdge>(
  state: GraphHistoryState<TNode, TEdge>
): GraphHistoryState<TNode, TEdge> {
  if (state.past.length === 0) {
    return state;
  }

  const previous = state.past[state.past.length - 1];
  return {
    past: state.past.slice(0, -1),
    present: previous,
    future: [state.present, ...state.future]
  };
}

export function redoHistory<TNode, TEdge>(
  state: GraphHistoryState<TNode, TEdge>
): GraphHistoryState<TNode, TEdge> {
  if (state.future.length === 0) {
    return state;
  }

  const next = state.future[0];
  return {
    past: [...state.past, state.present],
    present: next,
    future: state.future.slice(1)
  };
}

export function resetHistory<TNode, TEdge>(
  present: GraphSnapshot<TNode, TEdge>
): GraphHistoryState<TNode, TEdge> {
  return {
    past: [],
    present,
    future: []
  };
}
