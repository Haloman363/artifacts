// Controls generated from a filter's optionTypes schema, so every engine filter gets UI.
import { ChevronDown, ChevronUp, Copy, Diamond, Eye, EyeOff, RotateCcw, SlidersHorizontal, Trash } from "lucide-react";
import { evaluate, hasKeyAt, removeKey, setKey } from "../engine/keyframes.js";
import { baseOptions } from "../engine/presets.js";
import { CharsetPicker } from "./CharsetPicker.jsx";
import { PalettePicker } from "./PalettePicker.jsx";

// Settings past this many sit behind "More settings".
const BASIC_COUNT = 8;
const HIDDEN_TYPES = ["ACTION", "CURVE", "THRESHOLD_MAP_PREVIEW"];

const humanize = (key) => key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
const toHex = (c = [0, 0, 0]) => "#" + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
const fromHex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

const isVisible = (def, options) => {
  try {
    return def.visibleWhen ? def.visibleWhen(options) : true;
  } catch {
    return true;
  }
};

const EnumSelect = ({ def, value, onChange }) => (
  <select value={String(value)} onChange={(e) => {
    const flat = def.options.flatMap((o) => o.options ?? [o]);
    const hit = flat.find((o) => String(o.value) === e.target.value);
    onChange(hit ? hit.value : e.target.value);
  }}>
    {def.options.map((o, i) =>
      o.options ? (
        <optgroup key={i} label={o.label}>
          {o.options.map((opt) => (
            <option key={String(opt.value)} value={String(opt.value)}>{opt.name ?? opt.value}</option>
          ))}
        </optgroup>
      ) : (
        <option key={String(o.value)} value={String(o.value)}>{o.name ?? o.value}</option>
      ),
    )}
  </select>
);

// Enums with a handful of short choices read better as a segmented control.
const isSegmentable = (def) =>
  def.options.length <= 3 && def.options.every((o) => !o.options && String(o.name ?? o.value).length <= 14);

function RangeParam({ name, label, def, stage, t, onStage }) {
  const keys = stage.keyframes?.[name];
  const keyed = keys?.length > 0;
  const [min, max] = def.range;
  const raw = keyed ? evaluate(keys, t) : stage.options[name];
  const value = Number.isFinite(raw) ? raw : (def.default ?? min);
  const step = def.step ?? (max - min > 20 ? 1 : 0.01);
  const onKeyframe = keyed && hasKeyAt(keys, t);

  const set = (v) => {
    if (keyed) onStage({ keyframes: { ...stage.keyframes, [name]: setKey(keys, t, v) } });
    else onStage({ options: { ...stage.options, [name]: v } });
  };
  const toggleKey = () => {
    const next = onKeyframe ? removeKey(keys, t) : setKey(keys, t, value);
    // The last removed key hands its value back to the static option.
    const options = next.length ? stage.options : { ...stage.options, [name]: value };
    onStage({ options, keyframes: { ...stage.keyframes, [name]: next } });
  };

  return (
    <div className={`param ${keyed ? "keyed" : ""}`} title={def.desc}>
      <div className="param-head">
        <span className="label">{label}</span>
        <input className="num" type="number" inputMode="decimal" min={min} max={max} step={step}
          value={+Number(value).toFixed(3)} onChange={(e) => set(+e.target.value)} aria-label={`${label} value`} />
        <button
          className={`key ${onKeyframe ? "on" : keyed ? "tracked" : ""}`}
          title={onKeyframe ? "Remove keyframe here" : "Keyframe this value at the playhead"}
          aria-pressed={onKeyframe}
          onClick={toggleKey}
        >
          <Diamond size={12} fill={onKeyframe ? "currentColor" : "none"} />
        </button>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} aria-label={label}
        style={{ "--p": `${((value - min) / (max - min)) * 100}%` }}
        onChange={(e) => set(+e.target.value)} />
    </div>
  );
}

