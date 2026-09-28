import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera, Columns2, Download, Layers, Maximize2, Redo2, SlidersHorizontal, Sparkles, Undo2, Upload,
} from "lucide-react";
import { demoSource } from "./engine/demoSource.js";
import { BUILTIN_PRESETS, deserializeChain, makeStage, newId } from "./engine/presets.js";
import { scriptSlayer } from "./engine/scriptSlayer.js";
import { loadFile, loadWebcam } from "./engine/source.js";
import { ChainPanel } from "./ui/ChainPanel.jsx";
import { ExportPanel } from "./ui/ExportPanel.jsx";
import { Library } from "./ui/Library.jsx";
import { LooksPanel } from "./ui/LooksPanel.jsx";
import { ParamPanel } from "./ui/ParamPanel.jsx";
import { Timeline } from "./ui/Timeline.jsx";
import { useRenderer } from "./ui/useRenderer.js";
import { useUndoable } from "./ui/useUndoable.js";

const ZOOMS = ["fit", 1, 2, 4];
const DEFAULT_LOOK = "Synthwave glow";

export default function App() {
  const displayRef = useRef(null);
  const fileRef = useRef(null);
  const [source, setSource] = useState(demoSource);
  const [stages, setStages, history] = useUndoable(() =>
    deserializeChain(BUILTIN_PRESETS.find((p) => p.name === DEFAULT_LOOK).chain),
  );
  const [selectedId, setSelectedId] = useState(() => stages[0]?.id ?? null);
  const [resolution, setResolution] = useState(0.5);
  const [t, setT] = useState(0);
  const [fps, setFps] = useState(24);
  const [duration, setDuration] = useState(3);
  const [playing, setPlaying] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [zoom, setZoom] = useState("fit");
  const [modal, setModal] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [dragging, setDragging] = useState(false);
  // Desktop left column shows looks or layers; phones show one of looks/layers/adjust.
  const [leftTab, setLeftTab] = useState("layers");
  const [mobileTab, setMobileTab] = useState("looks");
  const { request, runExport, renderThumb, sourceCanvas, getPreviewGrid, error, renderMs, size } = useRenderer(displayRef);

  const selected = stages.find((s) => s.id === selectedId) ?? null;
  const hasText = stages.some((s) => s.enabled && s.filter === scriptSlayer);
  const live = !!source.live;

  // Re-render whenever anything that affects the frame changes.
  useEffect(() => {
    request({ source, stages, resolution, t, animating: playing || live, showOriginal });
  }, [request, source, stages, resolution, t, playing, live, showOriginal]);

  // Playback clock. Webcam is always live.
  useEffect(() => {
    if (!playing && !live) return;
    let raf;
    const start = performance.now() - t * 1000;
    const tick = (now) => {
      setT(((now - start) / 1000) % duration);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // `t` is only the resume point; including it would restart the clock every frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, live, duration]);

  const replaceSource = useCallback(async (loader) => {
    setLoadError(null);
    try {
      const next = await loader();
      setSource((prev) => {
        prev.dispose?.();
        return next;
      });
      setDuration(next.duration);
      setT(0);
      setPlaying(false);
    } catch (e) {
      setLoadError(e.message ?? String(e));
    }
  }, []);

  const openFile = useCallback((file) => file && replaceSource(() => loadFile(file)), [replaceSource]);

  // Paste, and PWA file handling (launch the installed app with a file).
  useEffect(() => {
    const onPaste = (e) => {
      const file = [...(e.clipboardData?.files ?? [])][0];
      if (file) openFile(file);
    };
    window.addEventListener("paste", onPaste);
    window.launchQueue?.setConsumer(async (params) => {
      const handle = params.files?.[0];
      if (handle) openFile(await handle.getFile());
    });
    return () => window.removeEventListener("paste", onPaste);
  }, [openFile]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest("input, textarea, select")) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        (e.shiftKey ? history.redo : history.undo)();
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        history.redo();
      } else if (e.code === "Space") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [history.undo, history.redo]);

  // Keep a valid selection through undo/redo and removals.
  useEffect(() => {
    if (!stages.some((s) => s.id === selectedId)) setSelectedId(stages[0]?.id ?? null);
  }, [stages, selectedId]);

  const select = (id) => {
    setSelectedId(id);
    setMobileTab("adjust");
  };

  const addStage = (entry) => {
    const stage = makeStage(entry);
    setStages((prev) => {
      const at = prev.findIndex((s) => s.id === selectedId);
      const next = [...prev];
      next.splice(at < 0 ? prev.length : at + 1, 0, stage);
      return next;
    });
    setModal(null);
    setLeftTab("layers");
    select(stage.id);
  };

  const updateSelected = (patch) =>
    setStages((prev) => prev.map((s) => (s.id === selectedId ? { ...s, ...patch } : s)));

  const applyLook = (chain) => {
    const next = deserializeChain(chain);
    setStages(next);
    setSelectedId(next[0]?.id ?? null);
    setLeftTab("layers");
  };

  const selIndex = stages.findIndex((s) => s.id === selectedId);
  const moveSelected = (dir) =>
    setStages((prev) => {
      const next = [...prev];
      const [s] = next.splice(selIndex, 1);
      next.splice(selIndex + dir, 0, s);
      return next;
    });
  const selectedActions = selected && {
    canUp: selIndex > 0,
    canDown: selIndex < stages.length - 1,
    up: () => moveSelected(-1),
    down: () => moveSelected(1),
    duplicate: () => {
      const copy = { ...selected, id: newId() };
      setStages((prev) => [...prev.slice(0, selIndex + 1), copy, ...prev.slice(selIndex + 1)]);
      setSelectedId(copy.id);
    },
    remove: () => {
      setSelectedId(stages[selIndex + 1]?.id ?? stages[selIndex - 1]?.id ?? null);
      setStages((prev) => prev.filter((s) => s.id !== selected.id));
    },
  };

  const openExport = () => {
    setPlaying(false);
    setModal("export");
  };

  const fixedDuration = source.kind === "video" || source.kind === "animation";
  const outW = Math.max(1, Math.round(source.width * resolution));
  const outH = Math.max(1, Math.round(source.height * resolution));

  const looks = <LooksPanel source={source} stages={stages} renderThumb={renderThumb} onApply={(c) => { applyLook(c); setMobileTab("layers"); }} />;
  const layers = (
    <ChainPanel stages={stages} selectedId={selectedId} onSelect={select} onChange={setStages} onAdd={() => setModal("library")} />
  );

  return (
    <div className={`app m-${mobileTab}`}>
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden="true" />
          <h1>Dither Kit</h1>
        </div>
        <button className="source-chip" onClick={() => fileRef.current.click()} title="Open a different image or video">
          <span className={`dot ${live ? "live" : ""}`} />
          <span className="ellipsis">{source.name}</span>
          <span className="muted mono">{source.width}×{source.height}</span>
        </button>
        <div className="top-actions">
          <div className="history">
            <button className="icon" onClick={history.undo} disabled={!history.canUndo} title="Undo (Ctrl+Z)" aria-label="Undo"><Undo2 size={17} /></button>
            <button className="icon" onClick={history.redo} disabled={!history.canRedo} title="Redo (Ctrl+Shift+Z)" aria-label="Redo"><Redo2 size={17} /></button>
          </div>
          <button className="ghost with-icon" onClick={() => fileRef.current.click()} aria-label="Open file">
            <Upload size={16} /><span>Open</span>
          </button>
          <button className="ghost with-icon" onClick={() => replaceSource(loadWebcam)} aria-label="Use camera">
            <Camera size={16} /><span>Camera</span>
          </button>
          <button className="primary with-icon" onClick={openExport} aria-label="Export">
            <Download size={16} /><span>Export</span>
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*,video/*" hidden
          onChange={(e) => { openFile(e.target.files[0]); e.target.value = ""; }} />
      </header>

      <aside className="panel left" aria-label={leftTab === "looks" ? "Looks" : "Layers"}>
        <div className="panel-tabs">
          <button className={leftTab === "looks" ? "on" : ""} onClick={() => setLeftTab("looks")}>
            <Sparkles size={15} /> Looks
          </button>
          <button className={leftTab === "layers" ? "on" : ""} onClick={() => setLeftTab("layers")}>
            <Layers size={15} /> Layers <span className="count">{stages.length}</span>
          </button>
        </div>
        <div className="panel-body">
          <div className={`slot slot-looks ${leftTab === "looks" ? "show" : ""}`}>{looks}</div>
          <div className={`slot slot-layers ${leftTab === "layers" ? "show" : ""}`}>{layers}</div>
        </div>
      </aside>

      <main
        className={`viewer ${dragging ? "dragging" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={(e) => { if (e.currentTarget === e.target) setDragging(false); }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          openFile(e.dataTransfer.files[0]);
        }}
      >
        <div className={`stage zoom-${zoom}`}>
          <canvas ref={displayRef} style={zoom === "fit" ? undefined : { width: size.width * zoom, height: size.height * zoom }} />
        </div>
        {showOriginal && <span className="viewer-tag">Original</span>}
        {source.demo && !dragging && (
          <button className="first-run" onClick={() => fileRef.current.click()}>
            <Upload size={15} />
            <span className="long">Drop, paste or open your own image or video</span>
            <span className="short">Use your own image or video</span>
          </button>
        )}
        <div className="toolbar">
          <div className="seg" role="group" aria-label="Zoom">
            {ZOOMS.map((z) => (
              <button key={z} className={z === zoom ? "on" : ""} onClick={() => setZoom(z)} title={z === "fit" ? "Fit to view" : `${z}× pixels`}>
                {z === "fit" ? <Maximize2 size={14} /> : `${z}×`}
              </button>
            ))}
          </div>
          <label className="res" title="Working resolution: lower means chunkier pixels and faster renders">
            <span>Pixel</span>
            <input type="range" min={0.05} max={1} step={0.01} value={resolution} aria-label="Working resolution"
              style={{ "--p": `${((resolution - 0.05) / 0.95) * 100}%` }}
              onChange={(e) => setResolution(+e.target.value)} />
            <span className="mono">{Math.round(resolution * 100)}%</span>
          </label>
          <button className={`icon compare ${showOriginal ? "on" : ""}`} title="Hold to compare with the original" aria-label="Hold to compare"
            onPointerDown={() => setShowOriginal(true)} onPointerUp={() => setShowOriginal(false)}
            onPointerLeave={() => setShowOriginal(false)} onPointerCancel={() => setShowOriginal(false)}
            onContextMenu={(e) => e.preventDefault()}>
            <Columns2 size={16} />
          </button>
          <span className="stat mono">{outW}×{outH} · {renderMs}ms</span>
        </div>
        {dragging && <div className="drop-hint"><Upload size={22} /> Drop to open</div>}
        {(error || loadError) && <p className="error overlay" role="alert">{loadError ?? error}</p>}
      </main>

      <aside className="panel right" aria-label="Adjust">
        <ParamPanel stage={selected} t={t} onStage={updateSelected} actions={selectedActions}
          extractFrom={() => sourceCanvas(source, resolution, t)}
          onBrowse={() => { setLeftTab("looks"); setMobileTab("looks"); }} />
      </aside>

      <footer className="dock">
        <Timeline t={t} duration={duration} fps={fps} playing={playing} live={live} stages={stages}
          fixedDuration={fixedDuration}
          onTime={(v) => { setPlaying(false); setT(Math.min(v, duration)); }}
          onPlay={() => setPlaying((p) => !p)} onFps={setFps} onDuration={setDuration} />
      </footer>

      <nav className="tabbar" aria-label="Panels">
        {[
          ["looks", Sparkles, "Looks"],
          ["layers", Layers, "Layers"],
          ["adjust", SlidersHorizontal, "Adjust"],
        ].map(([id, Icon, label]) => (
          <button key={id} className={mobileTab === id ? "on" : ""} aria-current={mobileTab === id}
            onClick={() => { setMobileTab(id); if (id !== "adjust") setLeftTab(id); }}>
            <Icon size={20} />
            <span>{label}{id === "layers" && <span className="count">{stages.length}</span>}</span>
          </button>
        ))}
      </nav>

      {modal === "library" && <Library onPick={addStage} onClose={() => setModal(null)} />}
      {modal === "export" && (
        <ExportPanel displayRef={displayRef} sourceName={source.name} hasText={hasText} getGrid={getPreviewGrid}
          duration={duration} fps={fps}
          runAnimation={(fn) => runExport({ source, stages, resolution }, fn)} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
