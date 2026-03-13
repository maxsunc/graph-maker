import { describe, expect, it } from "vitest";
import { resolveShortcutAction } from "./shortcuts";

const base = {
    key: "",
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    isTextInputFocused: false,
    hasSelectedNode: false,
    hasUndo: false,
    hasRedo: false
};

describe("resolveShortcutAction", () => {
    it("ignores shortcuts when typing in text inputs", () => {
        const action = resolveShortcutAction({
            ...base,
            key: "Delete",
            isTextInputFocused: true,
            hasSelectedNode: true
        });
        expect(action).toBeNull();
    });

    it("resolves delete/backspace only when a node is selected", () => {
        expect(resolveShortcutAction({ ...base, key: "Delete", hasSelectedNode: true })).toBe("delete");
        expect(resolveShortcutAction({ ...base, key: "Backspace", hasSelectedNode: true })).toBe("delete");
        expect(resolveShortcutAction({ ...base, key: "Delete", hasSelectedNode: false })).toBeNull();
    });

    it("resolves save and export PNG shortcuts", () => {
        expect(resolveShortcutAction({ ...base, key: "s", ctrlKey: true })).toBe("save");
        expect(resolveShortcutAction({ ...base, key: "e", ctrlKey: true })).toBe("exportPng");
    });

    it("maps Ctrl+Z and Ctrl+Shift+Z to undo/redo only when available", () => {
        expect(resolveShortcutAction({ ...base, key: "z", ctrlKey: true, hasUndo: true })).toBe("undo");
        expect(resolveShortcutAction({ ...base, key: "z", ctrlKey: true, hasUndo: false })).toBeNull();
        expect(resolveShortcutAction({ ...base, key: "z", ctrlKey: true, shiftKey: true, hasRedo: true })).toBe(
            "redo"
        );
        expect(resolveShortcutAction({ ...base, key: "z", ctrlKey: true, shiftKey: true, hasRedo: false })).toBeNull();
    });

    it("uses browser-safer auto-layout shortcut Ctrl+Alt+L", () => {
        expect(resolveShortcutAction({ ...base, key: "l", ctrlKey: true, altKey: true })).toBe("autoLayout");
        expect(resolveShortcutAction({ ...base, key: "l", ctrlKey: true })).toBeNull();
    });
});
