// Preset gallery with live thumbnails of each look applied to the current source,
// plus saving, importing and exporting your own looks.
import { useEffect, useRef, useState } from "react";
import { Download, FileUp, Save, Trash } from "lucide-react";
import {
  BUILTIN_PRESETS,
  deleteUserPreset,
  deserializeChain,
  loadUserPresets,
  parsePresetFile,
  presetBlob,
  saveUserPreset,
  serializeChain,
} from "../engine/presets.js";
import { download } from "../engine/export.js";

const THUMB_W = 240;

function useThumbs(source, presets, renderThumb) {
  const [thumbs, setThumbs] = useState({});
  const key = JSON.stringify(presets.map((p) => [p.name, p.chain]));
  useEffect(() => {
    let cancelled = false;
    const urls = [];
    setThumbs({});
    (async () => {
      for (const p of presets) {
        if (cancelled) break;
        try {
          const url = await renderThumb(source, deserializeChain(p.chain), THUMB_W);
          urls.push(url);
          if (!cancelled) setThumbs((prev) => ({ ...prev, [p.name]: url }));
        } catch {
          // A failing look just keeps its placeholder.
        }
      }
    })();
    return () => {
      cancelled = true;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
    // `key` stands in for `presets`, which is rebuilt each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, key, renderThumb]);
  return thumbs;
}

function LookCard({ preset, thumb, onApply, onDelete, onDownload }) {
  return (
    <div className="look">
      <button className="look-main" onClick={() => onApply(preset.chain)} title={preset.chain.map((c) => c.name).join(" → ")}>
        <span className="look-thumb">{thumb ? <img src={thumb} alt="" /> : <span className="shimmer" />}</span>
        <span className="look-name">{preset.name}</span>
      </button>
      {onDelete && (
        <span className="look-tools">
          <button className="icon" title="Download file" onClick={onDownload}><Download size={14} /></button>
          <button className="icon danger" title="Delete" onClick={onDelete}><Trash size={14} /></button>
        </span>
      )}
    </div>
  );
}

export function LooksPanel({ source, stages, renderThumb, onApply }) {
  const [user, setUser] = useState(loadUserPresets);
  const [name, setName] = useState("");
  const [err, setErr] = useState(null);
  const fileRef = useRef(null);
  const builtinThumbs = useThumbs(source, BUILTIN_PRESETS, renderThumb);
  const userThumbs = useThumbs(source, user, renderThumb);

  const attempt = (fn) => {
    setErr(null);
    try {
      fn();
    } catch (e) {
      setErr(e.message);
    }
  };

  const save = () =>
    attempt(() => {
      setUser(saveUserPreset(name.trim(), stages));
      setName("");
    });

  return (
    <div className="looks">
      <div className="looks-grid">
        {BUILTIN_PRESETS.map((p) => (
          <LookCard key={p.name} preset={p} thumb={builtinThumbs[p.name]} onApply={onApply} />
        ))}
      </div>

      <div className="section-title">My looks</div>
      {user.length > 0 && (
        <div className="looks-grid">
          {user.map((p) => (
            <LookCard key={p.name} preset={p} thumb={userThumbs[p.name]} onApply={onApply}
              onDownload={() => download(presetBlob(p.name, p.chain), `${p.name}.dither.json`)}
              onDelete={() => attempt(() => setUser(deleteUserPreset(p.name)))} />
          ))}
        </div>
      )}
      <form className="save-look" onSubmit={(e) => { e.preventDefault(); if (name.trim() && stages.length) save(); }}>
        <input placeholder="Name current look" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="primary" disabled={!name.trim() || !stages.length} title="Save look"><Save size={16} /></button>
      </form>
      <div className="row">
        <button className="ghost small grow" onClick={() => fileRef.current.click()}><FileUp size={14} /> Import</button>
        <button className="ghost small grow" disabled={!stages.length}
          onClick={() => download(presetBlob(name.trim() || "look", serializeChain(stages)), `${name.trim() || "look"}.dither.json`)}>
          <Download size={14} /> Export
        </button>
        <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={async (e) => {
          const file = e.target.files[0];
          e.target.value = "";
          if (!file) return;
          const text = await file.text();
          attempt(() => onApply(parsePresetFile(text).chain));
        }} />
      </div>
      {err && <p className="error small">{err}</p>}
    </div>
  );
}
