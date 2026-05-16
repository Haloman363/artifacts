import { useNavigate } from "react-router-dom";

export default function BackButton() {
  const navigate = useNavigate();
  return (
    <div className="w-full bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-1.5 text-gray-400 text-sm font-medium active:opacity-60"
      >
        <span className="text-base leading-none">‹</span>
        <span>Hub</span>
      </button>
    </div>
  );
}
