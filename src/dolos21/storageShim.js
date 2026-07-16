/**
 * window.storage shim
 * ---------------------------------------------------------------
 * App.jsx was built inside a Claude.ai artifact, where `window.storage`
 * is a host-provided persistence API (get/set/delete, with a `shared`
 * flag for data visible across users). That API does not exist outside
 * Claude's artifact runtime — this file replaces it with a localStorage-
 * backed equivalent so the app keeps working unmodified.
 *
 * IMPORTANT LIMITATION: real cross-device multiplayer needs a real
 * shared backend (a small websocket/Firebase/Supabase relay, etc).
 * This shim's `shared: true` calls just write to this browser's
 * localStorage, so multiplayer lobbies will only work if both "players"
 * are two tabs in the *same* browser on the *same* device — useful for
 * local testing, not for two people on different machines. Swap the
 * `sharedGet`/`sharedSet`/`sharedDelete` functions below for real network
 * calls when you're ready to wire up actual multiplayer.
 *
 * Personal data (settings, codex, New Game+ unlock, prologue-seen,
 * endless best score) works exactly as before — it's genuinely permanent
 * per-browser storage, same as it was in the Claude artifact.
 */

const PERSONAL_PREFIX = "dolos21:personal:";
const SHARED_PREFIX = "dolos21:shared:";

function personalGet(key) {
  const raw = localStorage.getItem(PERSONAL_PREFIX + key);
  return raw === null ? null : { key, value: raw, shared: false };
}
function personalSet(key, value) {
  localStorage.setItem(PERSONAL_PREFIX + key, value);
  return { key, value, shared: false };
}
function personalDelete(key) {
  const existed = localStorage.getItem(PERSONAL_PREFIX + key) !== null;
  localStorage.removeItem(PERSONAL_PREFIX + key);
  return { key, deleted: existed, shared: false };
}

// Replace these three with real network calls for genuine cross-device sync.
function sharedGet(key) {
  const raw = localStorage.getItem(SHARED_PREFIX + key);
  return raw === null ? null : { key, value: raw, shared: true };
}
function sharedSet(key, value) {
  localStorage.setItem(SHARED_PREFIX + key, value);
  return { key, value, shared: true };
}
function sharedDelete(key) {
  const existed = localStorage.getItem(SHARED_PREFIX + key) !== null;
  localStorage.removeItem(SHARED_PREFIX + key);
  return { key, deleted: existed, shared: true };
}

export function installStorageShim() {
  if (typeof window === "undefined") return;
  window.storage = {
    async get(key, shared) {
      return shared ? sharedGet(key) : personalGet(key);
    },
    async set(key, value, shared) {
      return shared ? sharedSet(key, value) : personalSet(key, value);
    },
    async delete(key, shared) {
      return shared ? sharedDelete(key) : personalDelete(key);
    },
    async list(prefix, shared) {
      const p = (shared ? SHARED_PREFIX : PERSONAL_PREFIX) + (prefix || "");
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(p)) keys.push(k.slice((shared ? SHARED_PREFIX : PERSONAL_PREFIX).length));
      }
      return { keys, prefix, shared: !!shared };
    },
  };
}
