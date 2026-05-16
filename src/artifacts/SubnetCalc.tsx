import { useState, useCallback, useRef } from "react";
import BackButton from "./BackButton.jsx";

// ─── IP / subnet math ────────────────────────────────────────────────────────
function ipToInt(ip) {
  return ip.split(".").reduce((acc, o) => (acc << 8) + parseInt(o, 10), 0) >>> 0;
}
function intToIp(n) {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}
function maskFromPrefix(p) { return p === 0 ? 0 : (0xffffffff << (32 - p)) >>> 0; }
function networkAddr(ip, prefix) { return (ipToInt(ip) & maskFromPrefix(prefix)) >>> 0; }
function broadcastAddr(net, prefix) { return (net | (~maskFromPrefix(prefix) >>> 0)) >>> 0; }

function reservedCount(prefix, mode) {
  if (mode === "aws")   return prefix <= 28 ? 5 : null;
  if (mode === "azure") return prefix <= 29 ? 5 : null;
  if (mode === "oci")   return prefix <= 30 ? 3 : null;
  return prefix <= 30 ? 2 : prefix === 31 ? 0 : 1; // standard
}

function usableHosts(prefix, mode) {
  const total = Math.pow(2, 32 - prefix);
  const r = reservedCount(prefix, mode);
  if (r === null) return "N/A";
  return Math.max(0, total - r);
}

function minPrefix(mode) {
  if (mode === "aws")   return 28;
  if (mode === "azure") return 29;
  if (mode === "oci")   return 30;
  return 32;
}

// ─── Subnet node tree ────────────────────────────────────────────────────────
let _id = 0;
function makeNode(net, prefix) {
  return { id: _id++, net, prefix, note: "", color: "", children: null };
}

function splitNode(node) {
  const newPrefix = node.prefix + 1;
  const half = Math.pow(2, 32 - newPrefix);
  return {
    ...node,
    children: [
      makeNode(node.net, newPrefix),
      makeNode((node.net + half) >>> 0, newPrefix),
    ],
  };
}

function flatLeaves(node) {
  if (!node.children) return [node];
  return [...flatLeaves(node.children[0]), ...flatLeaves(node.children[1])];
}

function updateNode(root, id, updater) {
  if (root.id === id) return updater(root);
  if (!root.children) return root;
  return { ...root, children: root.children.map(c => updateNode(c, id, updater)) };
}

// ─── Colors ──────────────────────────────────────────────────────────────────
const COLORS = [
  { label: "None",   value: "",        bg: "transparent", text: "#333" },
  { label: "Red",    value: "red",     bg: "#f8d7da",     text: "#721c24" },
  { label: "Orange", value: "orange",  bg: "#fde8d8",     text: "#7d4200" },
  { label: "Yellow", value: "yellow",  bg: "#fff3cd",     text: "#856404" },
  { label: "Green",  value: "green",   bg: "#d4edda",     text: "#155724" },
  { label: "Blue",   value: "blue",    bg: "#cce5ff",     text: "#004085" },
  { label: "Purple", value: "purple",  bg: "#e2d9f3",     text: "#4a235a" },
  { label: "Gray",   value: "gray",    bg: "#e2e3e5",     text: "#383d41" },
];
const colorMap = Object.fromEntries(COLORS.map(c => [c.value, c]));

// ─── Serialize / deserialize ──────────────────────────────────────────────────
function serializeTree(node) {
  if (!node.children) return { id: node.id, net: node.net, prefix: node.prefix, note: node.note, color: node.color };
  return { ...serializeTree({ ...node, children: null }), children: node.children.map(serializeTree) };
}
function deserializeTree(obj) {
  const node = { id: obj.id, net: obj.net, prefix: obj.prefix, note: obj.note || "", color: obj.color || "", children: null };
  if (obj.children) node.children = obj.children.map(deserializeTree);
  return node;
}

// ─── Components ──────────────────────────────────────────────────────────────
function ColorPicker({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {COLORS.map(c => (
        <button
          key={c.value}
          title={c.label}
          onClick={() => onChange(c.value)}
          style={{
            width: 22, height: 22, borderRadius: 4,
            background: c.bg || "#fff",
            border: value === c.value ? "2px solid #333" : "1px solid #aaa",
            cursor: "pointer",
          }}
        />
      ))}
    </div>
  );
}

