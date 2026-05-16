import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRegisterSW } from "virtual:pwa-register/react";

const APPS = [
  {
    path: "/cruise-guide",
    icon: "🚢",
    title: "Cruise Guide",
    bg: "bg-blue-900",
  },
  {
    path: "/lunch-quest",
    icon: "⚔️",
    title: "Lunch Quest",
    bg: "bg-yellow-900",
  },
  {
    path: "/nick-measurement",
    icon: "🦅",
    title: "Nick System",
    bg: "bg-orange-900",
  },
  {
    path: "/brainrot",
    icon: "🧠",
    title: "Brainrot",
    bg: "bg-purple-900",
  },
  {
    path: "/subnet-calc",
    icon: "🌐",
    title: "Subnet Calc",
    bg: "bg-cyan-900",
  },
  {
    path: "/pomodoro",
    icon: "🍅",
    title: "Pomodoro",
    bg: "bg-red-900",
  },
];

export default function Hub() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState(null);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
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
      if (reg) await reg.update();
      setTimeout(() => {
        setChecking(false);
        setStatus("up-to-date");
        setTimeout(() => setStatus(null), 3000);
      }, 1500);
    } catch {
      setChecking(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 pt-12 pb-10">
      <div className="max-w-sm mx-auto">
        <h1 className="text-xl font-bold text-center mb-8">Artifacts</h1>

        <div className="grid grid-cols-3 gap-6 mb-12">
          {APPS.map((app) => (
            <button
              key={app.path}
              onClick={() => navigate(app.path)}
              className="flex flex-col items-center gap-2 active:scale-90 transition-transform"
            >
              <div className={`w-16 h-16 rounded-2xl ${app.bg} flex items-center justify-center text-3xl shadow-lg`}>
                {app.icon}
              </div>
              <span className="text-xs text-gray-300 text-center leading-tight">{app.title}</span>
            </button>
          ))}
        </div>

        <button
          onClick={handleRefresh}
          disabled={checking}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-800 text-gray-600 text-xs active:opacity-60 disabled:opacity-40"
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
