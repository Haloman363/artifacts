import { useState, useEffect } from "react";
import { Plus, ChevronRight, X, Edit2, Syringe, Pill, ClipboardList, BarChart2, ArrowLeft } from "lucide-react";

const STORAGE_KEY = "peptides-v1";

const INJECTION_SITES = [
  "Abdomen Left", "Abdomen Right",
  "Thigh Left", "Thigh Right",
  "Shoulder Left", "Shoulder Right",
  "Glute Left", "Glute Right",
];

const TIMING_OPTIONS = ["Morning", "Evening", "With food", "Other"];

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { peptides: [], supplements: [], shots: [], metrics: [] };
  } catch {
    return { peptides: [], supplements: [], shots: [], metrics: [] };
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function makeId() {
  return crypto.randomUUID();
}

function calcConcentration(vialSizeMg, bacWaterMl) {
  if (!bacWaterMl || bacWaterMl === 0) return null;
  return vialSizeMg / bacWaterMl;
}

function calcDoseToMl(desiredDoseMcg, vialSizeMg, bacWaterMl) {
  const conc = calcConcentration(vialSizeMg, bacWaterMl);
  if (!conc) return null;
  return (desiredDoseMcg / 1000) / conc;
}

function calcDaysSupply(currentAmountMg, typicalDoseMcg) {
  if (!typicalDoseMcg || typicalDoseMcg <= 0) return null;
  return Math.floor(currentAmountMg / (typicalDoseMcg / 1000));
}

function fmt(n, decimals = 3) {
  if (n == null) return "—";
  return n.toFixed(decimals).replace(/\.?0+$/, "");
}

function UpdateRemaining({ currentAmountMg, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(currentAmountMg.toString());

  function submit() {
    const n = parseFloat(val);
    if (!isNaN(n) && n >= 0) onUpdate(n);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          autoFocus type="number" min="0" step="0.01"
          value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") submit(); if (e.key === "Escape") setEditing(false); }}
          className="flex-1 bg-gray-800 border border-blue-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
        />
        <button onClick={submit} className="text-blue-400 text-sm font-medium active:opacity-60">Save</button>
        <button onClick={() => setEditing(false)} className="text-gray-500 text-sm active:opacity-60">Cancel</button>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setVal(currentAmountMg.toString()); setEditing(true); }}
      className="text-sm text-gray-400 active:opacity-60"
    >
      {currentAmountMg} mg remaining · <span className="text-blue-500">update</span>
    </button>
  );
}

