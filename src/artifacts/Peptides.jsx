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

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 pt-6 text-center text-gray-500 text-sm">
      Loading...
    </div>
  );
}
