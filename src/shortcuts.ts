export type ShortcutAction = "delete" | "save" | "exportPng" | "autoLayout" | null;

type ShortcutInput = {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  isTextInputFocused: boolean;
  hasSelectedNode: boolean;
};

export function resolveShortcutAction(input: ShortcutInput): ShortcutAction {
  const key = input.key.toLowerCase();
  if (input.isTextInputFocused) {
    return null;
  }

  if ((input.key === "Delete" || input.key === "Backspace") && input.hasSelectedNode) {
    return "delete";
  }

  const hasModifier = input.ctrlKey || input.metaKey;
  if (hasModifier && !input.altKey && !input.shiftKey && key === "s") {
    return "save";
  }

  if (hasModifier && !input.altKey && !input.shiftKey && key === "e") {
    return "exportPng";
  }

  if (hasModifier && input.altKey && !input.shiftKey && key === "l") {
    return "autoLayout";
  }

  return null;
}
