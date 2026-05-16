import { useRegisterSW } from "virtual:pwa-register/react";
import { useEffect } from "react";

export default function UpdateBanner() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_, registration) {
      // Re-check for updates every time the page regains focus (critical for iOS)
      const check = () => registration?.update();
      window.addEventListener("focus", check);
      window.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") check();
      });
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-blue-600 text-white text-sm font-semibold shadow-xl">
      <span>Update available</span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="bg-white text-blue-700 px-3 py-1 rounded-full text-xs font-bold active:opacity-70"
      >
        Reload
      </button>
    </div>
  );
}