function PeptideForm({ initial, onSave, onCancel }) {
  const [name, setName]               = useState(initial?.name ?? "");
  const [vialSizeMg, setVialSizeMg]   = useState(initial?.vialSizeMg?.toString() ?? "");
  const [bacWaterMl, setBacWaterMl]   = useState(initial?.bacWaterMl?.toString() ?? "");
  const [currentAmountMg, setCurrent] = useState(initial?.currentAmountMg?.toString() ?? "");
  const [typicalDoseMcg, setTypical]  = useState(initial?.typicalDoseMcg?.toString() ?? "");
  const [notes, setNotes]             = useState(initial?.notes ?? "");

  function handleSubmit(e) {
    e.preventDefault();
    const vial = parseFloat(vialSizeMg) || 0;
    onSave({
      name: name.trim(),
      vialSizeMg: vial,
      bacWaterMl: parseFloat(bacWaterMl) || 0,
      currentAmountMg: initial ? (parseFloat(currentAmountMg) || 0) : vial,
      typicalDoseMcg: parseFloat(typicalDoseMcg) || null,
      notes: notes.trim(),
    });
  }

  const inputCls = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-600";
  const labelCls = "block text-xs text-gray-400 mb-1";

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center" onClick={onCancel}>
      <div
        className="bg-gray-900 border border-gray-800 rounded-t-2xl w-full max-w-sm px-5 py-6 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg">{initial ? "Edit Peptide" : "Add Peptide"}</h2>
          <button onClick={onCancel}><X size={20} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className={labelCls}>Name</label>
            <input className={inputCls} placeholder="e.g. BPC-157" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Vial Size (mg)</label>
              <input className={inputCls} type="number" min="0" step="0.1" placeholder="5" value={vialSizeMg} onChange={e => setVialSizeMg(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>BAC Water (mL)</label>
              <input className={inputCls} type="number" min="0" step="0.1" placeholder="2" value={bacWaterMl} onChange={e => setBacWaterMl(e.target.value)} required />
            </div>
          </div>
          {initial && (
            <div>
              <label className={labelCls}>Remaining Amount (mg)</label>
              <input className={inputCls} type="number" min="0" step="0.01" placeholder="5" value={currentAmountMg} onChange={e => setCurrent(e.target.value)} />
            </div>
          )}
          <div>
            <label className={labelCls}>Typical Dose (mcg) — for days-supply estimate</label>
            <input className={inputCls} type="number" min="0" step="1" placeholder="250" value={typicalDoseMcg} onChange={e => setTypical(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Notes (optional)</label>
            <input className={inputCls} placeholder="Protocol, source, etc." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <button type="submit" className="w-full bg-blue-700 hover:bg-blue-600 active:scale-95 transition-transform rounded-xl py-3 font-semibold text-sm mt-2">
            {initial ? "Save Changes" : "Add Peptide"}
          </button>
        </form>
      </div>
    </div>
  );
}

function PeptideDetail({ p, conc, days, onBack, onEdit, onDelete, onUpdateRemaining, calcDoseToMlFn }) {
  const [calcDose, setCalcDose] = useState("");
  const mlResult = calcDose ? calcDoseToMlFn(parseFloat(calcDose), p.vialSizeMg, p.bacWaterMl) : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 pb-10 pt-6">
      <div className="max-w-sm mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="text-gray-400 text-sm active:opacity-60 flex items-center gap-1"><ArrowLeft size={16} /> Back</button>
          <button onClick={onEdit} className="text-gray-400 active:opacity-60"><Edit2 size={16} /></button>
        </div>

        <h1 className="text-xl font-bold mb-1">{p.name}</h1>
        <p className="text-sm text-gray-500 mb-4">{p.vialSizeMg}mg vial · {p.bacWaterMl}mL BAC water</p>

        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { label: "Remaining", value: `${fmt(p.currentAmountMg, 2)} mg` },
            { label: "Concentration", value: conc ? `${fmt(conc, 2)} mg/mL` : "—" },
            { label: "Est. Days", value: days != null ? `${days}d` : "—" },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-center">
              <p className="text-xs text-gray-500 mb-0.5">{s.label}</p>
              <p className="text-sm font-semibold">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Vial progress</span>
            <span>{Math.round((p.currentAmountMg / p.vialSizeMg) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (p.currentAmountMg / p.vialSizeMg) * 100)}%` }} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-4 mb-4">
          <p className="text-sm font-semibold mb-3">Dose Calculator</p>
          <label className="block text-xs text-gray-400 mb-1">Desired dose (mcg)</label>
          <input
            type="number" min="0" step="1" placeholder="e.g. 250"
            value={calcDose} onChange={e => setCalcDose(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-600 mb-3"
          />
          {mlResult != null && (
            <div className="bg-blue-950 border border-blue-800 rounded-lg px-3 py-2 text-center">
              <p className="text-xs text-blue-400 mb-0.5">Draw</p>
              <p className="text-2xl font-bold text-blue-300">{fmt(mlResult, 3)} mL</p>
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-4 mb-4">
          <p className="text-sm font-semibold mb-3">Update Remaining</p>
          <UpdateRemaining
            currentAmountMg={p.currentAmountMg}
            onUpdate={onUpdateRemaining}
          />
        </div>

        {p.notes && <p className="text-xs text-gray-500 mb-4">{p.notes}</p>}

        <button
          onClick={onDelete}
          className="w-full text-xs text-red-700 hover:text-red-500 active:opacity-60 py-2"
        >
          Delete this peptide
        </button>
      </div>
    </div>
  );
}

function SupplementForm({ initial, onSave, onCancel }) {
  const [name, setName]           = useState(initial?.name ?? "");
  const [dose, setDose]           = useState(initial?.dose ?? "");
  const [unit, setUnit]           = useState(initial?.unit ?? "mg");
  const [frequency, setFrequency] = useState(initial?.frequency ?? "Daily");
  const [timing, setTiming]       = useState(initial?.timing ?? "Morning");
  const [notes, setNotes]         = useState(initial?.notes ?? "");
  const [startDate, setStartDate] = useState(initial?.startDate ?? new Date().toISOString().split("T")[0]);

  function handleSubmit(e) {
    e.preventDefault();
    onSave({ name: name.trim(), dose: dose.trim(), unit: unit.trim(), frequency: frequency.trim(), timing, notes: notes.trim(), startDate });
  }

  const inputCls = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-600";
  const labelCls = "block text-xs text-gray-400 mb-1";
  const selCls = inputCls + " appearance-none";

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center" onClick={onCancel}>
      <div
        className="bg-gray-900 border border-gray-800 rounded-t-2xl w-full max-w-sm px-5 py-6 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg">{initial ? "Edit Supplement" : "Add Supplement"}</h2>
          <button onClick={onCancel}><X size={20} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className={labelCls}>Name</label>
            <input className={inputCls} placeholder="e.g. Vitamin D" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Dose</label>
              <input className={inputCls} placeholder="5000" value={dose} onChange={e => setDose(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Unit</label>
              <input className={inputCls} placeholder="IU / mg / g" value={unit} onChange={e => setUnit(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Frequency</label>
              <input className={inputCls} placeholder="Daily" value={frequency} onChange={e => setFrequency(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Timing</label>
              <select className={selCls} value={timing} onChange={e => setTiming(e.target.value)}>
                {TIMING_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Start Date</label>
            <input className={inputCls} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Notes (optional)</label>
            <input className={inputCls} placeholder="Brand, link, etc." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <button type="submit" className="w-full bg-green-700 hover:bg-green-600 active:scale-95 transition-transform rounded-xl py-3 font-semibold text-sm mt-2">
            {initial ? "Save Changes" : "Add Supplement"}
          </button>
        </form>
      </div>
    </div>
  );
}

function ShotForm({ peptides, onSave, onCancel }) {
  const today = new Date().toISOString().split("T")[0];
  const now = new Date().toTimeString().slice(0, 5);
  const [peptideId, setPeptideId] = useState(peptides[0]?.id ?? "");
  const [date, setDate]           = useState(today);
  const [time, setTime]           = useState(now);
  const [amountMl, setAmountMl]   = useState("");
  const [site, setSite]           = useState(INJECTION_SITES[0]);
  const [weightLbs, setWeightLbs] = useState("");
  const [notes, setNotes]         = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const parsed = parseFloat(weightLbs);
    onSave({
      peptideId,
      date,
      time,
      amountMl: parseFloat(amountMl) || 0,
      site,
      weightLbs: !isNaN(parsed) && weightLbs !== "" ? parsed : null,
      notes: notes.trim(),
    });
  }

  const inputCls = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-600";
  const labelCls = "block text-xs text-gray-400 mb-1";
  const selCls = inputCls + " appearance-none";

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center" onClick={onCancel}>
      <div
        className="bg-gray-900 border border-gray-800 rounded-t-2xl w-full max-w-sm px-5 py-6 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg">Log Shot</h2>
          <button onClick={onCancel}><X size={20} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className={labelCls}>Peptide</label>
            <select className={selCls} value={peptideId} onChange={e => setPeptideId(e.target.value)}>
              {peptides.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Date</label>
              <input className={inputCls} type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Time</label>
              <input className={inputCls} type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Amount (mL)</label>
              <input className={inputCls} type="number" min="0" step="0.01" placeholder="0.10" value={amountMl} onChange={e => setAmountMl(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Weight (lbs, optional)</label>
              <input className={inputCls} type="number" min="0" step="0.1" placeholder="185" value={weightLbs} onChange={e => setWeightLbs(e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Injection Site</label>
            <select className={selCls} value={site} onChange={e => setSite(e.target.value)}>
              {INJECTION_SITES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Notes (optional)</label>
            <input className={inputCls} placeholder="Reactions, observations..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <button type="submit" className="w-full bg-purple-700 hover:bg-purple-600 active:scale-95 transition-transform rounded-xl py-3 font-semibold text-sm mt-2">
            Save Shot
          </button>
        </form>
      </div>
    </div>
  );
}

function MetricForm({ onSave, onCancel }) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate]           = useState(today);
  const [weightLbs, setWeightLbs] = useState("");
  const [bodyFatPct, setBodyFat]  = useState("");
  const [notes, setNotes]         = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const w = parseFloat(weightLbs);
    const bf = parseFloat(bodyFatPct);
    onSave({
      date,
      weightLbs: !isNaN(w) && weightLbs !== "" ? w : null,
      bodyFatPct: !isNaN(bf) && bodyFatPct !== "" ? bf : null,
      notes: notes.trim(),
    });
  }

  const inputCls = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-600";
  const labelCls = "block text-xs text-gray-400 mb-1";

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center" onClick={onCancel}>
      <div
        className="bg-gray-900 border border-gray-800 rounded-t-2xl w-full max-w-sm px-5 py-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg">Log Metrics</h2>
          <button onClick={onCancel}><X size={20} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className={labelCls}>Date</label>
            <input className={inputCls} type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Weight (lbs)</label>
              <input className={inputCls} type="number" min="0" step="0.1" placeholder="185" value={weightLbs} onChange={e => setWeightLbs(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Body Fat %</label>
              <input className={inputCls} type="number" min="0" max="100" step="0.1" placeholder="18" value={bodyFatPct} onChange={e => setBodyFat(e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Notes (optional)</label>
            <input className={inputCls} placeholder="How you're feeling, etc." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <button type="submit" className="w-full bg-orange-700 hover:bg-orange-600 active:scale-95 transition-transform rounded-xl py-3 font-semibold text-sm mt-2">
            Save Entry
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Peptides() {
  const [data, setData] = useState(loadData);
  const [view, setView] = useState("hub");
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => { saveData(data); }, [data]);

  const { peptides, supplements, shots, metrics } = data;

  function updateData(patch) {
    setData(prev => ({ ...prev, ...patch }));
  }

  if (view === "hub") {
    const lastShot = shots.length > 0
      ? shots.slice().sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))[0]
      : null;
    const lastMetric = metrics.length > 0
      ? metrics.slice().sort((a, b) => b.date.localeCompare(a.date))[0]
      : null;

    const tiles = [
      {
        id: "peptides", icon: <Syringe size={28} />, label: "Peptides",
        sub: peptides.length === 0 ? "No vials" : `${peptides.length} vial${peptides.length !== 1 ? "s" : ""}`,
        bg: "bg-blue-900",
      },
      {
        id: "supplements", icon: <Pill size={28} />, label: "Supplements",
        sub: supplements.length === 0 ? "None tracked" : `${supplements.length} tracked`,
        bg: "bg-green-900",
      },
      {
        id: "shots", icon: <ClipboardList size={28} />, label: "Shot Log",
        sub: lastShot ? `Last: ${new Date(lastShot.date).toLocaleDateString()}` : "No shots logged",
        bg: "bg-purple-900",
      },
      {
        id: "metrics", icon: <BarChart2 size={28} />, label: "Metrics",
        sub: lastMetric?.weightLbs ? `${lastMetric.weightLbs} lbs` : "No entries",
        bg: "bg-orange-900",
      },
    ];

    return (
      <div className="min-h-screen bg-gray-950 text-white px-4 pb-10 pt-6">
        <div className="max-w-sm mx-auto">
          <h1 className="text-xl font-bold mb-6">Peptides & Supplements</h1>
          <div className="grid grid-cols-2 gap-4">
            {tiles.map(t => (
              <button
                key={t.id}
                onClick={() => setView(t.id)}
                className={`${t.bg} rounded-2xl p-4 flex flex-col items-start gap-2 active:scale-95 transition-transform text-left`}
              >
                <div className="opacity-80">{t.icon}</div>
                <div>
                  <p className="font-semibold text-sm">{t.label}</p>
                  <p className="text-xs text-white/60">{t.sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Peptide handlers ─────────────────────────────────────────────────────
  function handleAddPeptide(fields) {
    const p = { id: makeId(), ...fields };
    updateData({ peptides: [...peptides, p] });
    setView("peptides");
  }

  function handleEditPeptide(fields) {
    updateData({ peptides: peptides.map(p => p.id === selectedId ? { ...p, ...fields } : p) });
    setView("peptide-detail");
  }

  function handleDeletePeptide(id) {
    updateData({ peptides: peptides.filter(p => p.id !== id) });
    setSelectedId(null);
    setView("peptides");
  }

  if (view === "add-peptide") {
    return <PeptideForm onSave={handleAddPeptide} onCancel={() => setView("peptides")} />;
  }

  if (view === "edit-peptide") {
    const p = peptides.find(p => p.id === selectedId);
    if (p) return <PeptideForm initial={p} onSave={handleEditPeptide} onCancel={() => setView("peptide-detail")} />;
  }

  // ── Peptides List ────────────────────────────────────────────────────────
  if (view === "peptides") {
    return (
      <div className="min-h-screen bg-gray-950 text-white px-4 pb-10 pt-6">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setView("hub")} className="text-gray-400 text-sm active:opacity-60 flex items-center gap-1"><ArrowLeft size={16} /> Back</button>
            <h1 className="text-lg font-bold">Peptides</h1>
            <button onClick={() => setView("add-peptide")} className="flex items-center gap-1 bg-blue-700 hover:bg-blue-600 active:scale-95 transition-transform px-3 py-1.5 rounded-lg text-sm font-medium">
              <Plus size={14} /> Add
            </button>
          </div>

          {peptides.length === 0 && (
            <div className="text-center text-gray-500 mt-20">
              <Syringe size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm">No peptides yet. Tap "Add" to get started.</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {peptides.map(p => {
              const conc = calcConcentration(p.vialSizeMg, p.bacWaterMl);
              const days = calcDaysSupply(p.currentAmountMg, p.typicalDoseMcg);
              const pctLeft = p.vialSizeMg > 0 ? Math.min(100, (p.currentAmountMg / p.vialSizeMg) * 100) : 0;
              return (
                <button
                  key={p.id}
                  onClick={() => { setSelectedId(p.id); setView("peptide-detail"); }}
                  className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-left w-full active:scale-95 transition-transform"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">{p.name}</p>
                    <ChevronRight size={16} className="text-gray-600" />
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5 mb-2">
                    <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${pctLeft}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{fmt(p.currentAmountMg, 2)} / {p.vialSizeMg} mg left</span>
                    {days != null && <span>{days} day{days !== 1 ? "s" : ""} est.</span>}
                  </div>
                  {conc && <p className="text-xs text-gray-600 mt-0.5">{fmt(conc, 2)} mg/mL</p>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Peptide Detail ───────────────────────────────────────────────────────
  if (view === "peptide-detail") {
    const p = peptides.find(p => p.id === selectedId);
    if (!p) { setView("peptides"); return null; }
    const conc = calcConcentration(p.vialSizeMg, p.bacWaterMl);
    const days = calcDaysSupply(p.currentAmountMg, p.typicalDoseMcg);

    return (
      <PeptideDetail
        p={p} conc={conc} days={days}
        onBack={() => setView("peptides")}
        onEdit={() => setView("edit-peptide")}
        onDelete={() => { if (confirm(`Delete ${p.name}?`)) handleDeletePeptide(p.id); }}
        onUpdateRemaining={val => updateData({ peptides: peptides.map(pp => pp.id === p.id ? { ...pp, currentAmountMg: val } : pp) })}
        calcDoseToMlFn={calcDoseToMl}
      />
    );
  }

  // ── Supplement handlers ──────────────────────────────────────────────────
  function handleAddSupplement(fields) {
    updateData({ supplements: [...supplements, { id: makeId(), ...fields }] });
    setView("supplements");
  }

  function handleEditSupplement(fields) {
    updateData({ supplements: supplements.map(s => s.id === selectedId ? { ...s, ...fields } : s) });
    setView("supplements");
  }

  function handleDeleteSupplement(id) {
    updateData({ supplements: supplements.filter(s => s.id !== id) });
    setSelectedId(null);
    setView("supplements");
  }

  if (view === "add-supplement") {
    return <SupplementForm onSave={handleAddSupplement} onCancel={() => setView("supplements")} />;
  }

  if (view === "edit-supplement") {
    const s = supplements.find(s => s.id === selectedId);
    if (s) return <SupplementForm initial={s} onSave={handleEditSupplement} onCancel={() => setView("supplements")} />;
  }

  // ── Supplements List ─────────────────────────────────────────────────────
  if (view === "supplements") {
    const timingColor = { Morning: "bg-yellow-900 text-yellow-300", Evening: "bg-indigo-900 text-indigo-300", "With food": "bg-green-900 text-green-300", Other: "bg-gray-800 text-gray-400" };

    return (
      <div className="min-h-screen bg-gray-950 text-white px-4 pb-10 pt-6">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setView("hub")} className="text-gray-400 text-sm active:opacity-60 flex items-center gap-1"><ArrowLeft size={16} /> Back</button>
            <h1 className="text-lg font-bold">Supplements</h1>
            <button onClick={() => setView("add-supplement")} className="flex items-center gap-1 bg-green-700 hover:bg-green-600 active:scale-95 transition-transform px-3 py-1.5 rounded-lg text-sm font-medium">
              <Plus size={14} /> Add
            </button>
          </div>

          {supplements.length === 0 && (
            <div className="text-center text-gray-500 mt-20">
              <Pill size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm">No supplements yet.</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {supplements.map(s => (
              <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.dose} {s.unit} · {s.frequency}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${timingColor[s.timing] ?? timingColor.Other}`}>{s.timing}</span>
                    <button onClick={() => { setSelectedId(s.id); setView("edit-supplement"); }} className="text-gray-600 active:opacity-60"><Edit2 size={14} /></button>
                    <button onClick={() => { if (confirm(`Delete ${s.name}?`)) handleDeleteSupplement(s.id); }} className="text-red-800 active:opacity-60"><X size={14} /></button>
                  </div>
                </div>
                {s.notes && <p className="text-xs text-gray-600 mt-1 truncate">{s.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Shot handlers ────────────────────────────────────────────────────────
  function handleAddShot(fields) {
    const peptide = peptides.find(p => p.id === fields.peptideId);
    if (peptide) {
      const conc = calcConcentration(peptide.vialSizeMg, peptide.bacWaterMl);
      if (conc) {
        const mgUsed = fields.amountMl * conc;
        updateData({
          shots: [{ id: makeId(), ...fields }, ...shots],
          peptides: peptides.map(p =>
            p.id === fields.peptideId
              ? { ...p, currentAmountMg: Math.max(0, p.currentAmountMg - mgUsed) }
              : p
          ),
        });
        return;
      }
    }
    updateData({ shots: [{ id: makeId(), ...fields }, ...shots] });
  }

  function handleDeleteShot(id) {
    updateData({ shots: shots.filter(s => s.id !== id) });
  }

  if (view === "add-shot") {
    if (peptides.length === 0) {
      return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-4 px-4">
          <p className="text-gray-400 text-sm text-center">Add a peptide first before logging a shot.</p>
          <button onClick={() => setView("peptides")} className="bg-blue-700 px-4 py-2 rounded-xl text-sm font-medium active:scale-95 transition-transform">Go to Peptides</button>
        </div>
      );
    }
    return <ShotForm peptides={peptides} onSave={fields => { handleAddShot(fields); setView("shots"); }} onCancel={() => setView("shots")} />;
  }

  // ── Shots List ───────────────────────────────────────────────────────────
  if (view === "shots") {
    const sorted = shots.slice().sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
    return (
      <div className="min-h-screen bg-gray-950 text-white px-4 pb-10 pt-6">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setView("hub")} className="text-gray-400 text-sm active:opacity-60 flex items-center gap-1"><ArrowLeft size={16} /> Back</button>
            <h1 className="text-lg font-bold">Shot Log</h1>
            <button onClick={() => setView("add-shot")} className="flex items-center gap-1 bg-purple-700 hover:bg-purple-600 active:scale-95 transition-transform px-3 py-1.5 rounded-lg text-sm font-medium">
              <Plus size={14} /> Add
            </button>
          </div>

          {sorted.length === 0 && (
            <div className="text-center text-gray-500 mt-20">
              <ClipboardList size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm">No shots logged yet.</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {sorted.map(sh => {
              const peptide = peptides.find(p => p.id === sh.peptideId);
              return (
                <div key={sh.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm">{peptide?.name ?? "Unknown"}</p>
                      <p className="text-xs text-gray-500">{new Date(sh.date).toLocaleDateString()} {sh.time} · {sh.amountMl} mL · {sh.site}</p>
                      {sh.weightLbs && <p className="text-xs text-gray-600">{sh.weightLbs} lbs at time of shot</p>}
                      {sh.notes && <p className="text-xs text-gray-600 mt-0.5">{sh.notes}</p>}
                    </div>
                    <button onClick={() => { if (confirm("Delete this shot?")) handleDeleteShot(sh.id); }} className="text-red-800 active:opacity-60 ml-2 shrink-0"><X size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Metrics handlers ─────────────────────────────────────────────────────
  function handleAddMetric(fields) {
    updateData({ metrics: [{ id: makeId(), ...fields }, ...metrics] });
    setView("metrics");
  }

  function handleDeleteMetric(id) {
    updateData({ metrics: metrics.filter(m => m.id !== id) });
  }

  if (view === "add-metric") {
    return <MetricForm onSave={handleAddMetric} onCancel={() => setView("metrics")} />;
  }

  // ── Metrics List ─────────────────────────────────────────────────────────
  if (view === "metrics") {
    const sorted = metrics.slice().sort((a, b) => b.date.localeCompare(a.date));
    const latest = sorted[0];
    return (
      <div className="min-h-screen bg-gray-950 text-white px-4 pb-10 pt-6">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setView("hub")} className="text-gray-400 text-sm active:opacity-60 flex items-center gap-1"><ArrowLeft size={16} /> Back</button>
            <h1 className="text-lg font-bold">Metrics</h1>
            <button onClick={() => setView("add-metric")} className="flex items-center gap-1 bg-orange-700 hover:bg-orange-600 active:scale-95 transition-transform px-3 py-1.5 rounded-lg text-sm font-medium">
              <Plus size={14} /> Add
            </button>
          </div>

          {latest && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              {latest.weightLbs && (
                <div className="bg-orange-950 border border-orange-900 rounded-xl px-3 py-3 text-center">
                  <p className="text-xs text-orange-400 mb-0.5">Current Weight</p>
                  <p className="text-xl font-bold">{latest.weightLbs} <span className="text-sm font-normal text-gray-400">lbs</span></p>
                </div>
              )}
              {latest.bodyFatPct && (
                <div className="bg-orange-950 border border-orange-900 rounded-xl px-3 py-3 text-center">
                  <p className="text-xs text-orange-400 mb-0.5">Body Fat</p>
                  <p className="text-xl font-bold">{latest.bodyFatPct}<span className="text-sm font-normal text-gray-400">%</span></p>
                </div>
              )}
            </div>
          )}

          {sorted.length === 0 && (
            <div className="text-center text-gray-500 mt-20">
              <BarChart2 size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm">No metrics logged yet.</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {sorted.map(m => (
              <div key={m.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{new Date(m.date).toLocaleDateString()}</p>
                    <div className="flex gap-4">
                      {m.weightLbs && <p className="text-sm font-semibold">{m.weightLbs} lbs</p>}
                      {m.bodyFatPct && <p className="text-sm font-semibold">{m.bodyFatPct}% BF</p>}
                    </div>
                    {m.notes && <p className="text-xs text-gray-600 mt-0.5">{m.notes}</p>}
                  </div>
                  <button onClick={() => { if (confirm("Delete this entry?")) handleDeleteMetric(m.id); }} className="text-red-800 active:opacity-60 ml-2 shrink-0"><X size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
