import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { CATALOG, CATEGORIES } from "../engine/catalog.js";

const COUNTS = Object.fromEntries(CATEGORIES.map((c) => [c, CATALOG.filter((e) => e.category === c).length]));

export function Library({ onPick, onClose }) {
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return CATALOG.filter(
      (e) =>
        (cat === "All" || e.category === cat) &&
        (!needle || `${e.displayName} ${e.description} ${e.category}`.toLowerCase().includes(needle)),
    );
  }, [cat, q]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal" onClick={onClose} role="dialog" aria-modal="true" aria-label="Add effect">
      <div className="modal-body sheet library" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Add effect</h2>
          <button className="icon close" onClick={onClose} title="Close (Esc)" aria-label="Close"><X size={18} /></button>
        </div>
        <div className="search">
          <Search size={16} />
          <input type="search" placeholder={`Search ${CATALOG.length} effects…`} value={q}
            autoFocus={window.matchMedia("(pointer: fine)").matches}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && items[0] && !items[0].disabled && onPick(items[0])} />
        </div>
        <div className="library-body">
          <nav className="cats">
            {["All", ...CATEGORIES].map((c) => (
              <button key={c} className={c === cat ? "on" : ""} onClick={() => setCat(c)}>
                <span>{c}</span>
                <span className="count">{c === "All" ? CATALOG.length : COUNTS[c]}</span>
              </button>
            ))}
          </nav>
          <ul className="cards">
            {items.map((e) => (
              <li key={e.displayName} className={e.category === "Script Slayer" ? "featured" : ""}>
                <button disabled={e.disabled} onClick={() => onPick(e)} title={e.disabled ? "Needs WebGL2" : e.description}>
                  <span className="card-cat">{e.category}</span>
                  <strong>{e.displayName}</strong>
                  <span className="desc">{e.description}</span>
                </button>
              </li>
            ))}
            {items.length === 0 && <li className="muted">No effects match “{q}”.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
