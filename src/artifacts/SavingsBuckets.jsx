import { useState, useEffect } from "react";
import { Plus, ChevronRight, X, Edit2, Wallet, ArrowLeft, Minus, RefreshCw } from "lucide-react";

const STORAGE_KEY = "savings-v1";

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { buckets: [] };
  } catch {
    return { buckets: [] };
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function makeId() {
  return crypto.randomUUID();
}

function fmtMoney(n) {
  return n < 0
    ? `-$${Math.abs(n).toFixed(2)}`
    : `$${n.toFixed(2)}`;
}

function fmtDate(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString();
}

export default function SavingsBuckets() {
  const [data, setData] = useState(loadData);
  const [view, setView] = useState("hub");
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => { saveData(data); }, [data]);

  const { buckets } = data;

  function updateData(patch) {
    setData(prev => ({ ...prev, ...patch }));
  }

  // ── Hub (bucket list) ─────────────────────────────────────────────────────
  if (view === "hub") {
    return (
      <div className="min-h-screen bg-gray-950 text-white px-4 pb-10 pt-6">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold">Savings</h1>
            <button
              onClick={() => setView("add-bucket")}
              className="flex items-center gap-1 bg-yellow-700 hover:bg-yellow-600 active:scale-95 transition-transform px-3 py-1.5 rounded-lg text-sm font-medium"
            >
              <Plus size={14} /> New Bucket
            </button>
          </div>

          {buckets.length === 0 && (
            <div className="text-center text-gray-500 mt-24">
              <Wallet size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm">No buckets yet. Tap "New Bucket" to get started.</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {buckets.map(b => {
              const last = b.transactions[b.transactions.length - 1];
              return (
                <button
                  key={b.id}
                  onClick={() => { setSelectedId(b.id); setView("detail"); }}
                  className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-4 text-left w-full active:scale-95 transition-transform"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-base">{b.name}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${b.balance < 0 ? "text-red-400" : "text-green-400"}`}>
                        {fmtMoney(b.balance)}
                      </span>
                      <ChevronRight size={16} className="text-gray-600" />
                    </div>
                  </div>
                  {last && (
                    <p className="text-xs text-gray-500 mt-1">
                      Last: {last.description} · {fmtDate(last.date)}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
