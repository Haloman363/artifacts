import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRegisterSW } from "virtual:pwa-register/react";

const APPS = [
  {
    path: "/cruise-guide",
    icon: "🚢",
    title: "2026 Cruise Guide",
    desc: "Nassau · Princess Cays · Amber Cove · Grand Turk",
    bg: "from-blue-900 to-cyan-900",
    border: "border-blue-700",
  },
  {
    path: "/lunch-quest",
    icon: "⚔️",
    title: "Lunch Quest 3D",
    desc: "Enter restaurants. May the mightiest meal prevail.",
    bg: "from-yellow-900 to-amber-900",
    border: "border-yellow-700",
  },
  {
    path: "/nick-measurement",
    icon: "🦅",
    title: "Nick Measurement System™",
    desc: "Converting units to things Nick can actually understand.",
    bg: "from-yellow-800 to-orange-900",
    border: "border-yellow-600",
  },
];

export default function Hub() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState(null);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
    offlineReady: [offlineReady],
  } = useRegisterSW();

  async function handleRefresh() {
    if (needRefresh) {
      updateServiceWorker(true);
      return;
    }
    setChecking(true);
    setStatus(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.update();
        setTimeout(() => {
          setChecking(false);
          setStatus("up-to-date");
          setTimeout(() => setStatus(null), 3000);
        }, 1500);
      } else {
        setChecking(false);
        setStatus("up-to-date");
        setTimeout(() => setStatus(null), 3000);
      }
    } catch {
      setChecking(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-10">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-center mb-1">Artifacts</h1>
        <p className="text-gray-500 text-sm text-center mb-6">Jaymes's Claude collection</p>

        <div className="flex flex-col gap-4 mb-8">
          {APPS.map((app) => (
            <button
              key={app.path}
              onClick={() => navigate(app.path)}
              className={`w-full text-left p-5 rounded-2xl bg-gradient-to-br ${app.bg} border ${app.border} active:scale-95 transition-transform`}
            >
              <div className="text-4xl mb-2">{app.icon}</div>
              <div className="font-semibold text-lg leading-tight">{app.title}</div>
              <div className="text-sm text-gray-300 mt-1 leading-snug">{app.desc}</div>
            </button>
          ))}
        </div>

        <button
          onClick={handleRefresh}
          disabled={checking}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-800 text-gray-500 text-sm active:opacity-60 disabled:opacity-40"
        >
          {needRefresh ? (
            <span className="text-blue-400 font-semibold">Update available — tap to reload</span>
          ) : checking ? (
            <span>Checking…</span>
          ) : status === "up-to-date" ? (
            <span className="text-green-500">Up to date</span>
          ) : (
            <span>Check for updates</span>
          )}
        </button>
      </div>
    </div>
  );
}
