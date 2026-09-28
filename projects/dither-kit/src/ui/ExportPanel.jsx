import { useEffect, useRef, useState } from "react";
import { Film, Image, Type, Wand, X } from "lucide-react";
import {
  download,
  exportGif,
  exportImage,
  exportSequence,
  exportSvg,
  exportText,
  exportVideo,
} from "../engine/export.js";

const base = (name) => (name ?? "dither").replace(/\.[^.]+$/, "") + "-dither";

export function ExportPanel({ displayRef, sourceName, hasText, getGrid, duration, fps, runAnimation, onClose }) {
  const [scale, setScale] = useState(1);
  const [format, setFormat] = useState("png");
  const [inkOnly, setInkOnly] = useState(false);
  const [progress, setProgress] = useState(null);
  const [err, setErr] = useState(null);
  const abort = useRef(null);
  const name = base(sourceName);

  const guard = async (fn) => {
    setErr(null);
    try {
      await fn();
    } catch (e) {
      if (e.name !== "AbortError") setErr(e.message ?? String(e));
    } finally {
      setProgress(null);
      abort.current = null;
    }
  };

  const still = () =>
    guard(async () => download(await exportImage(displayRef.current, format, scale), `${name}.${format}`));

  const animation = (kind) =>
    guard(async () => {
      abort.current = new AbortController();
      setProgress(0);
      const opts = { duration, fps, scale, withText: hasText, onProgress: setProgress, signal: abort.current.signal };
      const blob = await runAnimation((renderFrame) => {
        const args = { ...opts, renderFrame };
        if (kind === "gif") return exportGif(args);
        if (kind === "zip") return exportSequence(args);
        return exportVideo({ ...args, format: kind });
      });
      download(blob, `${name}.${kind}`);
    });

  const busy = progress != null;

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const w = displayRef.current?.width ?? 0;
  const h = displayRef.current?.height ?? 0;
  const frames = Math.max(1, Math.round(duration * fps));

  return (
    <div className="modal" onClick={busy ? undefined : onClose} role="dialog" aria-modal="true" aria-label="Export">
      <div className="modal-body sheet export" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Export</h2>
          <div className="seg" title="Nearest-neighbour upscale keeps pixels crisp">
            {[1, 2, 4, 8].map((s) => (
              <button key={s} className={s === scale ? "on" : ""} onClick={() => setScale(s)}>{s}×</button>
            ))}
          </div>
          <span className="muted small mono">{w * scale}×{h * scale}</span>
          <button className="icon close" onClick={onClose} disabled={busy} aria-label="Close"><X size={18} /></button>
        </div>

        <div className="export-grid">
          <section className="card">
            <h4><Image size={15} /> Image</h4>
            <p className="muted small">Current frame as raster.</p>
            <div className="seg">
              {["png", "jpg", "webp"].map((f) => (
                <button key={f} className={f === format ? "on" : ""} onClick={() => setFormat(f)}>{f.toUpperCase()}</button>
              ))}
            </div>
            <button className="primary" disabled={busy} onClick={still}>Save {format.toUpperCase()}</button>
          </section>

          <section className="card">
            <h4><Wand size={15} /> Vector</h4>
            <p className="muted small">SVG, one path per colour.</p>
            <label className="check">
              <button role="switch" aria-checked={inkOnly} className={`switch ${inkOnly ? "on" : ""}`} onClick={() => setInkOnly(!inkOnly)}>
                <span />
              </button>
              Black ink only
            </label>
            <button className="primary" disabled={busy}
              onClick={() => guard(async () => download(exportSvg(displayRef.current, { inkOnly, scale }), `${name}.svg`))}>
              Save SVG
            </button>
          </section>

          <section className={`card ${hasText ? "" : "disabled"}`}>
            <h4><Type size={15} /> Text</h4>
            <p className="muted small">{hasText ? "Script Slayer glyph grid as .txt." : "Add a Script Slayer stage to enable."}</p>
            <button className="primary" disabled={busy || !hasText} onClick={() => guard(async () => download(exportText(getGrid()), `${name}.txt`))}>
              Save TXT
            </button>
          </section>

          <section className="card wide">
            <h4><Film size={15} /> Animation</h4>
            <p className="muted small mono">{duration.toFixed(2)}s · {fps}fps · {frames} frames · keyframes baked in</p>
            <div className="format-tiles">
              <button disabled={busy} onClick={() => animation("mp4")}><strong>MP4</strong><span>H.264</span></button>
              <button disabled={busy} onClick={() => animation("webm")}><strong>WebM</strong><span>VP9</span></button>
              <button disabled={busy} onClick={() => animation("gif")}><strong>GIF</strong><span>256 colours</span></button>
              <button disabled={busy} onClick={() => animation("zip")}><strong>ZIP</strong><span>PNG{hasText ? " + TXT" : ""} frames</span></button>
            </div>
          </section>
        </div>

        {busy && (
          <div className="progress-row">
            <progress value={progress} max={1} />
            <span className="mono">{Math.round(progress * 100)}%</span>
            <button className="ghost small" onClick={() => abort.current?.abort()}>Cancel</button>
          </div>
        )}
        {err && <p className="error">{err}</p>}
      </div>
    </div>
  );
}