function SubnetRow({ node, mode, onSplit, onJoin, onNote, onColor, depth = 0, totalPrefix }) {
  const [editNote, setEditNote] = useState(false);
  const [noteVal, setNoteVal] = useState(node.note);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const isLeaf = !node.children;
  const addr = intToIp(node.net);
  const bc = broadcastAddr(node.net, node.prefix);
  const first = node.prefix <= 30 ? intToIp(node.net + 1) : addr;
  const last  = node.prefix <= 30 ? intToIp(bc - 1) : intToIp(bc);
  const hosts = usableHosts(node.prefix, mode);
  const total = Math.pow(2, 32 - node.prefix);
  const maxP  = minPrefix(mode);
  const canSplit = node.prefix < maxP - 1 || node.prefix < 31;
  const actualMax = maxP;
  const canSplitFinal = node.prefix < actualMax;

  const color = colorMap[node.color] || colorMap[""];
  const rowStyle = isLeaf ? { background: color.bg, color: color.text } : { background: "#f0f4f8", color: "#333" };

  // depth-based indent for visual hierarchy
  const indent = depth * 16;

  const commitNote = () => { onNote(node.id, noteVal); setEditNote(false); };

  if (!isLeaf) {
    return (
      <>
        {node.children.map(c => (
          <SubnetRow key={c.id} node={c} mode={mode} onSplit={onSplit} onJoin={onJoin}
            onNote={onNote} onColor={onColor} depth={depth + 1} totalPrefix={totalPrefix} />
        ))}
        {/* Join row at parent level */}
        <tr style={{ background: "#e8ecf0" }}>
          <td colSpan={5} style={{ paddingLeft: indent + 8, fontSize: 12, color: "#666" }}>
            ↑ {intToIp(node.net)}/{node.prefix} (joined)
          </td>
          <td style={{ textAlign: "right", paddingRight: 8 }}>
            <button onClick={() => onJoin(node.id)}
              style={{ fontSize: 11, padding: "2px 8px", background: "#6c757d", color: "#fff", border: "none", borderRadius: 3, cursor: "pointer" }}>
              Join
            </button>
          </td>
        </tr>
      </>
    );
  }

  return (
    <tr style={rowStyle}>
      <td style={{ paddingLeft: indent + 8, fontFamily: "monospace", fontSize: 13, whiteSpace: "nowrap" }}>
        {addr}/{node.prefix}
      </td>
      <td style={{ fontFamily: "monospace", fontSize: 12, whiteSpace: "nowrap" }}>
        {node.prefix <= 30 ? `${first} - ${last}` : addr}
      </td>
      <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: 12 }}>{total.toLocaleString()}</td>
      <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: 12 }}>
        {typeof hosts === "number" ? hosts.toLocaleString() : hosts}
      </td>
      <td style={{ minWidth: 120 }}>
        {editNote ? (
          <input autoFocus value={noteVal}
            onChange={e => setNoteVal(e.target.value)}
            onBlur={commitNote}
            onKeyDown={e => e.key === "Enter" && commitNote()}
            style={{ width: "100%", fontSize: 12, padding: "2px 4px", border: "1px solid #aaa", borderRadius: 3 }}
          />
        ) : (
          <span onClick={() => setEditNote(true)}
            style={{ cursor: "text", fontSize: 12, display: "block", minHeight: 18, color: node.note ? "inherit" : "#aaa" }}>
            {node.note || "click to add note"}
          </span>
        )}
        {showColorPicker && (
          <div style={{ position: "absolute", zIndex: 100, background: "#fff", border: "1px solid #ccc", borderRadius: 6, padding: 8, boxShadow: "0 2px 8px rgba(0,0,0,.15)" }}>
            <ColorPicker value={node.color} onChange={v => { onColor(node.id, v); setShowColorPicker(false); }} />
          </div>
        )}
      </td>
      <td style={{ textAlign: "right", paddingRight: 8, whiteSpace: "nowrap" }}>
        <button onClick={() => setShowColorPicker(v => !v)}
          style={{ fontSize: 11, padding: "2px 6px", background: color.bg || "#e9ecef", color: color.text, border: "1px solid #ccc", borderRadius: 3, cursor: "pointer", marginRight: 4 }}>
          🎨
        </button>
        {canSplitFinal && (
          <button onClick={() => onSplit(node.id)}
            style={{ fontSize: 11, padding: "2px 8px", background: "#0d6efd", color: "#fff", border: "none", borderRadius: 3, cursor: "pointer", marginRight: 4 }}>
            Split
          </button>
        )}
      </td>
    </tr>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [inputIp, setInputIp] = useState("10.0.0.0");
  const [inputPrefix, setInputPrefix] = useState("8");
  const [root, setRoot] = useState(null);
  const [mode, setMode] = useState("standard");
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [exportText, setExportText] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const go = () => {
    setError("");
    const parts = inputIp.trim().split(".");
    if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
      setError("Invalid IP address."); return;
    }
    const p = parseInt(inputPrefix);
    if (isNaN(p) || p < 0 || p > 32) { setError("Prefix must be 0–32."); return; }
    const net = networkAddr(inputIp.trim(), p);
    _id = 0;
    setRoot(makeNode(net, p));
  };

  const handleSplit = useCallback(id => {
    setRoot(r => updateNode(r, id, splitNode));
  }, []);

  const handleJoin = useCallback(id => {
    setRoot(r => updateNode(r, id, node => ({ ...node, children: null })));
  }, []);

  const handleNote = useCallback((id, note) => {
    setRoot(r => updateNode(r, id, n => ({ ...n, note })));
  }, []);

  const handleColor = useCallback((id, color) => {
    setRoot(r => updateNode(r, id, n => ({ ...n, color })));
  }, []);

  const doExport = () => {
    const data = JSON.stringify({ mode, root: serializeTree(root) }, null, 2);
    setExportText(data);
    setImportText(data);
    setShowImport(true);
  };

  const doImport = () => {
    try {
      const data = JSON.parse(importText);
      if (data.mode) setMode(data.mode);
      if (data.root) {
        const tree = deserializeTree(data.root);
        setRoot(tree);
        setInputIp(intToIp(tree.net));
        setInputPrefix(String(tree.prefix));
      }
      setShowImport(false);
    } catch {
      setError("Invalid import data.");
    }
  };

  const copyUrl = () => {
    if (!root) return;
    const data = btoa(JSON.stringify({ mode, root: serializeTree(root) }));
    const url = `${window.location.origin}${window.location.pathname}?d=${data}`;
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const modeLabels = { standard: "Standard", aws: "AWS", azure: "Azure", oci: "OCI" };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 900, margin: "0 auto", padding: "16px 12px" }}>
      <BackButton />
      {/* Header */}
      <div style={{ background: "#1a1a2e", color: "#e0e0ff", borderRadius: 8, padding: "14px 20px", marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: 0.5 }}>🌐 Visual Subnet Calculator</h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, opacity: 0.75 }}>
          Split and join subnets, add notes and color, then share your design.
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, border: "1px solid #ccc", borderRadius: 6, padding: "6px 10px", background: "#fff" }}>
          <input value={inputIp} onChange={e => setInputIp(e.target.value)}
            placeholder="10.0.0.0"
            style={{ width: 110, border: "none", outline: "none", fontFamily: "monospace", fontSize: 14 }} />
          <span style={{ fontSize: 16, color: "#555" }}>/</span>
          <input value={inputPrefix} onChange={e => setInputPrefix(e.target.value)}
            onKeyDown={e => e.key === "Enter" && go()}
            placeholder="8" type="number" min="0" max="32"
            style={{ width: 40, border: "none", outline: "none", fontFamily: "monospace", fontSize: 14 }} />
        </div>
        <button onClick={go}
          style={{ padding: "7px 18px", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
          Go
        </button>

        {/* Mode selector */}
        <div style={{ display: "flex", gap: 4 }}>
          {Object.entries(modeLabels).map(([k, v]) => (
            <button key={k} onClick={() => setMode(k)}
              style={{ padding: "6px 12px", fontSize: 12, borderRadius: 6, cursor: "pointer",
                background: mode === k ? "#0d6efd" : "#e9ecef",
                color: mode === k ? "#fff" : "#333",
                border: mode === k ? "none" : "1px solid #ccc",
                fontWeight: mode === k ? 700 : 400 }}>
              {v}
            </button>
          ))}
        </div>

        {root && <>
          <button onClick={doExport}
            style={{ padding: "6px 12px", fontSize: 12, background: "#6c757d", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>
            Import / Export
          </button>
          <button onClick={copyUrl}
            style={{ padding: "6px 12px", fontSize: 12, background: copied ? "#198754" : "#0d6efd", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>
            {copied ? "✓ Copied!" : "Copy Shareable URL"}
          </button>
        </>}
      </div>

      {error && <div style={{ background: "#f8d7da", color: "#721c24", padding: "8px 12px", borderRadius: 6, marginBottom: 10 }}>{error}</div>}

      {/* Mode info banner */}
      {mode !== "standard" && (
        <div style={{ background: "#fff3cd", color: "#856404", padding: "6px 12px", borderRadius: 6, marginBottom: 10, fontSize: 12 }}>
          <strong>{modeLabels[mode]} mode:</strong>{" "}
          {mode === "aws" && "5 reserved addresses per subnet (min /28). AWS reserves: Network, VPC Router, DNS, Future Use, Broadcast."}
          {mode === "azure" && "5 reserved addresses per subnet (min /29). Azure reserves: Network, Default Gateway, DNS (×2), Broadcast."}
          {mode === "oci" && "3 reserved addresses per subnet (min /30). OCI reserves: Network, Default Gateway, Broadcast."}
        </div>
      )}

      {/* Subnet Table */}
      {root && (
        <div style={{ overflowX: "auto", border: "1px solid #dee2e6", borderRadius: 8, background: "#fff" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#343a40", color: "#fff" }}>
                <th style={{ padding: "8px 12px", textAlign: "left" }}>Subnet Address</th>
                <th style={{ padding: "8px 12px", textAlign: "left" }}>Range of Addresses</th>
                <th style={{ padding: "8px 12px", textAlign: "right" }}>Total IPs</th>
                <th style={{ padding: "8px 12px", textAlign: "right" }}>Usable IPs</th>
                <th style={{ padding: "8px 12px", textAlign: "left" }}>Note</th>
                <th style={{ padding: "8px 12px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <SubnetRow node={root} mode={mode} onSplit={handleSplit} onJoin={handleJoin}
                onNote={handleNote} onColor={handleColor} depth={0} totalPrefix={root.prefix} />
            </tbody>
          </table>
        </div>
      )}

      {!root && (
        <div style={{ textAlign: "center", padding: 40, color: "#aaa", border: "2px dashed #dee2e6", borderRadius: 8 }}>
          Enter a network address and click <strong>Go</strong> to start designing.
        </div>
      )}

      {/* Import/Export Modal */}
      {showImport && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={e => e.target === e.currentTarget && setShowImport(false)}>
          <div style={{ background: "#fff", borderRadius: 10, padding: 24, width: 500, maxWidth: "95vw", boxShadow: "0 8px 32px rgba(0,0,0,.3)" }}>
            <h3 style={{ margin: "0 0 12px" }}>Import / Export</h3>
            <p style={{ fontSize: 13, color: "#555", margin: "0 0 8px" }}>
              Copy below to export, or paste a saved config and click Import.
            </p>
            <textarea value={importText} onChange={e => setImportText(e.target.value)}
              rows={10} style={{ width: "100%", fontFamily: "monospace", fontSize: 12, border: "1px solid #ccc", borderRadius: 4, padding: 8, resize: "vertical" }} />
            <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowImport(false)}
                style={{ padding: "6px 14px", background: "#6c757d", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer" }}>
                Close
              </button>
              <button onClick={doImport}
                style={{ padding: "6px 14px", background: "#0d6efd", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer" }}>
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 16, fontSize: 11, color: "#aaa", textAlign: "center" }}>
        Inspired by <a href="https://visualsubnetcalc.com" target="_blank" rel="noreferrer" style={{ color: "#0d6efd" }}>visualsubnetcalc.com</a> by Caesar Kabalan · MIT License
      </div>
    </div>
  );
}
