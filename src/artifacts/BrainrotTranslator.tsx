import { useState } from "react";
import BackButton from "./BackButton.jsx";

const PROMPTS = {
  genz: "You are a Gen Z brainrot translator. Rewrite the message in pure Gen Z internet slang chaos. Use terms like: no cap, fr fr, bussin, lowkey, slay, periodt, rizz, based, mid, rent free, ate and left no crumbs, main character, sending me, W, L, NPC, delulu, situationship, era. Make it unhinged but still vaguely convey the original meaning. Output only the translated message.",
  italian: "You are an Italian brainrot translator. Rewrite using absurd Italian brainrot characters: Bombardino Crocodilo, Tralalero Tralala, Cappuccino Assassino, Bombombini Gusini, Lirili Larila, Glorbo Frutella, Brr Brr Patapim, Tung Tung Tung Sahur. Invent more in this style. Mix in dramatic Italian phrases. Completely unhinged while vaguely conveying the original meaning. Output only the translated message.",
  mix: "You are the ultimate brainrot translator. Rewrite combining Gen Z slang, Italian brainrot characters like Bombardino Crocodilo and Tralalero Tralala, surreal absurdist humor, memes, and unhinged corporate speak. Maximum chaos, still vaguely conveys the meaning. Output only the translated message.",
  corporate: "You are an unhinged corporate speak translator. Rewrite as absurd over-the-top business jargon: synergize, paradigm shift, move the needle, circle back, deep dive, low-hanging fruit, boil the ocean, leverage core competencies, disruptive innovation, bandwidth, ecosystem, value proposition. Remix them in surreal ways that sound extremely important but make no sense. Output only the translated message."
};

const ICONS = { genz:"💀", italian:"🐊", mix:"🌀", corporate:"📊" };
const NAMES = { genz:"Gen Z", italian:"Italian brainrot", mix:"Mix of everything", corporate:"Unhinged corporate" };

const MODES = [
  { id:"genz",      icon:"💀", name:"Gen Z",             sub:"no cap fr fr bussin" },
  { id:"italian",   icon:"🐊", name:"Italian brainrot",  sub:"Bombardino & friends" },
  { id:"mix",       icon:"🌀", name:"Mix of everything", sub:"pure unfiltered chaos" },
  { id:"corporate", icon:"📊", name:"Unhinged corporate",sub:"synergize the paradigm" },
];

const D = {
  bg:       "#0f0f10",
  surface:  "#1a1a1d",
  border:   "rgba(255,255,255,0.08)",
  borderOn: "rgba(127,119,221,0.35)",
  bgOn:     "rgba(127,119,221,0.12)",
  text:     "#f0f0f0",
  muted:    "#666",
  faint:    "#444",
  accent:   "#9088e8",
  purple:   "#7F77DD",
};

export default function App() {
  const [input, setInput]   = useState("");
  const [mode, setMode]     = useState("mix");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  function translate() {
    if (!input.trim() || loading) return;
    setLoading(true);
    setOutput("");
    window.claude.complete(input, { system: PROMPTS[mode] })
      .then(function(result) {
        setOutput(result || "brainrot engine stalled bestie");
        setLoading(false);
      })
      .catch(function() {
        setOutput("the vibe check failed. try again fr fr.");
        setLoading(false);
      });
  }

  function copy() {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(function() { setCopied(false); }, 2000);
  }

  var s = {
    wrap: {
      background: D.bg,
      borderRadius: 16,
      padding: "28px 24px",
      fontFamily: "system-ui, sans-serif",
      color: D.text,
      border: "0.5px solid " + D.border,
    },
    titleRow: { display:"flex", alignItems:"baseline", gap:10, marginBottom:4 },
    h1: { fontSize:22, fontWeight:500, color:D.text, margin:0 },
    sub: { fontSize:13, color:D.muted },
    divider: { height:1, background:D.border, margin:"14px 0 20px" },
    lbl: { fontSize:11, color:D.muted, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:8 },
    grid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:20 },
    textarea: {
      width:"100%", resize:"vertical", fontSize:14,
      background:D.surface, color:D.text,
      border:"0.5px solid " + D.border,
      borderRadius:10, padding:"12px 14px",
      outline:"none", fontFamily:"inherit", lineHeight:1.6, minHeight:110,
    },
    hint: { fontSize:11, color:D.faint, textAlign:"right", marginTop:5, marginBottom:16 },
    btnPrimary: {
      width:"100%", padding:12, fontSize:14, fontWeight:500,
      borderRadius:10, border:"none", cursor:"pointer",
      background: D.purple, color:"#fff", marginBottom:20,
    },
    btnDisabled: {
      width:"100%", padding:12, fontSize:14, fontWeight:500,
      borderRadius:10, border:"none", cursor:"not-allowed",
      background:"#2a2a2e", color:D.faint, marginBottom:20,
    },
    outbox: {
      background:D.surface, border:"0.5px solid " + D.border,
      borderRadius:10, padding:16,
    },
    outhdr: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 },
    cpbtn: {
      fontSize:12, padding:"4px 12px", borderRadius:6,
      border:"0.5px solid " + D.border,
      background:"transparent", color: copied ? D.accent : D.muted, cursor:"pointer",
    },
    outtext: { fontSize:14, color:D.text, lineHeight:1.75, whiteSpace:"pre-wrap", margin:0 },
  };

  return (
    <div style={s.wrap}>
      <BackButton />
      <div style={s.titleRow}>
        <h1 style={s.h1}>Brainrot Translator</h1>
        <span style={s.sub}>paste your boring business text below</span>
      </div>
      <div style={s.divider} />

      <p style={s.lbl}>Flavor</p>
      <div style={s.grid}>
        {MODES.map(function(m) {
          var active = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={function() { setMode(m.id); }}
              style={{
                textAlign:"left", padding:"12px 14px", borderRadius:10,
                border:"0.5px solid " + (active ? D.borderOn : D.border),
                background: active ? D.bgOn : D.surface,
                cursor:"pointer", outline:"none", color:D.text,
              }}
            >
              <div style={{ fontSize:16, marginBottom:4 }}>{m.icon}</div>
              <div style={{ fontSize:13, fontWeight:500, marginBottom:2, color: active ? D.accent : D.text }}>{m.name}</div>
              <div style={{ fontSize:11, color:D.faint }}>{m.sub}</div>
            </button>
          );
        })}
      </div>

      <p style={s.lbl}>Input</p>
      <textarea
        style={s.textarea}
        value={input}
        onChange={function(e) { setInput(e.target.value); }}
        onKeyDown={function(e) { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) translate(); }}
        placeholder="Hi team, please review the attached report before our sync tomorrow..."
        rows={4}
      />
      <p style={s.hint}>Cmd+Enter to translate</p>

      <button
        style={(!input.trim() || loading) ? s.btnDisabled : s.btnPrimary}
        disabled={!input.trim() || loading}
        onClick={translate}
      >
        {loading ? "🧠 brainrotting..." : "🧠 Translate to " + NAMES[mode]}
      </button>

      {(output || loading) && (
        <div style={s.outbox}>
          <div style={s.outhdr}>
            <span style={s.lbl}>{ICONS[mode]} Output</span>
            {output && <button style={s.cpbtn} onClick={copy}>{copied ? "Copied!" : "Copy"}</button>}
          </div>
          <p style={s.outtext}>
            {loading ? "cooking up the brainrot..." : output}
          </p>
        </div>
      )}
    </div>
  );
}
