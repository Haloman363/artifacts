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

function BucketForm({ initial, onSave, onCancel }) {
  const [name, setName]       = useState(initial?.name ?? "");
  const [balance, setBalance] = useState(initial?.balance?.toString() ?? "");

  function handleSubmit(e) {
    e.preventDefault();
    onSave({ name: name.trim(), balance: parseFloat(balance) || 0 });
  }

  const inputCls = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-600";
  const labelCls = "block text-xs text-gray-400 mb-1";

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center" onClick={onCancel}>
      <div
        className="bg-gray-900 border border-gray-800 rounded-t-2xl w-full max-w-sm px-5 py-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg">{initial ? "Edit Bucket" : "New Bucket"}</h2>
          <button onClick={onCancel}><X size={20} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className={labelCls}>Name</label>
            <input
              className={inputCls}
              placeholder="e.g. Vacation"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelCls}>{initial ? "Current Balance ($)" : "Starting Balance ($)"}</label>
            <input
              className={inputCls}
              type="number"
              step="0.01"
              placeholder="0.00"
              value={balance}
              onChange={e => setBalance(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-yellow-700 hover:bg-yellow-600 active:scale-95 transition-transform rounded-xl py-3 font-semibold text-sm mt-2"
          >
            {initial ? "Save Changes" : "Create Bucket"}
          </button>
        </form>
      </div>
    </div>
  );
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

  // ── Bucket handlers ───────────────────────────────────────────────────────
  function handleAddBucket({ name, balance }) {
    updateData({
      buckets: [
        ...buckets,
        {
          id: makeId(),
          name,
          balance,
          transactions: balance !== 0 ? [{
            id: makeId(),
            type: "set",
            amount: balance,
            description: "Starting balance",
            date: new Date().toISOString().split("T")[0],
          }] : [],
        },
      ],
    });
    setView("hub");
  }

  function handleEditBucket({ name, balance }) {
    updateData({
      buckets: buckets.map(b => {
        if (b.id !== selectedId) return b;
        const prev = b.balance;
        const newTx = balance !== prev ? [{
          id: makeId(),
          type: "set",
          amount: balance,
          description: "Balance updated",
          date: new Date().toISOString().split("T")[0],
        }] : [];
        return { ...b, name, balance, transactions: [...b.transactions, ...newTx] };
      }),
    });
    setView("detail");
  }

  function handleDeleteBucket(id) {
    updateData({ buckets: buckets.filter(b => b.id !== id) });
    setSelectedId(null);
    setView("hub");
  }

  if (view === "add-bucket") {
    return <BucketForm onSave={handleAddBucket} onCancel={() => setView("hub")} />;
  }

  if (view === "edit-bucket") {
    const b = buckets.find(b => b.id === selectedId);
    if (!b) return null;
    return <BucketForm initial={b} onSave={handleEditBucket} onCancel={() => setView("detail")} />;
  }

  // ── Detail view ───────────────────────────────────────────────────────────
  if (view === "detail") {
    const b = buckets.find(b => b.id === selectedId);
    if (!b) return null;

    const sorted = b.transactions.slice().sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

    return (
      <div className="min-h-screen bg-gray-950 text-white px-4 pb-10 pt-6">
        <div className="max-w-sm mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setView("hub")}
              className="text-gray-400 text-sm active:opacity-60 flex items-center gap-1"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button
              onClick={() => setView("edit-bucket")}
              className="text-gray-400 active:opacity-60"
            >
              <Edit2 size={16} />
            </button>
          </div>

          {/* Balance card */}
          <div className="bg-yellow-950 border border-yellow-900 rounded-2xl px-5 py-5 mb-6 text-center">
            <p className="text-xs text-yellow-400 mb-1">{b.name}</p>
            <p className={`text-4xl font-bold ${b.balance < 0 ? "text-red-400" : "text-white"}`}>
              {fmtMoney(b.balance)}
            </p>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setView("add-withdrawal")}
              className="flex items-center justify-center gap-2 bg-red-900 hover:bg-red-800 active:scale-95 transition-transform rounded-xl py-3 text-sm font-semibold"
            >
              <Minus size={16} /> Log Purchase
            </button>
            <button
              onClick={() => setView("set-balance")}
              className="flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-800 active:scale-95 transition-transform rounded-xl py-3 text-sm font-semibold"
            >
              <RefreshCw size={16} /> Set Balance
            </button>
          </div>

          {/* Transaction log */}
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Transaction History</p>

          {sorted.length === 0 && (
            <p className="text-center text-gray-600 text-sm mt-8">No transactions yet.</p>
          )}

          <div className="flex flex-col gap-2">
            {sorted.map(tx => (
              <div key={tx.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tx.description}</p>
                  <p className="text-xs text-gray-500">{fmtDate(tx.date)}</p>
                </div>
                <p className={`text-sm font-semibold ml-3 shrink-0 ${tx.type === "withdrawal" ? "text-red-400" : "text-blue-400"}`}>
                  {tx.type === "withdrawal" ? `-${fmtMoney(tx.amount)}` : fmtMoney(tx.amount)}
                </p>
              </div>
            ))}
          </div>

          {/* Delete bucket */}
          <button
            onClick={() => { if (confirm(`Delete "${b.name}"? This cannot be undone.`)) handleDeleteBucket(b.id); }}
            className="w-full text-xs text-red-800 hover:text-red-600 active:opacity-60 py-3 mt-4"
          >
            Delete this bucket
          </button>
        </div>
      </div>
    );
  }

  return null;
}