function Control({ def, value, set, extractFrom }) {
  switch (def.type) {
    case "BOOL":
      return (
        <button role="switch" aria-checked={!!value} className={`switch ${value ? "on" : ""}`} onClick={() => set(!value)}>
          <span />
        </button>
      );
    case "ENUM":
      return isSegmentable(def) ? (
        <div className="seg full">
          {def.options.map((o) => (
            <button key={String(o.value)} className={o.value === value ? "on" : ""} onClick={() => set(o.value)}>
              {o.name ?? o.value}
            </button>
          ))}
        </div>
      ) : (
        <EnumSelect def={def} value={value} onChange={set} />
      );
    case "CHARSET":
      return <CharsetPicker value={value} onChange={set} />;
    case "STRING":
      return <input type="text" value={value ?? ""} onChange={(e) => set(e.target.value)} />;
    case "TEXT":
      return <textarea rows={6} value={value ?? ""} onChange={(e) => set(e.target.value)} />;
    case "COLOR":
      return (
        <label className="color-field">
          <input type="color" value={toHex(value)} onChange={(e) => set(fromHex(e.target.value))} />
          <span className="mono">{toHex(value)}</span>
        </label>
      );
    case "COLOR_ARRAY":
      return (
        <div className="swatches">
          {(value ?? []).map((c, i) => (
            <input key={i} type="color" value={toHex(c)} onChange={(e) => {
              const next = [...value];
              next[i] = [...fromHex(e.target.value), ...(c.length > 3 ? [c[3]] : [])];
              set(next);
            }} />
          ))}
        </div>
      );
    case "PALETTE":
      return <PalettePicker value={value} onChange={set} extractFrom={extractFrom} />;
    default:
      return null;
  }
}

function Param({ name, def, stage, t, onStage, extractFrom }) {
  const label = def.label ?? humanize(name);
  if (def.type === "RANGE") return <RangeParam name={name} label={label} def={def} stage={stage} t={t} onStage={onStage} />;
  const set = (v) => onStage({ options: { ...stage.options, [name]: v } });
  const inline = def.type === "BOOL" || def.type === "COLOR";
  const control = <Control def={def} value={stage.options[name]} set={set} extractFrom={extractFrom} />;
  return (
    <div className={`param param-${def.type.toLowerCase()} ${inline ? "inline" : ""}`} title={def.desc}>
      <div className="param-head">
        <span className="label">{label}</span>
        {inline && control}
      </div>
      {!inline && control}
    </div>
  );
}

export function ParamPanel({ stage, t, onStage, extractFrom, actions, onBrowse }) {
  if (!stage) {
    return (
      <div className="adjust empty-state">
        <SlidersHorizontal size={28} />
        <strong>Nothing selected</strong>
        <p>Pick an effect in Layers, or choose a look to start from.</p>
        {onBrowse && <button className="ghost" onClick={onBrowse}>Browse looks</button>}
      </div>
    );
  }
  const shown = Object.entries(stage.filter.optionTypes ?? {}).filter(
    ([, def]) => !HIDDEN_TYPES.includes(def.type) && isVisible(def, stage.options),
  );
  const basic = shown.slice(0, BASIC_COUNT);
  const more = shown.slice(BASIC_COUNT);
  const render = ([name, def]) => (
    <Param key={name} name={name} def={def} stage={stage} t={t} onStage={onStage} extractFrom={extractFrom} />
  );

  return (
    <div className="adjust">
      <div className="adjust-head">
        <div className="title">
          <span className="cat-pill">{stage.category}</span>
          <h2>{stage.displayName}</h2>
        </div>
        {actions && (
          <div className="head-tools">
            <button className="icon" title={stage.enabled ? "Hide effect" : "Show effect"} aria-pressed={stage.enabled}
              onClick={() => onStage({ enabled: !stage.enabled })}>
              {stage.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
            <button className="icon" title="Move up" disabled={!actions.canUp} onClick={actions.up}><ChevronUp size={16} /></button>
            <button className="icon" title="Move down" disabled={!actions.canDown} onClick={actions.down}><ChevronDown size={16} /></button>
            <button className="icon" title="Duplicate" onClick={actions.duplicate}><Copy size={15} /></button>
            <button className="icon danger" title="Remove" onClick={actions.remove}><Trash size={15} /></button>
          </div>
        )}
        {stage.filter.description && <p className="desc">{stage.filter.description}</p>}
      </div>

      {shown.length === 0 && <p className="muted">This effect has no settings.</p>}
      {basic.map(render)}
      {more.length > 0 && (
        <details className="more">
          <summary>More settings <span className="count">{more.length}</span></summary>
          {more.map(render)}
        </details>
      )}
      <button className="ghost small reset" onClick={() => onStage({ options: baseOptions(stage.filter), keyframes: {} })}>
        <RotateCcw size={13} /> Reset to defaults
      </button>
    </div>
  );
}
