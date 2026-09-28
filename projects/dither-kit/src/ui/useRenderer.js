// Owns the filter pipelines and serialises all rendering. Preview requests coalesce to the
// latest state; exports and thumbnails take the lock for their whole run.
import { useCallback, useEffect, useRef, useState } from "react";
import { createPipeline } from "../engine/pipeline.js";
import { getLastGrid, scriptSlayer } from "../engine/scriptSlayer.js";

const sourceFrame = async (source, width, height, t) => {
  const input = new OffscreenCanvas(width, height);
  const ctx = input.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingQuality = "high";
  await source.drawAt(ctx, width, height, t);
  return input;
};

const scaledSize = (source, resolution) => ({
  width: Math.max(1, Math.round(source.width * resolution)),
  height: Math.max(1, Math.round(source.height * resolution)),
});

const usesText = (stages) => stages.some((s) => s.enabled && s.filter === scriptSlayer);

export function useRenderer(displayRef) {
  const pipelineRef = useRef(null);
  const thumbPipelineRef = useRef(null);
  const lock = useRef(Promise.resolve());
  const latest = useRef(null);
  const scheduled = useRef(false);
  const frameIndex = useRef(0);
  const previewGrid = useRef(null);
  const [error, setError] = useState(null);
  const [renderMs, setRenderMs] = useState(0);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    pipelineRef.current = createPipeline();
    thumbPipelineRef.current = createPipeline();
    return () => {
      pipelineRef.current.dispose();
      thumbPipelineRef.current.dispose();
    };
  }, []);

  const exclusive = useCallback((fn) => {
    const run = lock.current.then(fn);
    lock.current = run.catch(() => {});
    return run;
  }, []);

  const renderFrame = useCallback(async ({ source, stages, resolution, t, index, animating }) => {
    const { width, height } = scaledSize(source, resolution);
    const input = await sourceFrame(source, width, height, t);
    return pipelineRef.current.render({ input, stages, t, frameIndex: index, animating });
  }, []);

  const request = useCallback(
    (state) => {
      latest.current = state;
      if (scheduled.current) return;
      scheduled.current = true;
      exclusive(async () => {
        scheduled.current = false;
        const s = latest.current;
        if (!s?.source || !displayRef.current) return;
        const started = performance.now();
        let out;
        if (s.showOriginal) {
          const { width, height } = scaledSize(s.source, s.resolution);
          out = await sourceFrame(s.source, width, height, s.t);
        } else {
          out = await renderFrame({ ...s, index: frameIndex.current++ });
          // Snapshot inside the lock so thumbnail renders cannot overwrite it before export.
          previewGrid.current = usesText(s.stages) ? getLastGrid() : null;
        }
        const canvas = displayRef.current;
        if (canvas.width !== out.width || canvas.height !== out.height) {
          canvas.width = out.width;
          canvas.height = out.height;
          setSize({ width: out.width, height: out.height });
        }
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.clearRect(0, 0, out.width, out.height);
        ctx.drawImage(out, 0, 0);
        setRenderMs(Math.round(performance.now() - started));
        setError(null);
      }).catch((e) => {
        console.error(e);
        setError(e.message ?? String(e));
      });
    },
    [displayRef, exclusive, renderFrame],
  );

  // Runs `fn(renderAt)` with the pipeline to itself; temporal state restarts at frame 0.
  const runExport = useCallback(
    (state, fn) =>
      exclusive(async () => {
        pipelineRef.current.resetTemporal();
        try {
          return await fn((t, index) => renderFrame({ ...state, t, index, animating: true }));
        } finally {
          pipelineRef.current.resetTemporal();
        }
      }),
    [exclusive, renderFrame],
  );

  // Small still of `stages` applied to the source, as a blob URL (caller revokes it).
  const renderThumb = useCallback(
    (source, stages, width) =>
      exclusive(async () => {
        const height = Math.max(1, Math.round((source.height / source.width) * width));
        const input = await sourceFrame(source, width, height, 0);
        thumbPipelineRef.current.resetTemporal();
        const out = await thumbPipelineRef.current.render({ input, stages, t: 0, frameIndex: 0, animating: false });
        const copy = new OffscreenCanvas(out.width, out.height);
        copy.getContext("2d").drawImage(out, 0, 0);
        return URL.createObjectURL(await copy.convertToBlob({ type: "image/png" }));
      }),
    [exclusive],
  );

  const sourceCanvas = useCallback(
    (source, resolution, t) =>
      exclusive(() => {
        const { width, height } = scaledSize(source, resolution);
        return sourceFrame(source, width, height, t);
      }),
    [exclusive],
  );

  const getPreviewGrid = useCallback(() => previewGrid.current, []);

  return { request, runExport, renderThumb, sourceCanvas, getPreviewGrid, error, renderMs, size };
}
