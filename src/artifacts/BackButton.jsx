import { useNavigate } from "react-router-dom";

export default function BackButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/")}
      className="fixed top-14 left-3 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700 text-gray-300 text-xs font-semibold active:opacity-70"
    >
      ← Hub
    </button>
  );
}
