// State with undo/redo. Edits within MERGE_MS of each other (slider drags, typing)
// collapse into one history step.
import { useCallback, useRef, useState } from "react";

const MERGE_MS = 600;
const LIMIT = 100;

export function useUndoable(init) {
  const [hist, setHist] = useState(() => ({ past: [], present: init(), future: [] }));
  const lastEdit = useRef(0);

  const set = useCallback((updater) => {
    const now = Date.now();
    const merge = now - lastEdit.current < MERGE_MS;
    lastEdit.current = now;
    setHist((h) => {
      const next = typeof updater === "function" ? updater(h.present) : updater;
      if (next === h.present) return h;
      return { past: merge ? h.past : [...h.past, h.present].slice(-LIMIT), present: next, future: [] };
    });
  }, []);

  const undo = useCallback(() => {
    lastEdit.current = 0;
    setHist((h) => (h.past.length ? { past: h.past.slice(0, -1), present: h.past.at(-1), future: [h.present, ...h.future] } : h));
  }, []);

  const redo = useCallback(() => {
    lastEdit.current = 0;
    setHist((h) => (h.future.length ? { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) } : h));
  }, []);

  return [hist.present, set, { undo, redo, canUndo: hist.past.length > 0, canRedo: hist.future.length > 0 }];
}
