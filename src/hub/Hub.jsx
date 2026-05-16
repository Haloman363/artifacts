import { useNavigate } from "react-router-dom";

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

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-10">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-center mb-1">Artifacts</h1>
        <p className="text-gray-500 text-sm text-center mb-8">Jaymes's Claude collection</p>

        <div className="flex flex-col gap-4">
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
      </div>
    </div>
  );
}
