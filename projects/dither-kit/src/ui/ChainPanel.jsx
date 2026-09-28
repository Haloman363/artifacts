import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, Diamond, Eye, EyeOff, GripVertical, Plus, Trash } from "lucide-react";
import { newId } from "../engine/presets.js";

export function ChainPanel({ stages, selectedId, onSelect, onChange, onAdd }) {
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);

  const move = (from, to) => {
    if (to < 0 || to >= stages.length || from === to) return;
    const next = [...stages];
    const [s] = next.splice(from, 1);
    next.splice(to, 0, s);
    onChange(next);
  };
  const update = (id, patch) => onChange(stages.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  return (
    <div className="layers">
      {stages.length === 0 ? (
        <button className="empty" onClick={onAdd}>
          <Plus size={20} />
          <strong>Add your first effect</strong>
          <span>Pick a dither, glitch or ASCII effect to start.</span>
        </button>
      ) : (
        <ol>
          {stages.map((s, i) => (
            <li
              key={s.id}
              className={[s.id === selectedId && "selected", !s.enabled && "off", overId === s.id && dragId !== s.id && "over"]
                .filter(Boolean)
                .join(" ")}
              draggable
              onDragStart={() => setDragId(s.id)}
              onDragEnd={() => { setDragId(null); setOverId(null); }}
              onDragOver={(e) => { e.preventDefault(); setOverId(s.id); }}
              onDrop={() => {
                move(stages.findIndex((x) => x.id === dragId), i);
                setDragId(null);
                setOverId(null);
              }}
              onClick={() => onSelect(s.id)}
            >
              <span className="grip" aria-hidden="true"><GripVertical size={14} /></span>
              <span className="meta">
                <span className="name" title={s.displayName}>{s.displayName}</span>
                <span className="cat">
                  {s.category}
                  {Object.values(s.keyframes ?? {}).some((k) => k.length) && (
                    <span className="kf"><Diamond size={9} fill="currentColor" /> animated</span>
                  )}
                </span>
              </span>
              <span className="row-tools" onClick={(e) => e.stopPropagation()}>
                <button className="icon" title="Move up" disabled={i === 0} onClick={() => move(i, i - 1)}><ChevronUp size={15} /></button>
                <button className="icon" title="Move down" disabled={i === stages.length - 1} onClick={() => move(i, i + 1)}><ChevronDown size={15} /></button>
                <button className="icon" title="Duplicate" onClick={() => {
                  const next = [...stages];
                  next.splice(i + 1, 0, { ...s, id: newId() });
                  onChange(next);
                }}><Copy size={14} /></button>
                <button className="icon danger" title="Remove" onClick={() => onChange(stages.filter((x) => x.id !== s.id))}><Trash size={14} /></button>
              </span>
              <button
                className={`icon eye ${s.enabled ? "on" : ""}`}
                title={s.enabled ? "Hide effect" : "Show effect"}
                aria-pressed={s.enabled}
                onClick={(e) => { e.stopPropagation(); update(s.id, { enabled: !s.enabled }); }}
              >
                {s.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </li>
          ))}
        </ol>
      )}
      {stages.length > 0 && (
        <button className="add-layer" onClick={onAdd}><Plus size={16} /> Add effect</button>
      )}
      <p className="note">Effects apply top to bottom. Drag to reorder.</p>
    </div>
  );
}
