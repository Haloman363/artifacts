import { useState, useEffect, useRef, useCallback } from "react";
import BackButton from "./BackButton.jsx";

/* ── constants ─────────────────────────────────────────────────────────────── */
const CLASSES = [
  { name:"Warrior",    bc:"#c03030", lc:"#7a1a1a", hc:"#bbbbbb", weapon:"sword"  },
  { name:"Mage",       bc:"#2233bb", lc:"#0a1155", hc:"#6677ff", weapon:"staff"  },
  { name:"Ranger",     bc:"#228833", lc:"#0a4418", hc:"#44aa33", weapon:"bow"    },
  { name:"Paladin",    bc:"#ccaa22", lc:"#775500", hc:"#eeeebb", weapon:"sword"  },
  { name:"Necromancer",bc:"#441155", lc:"#220033", hc:"#775577", weapon:"staff"  },
  { name:"Berserker",  bc:"#aa1100", lc:"#550800", hc:"#882200", weapon:"axe"    },
  { name:"Druid",      bc:"#336622", lc:"#1a3311", hc:"#66991a", weapon:"staff"  },
  { name:"Rogue",      bc:"#1a1a33", lc:"#0a0a1a", hc:"#333355", weapon:"dagger" },
];

function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

function makeFighter(name, i, pos) {
  const cfg = CLASSES[i % CLASSES.length];
  const lvl = rnd(50, 99);
  const maxHp = rnd(80, 120) + Math.floor(lvl * 0.5);
  return {
    id: i, name, cfg, level: lvl, maxHp, hp: maxHp,
    acc: rnd(60, 90),
    def: rnd(30, 70) + Math.floor(lvl * 0.2),
    maxHit: rnd(10, 22) + Math.floor(lvl * 0.15),
    xp: 0, alive: true,
    x: pos.x, y: pos.y,
    bobOffset: Math.random() * Math.PI * 2,
    flashTimer: 0,
    deathAngle: 0,
  };
}

function calcHit(att, def) {
  const ch = Math.max(10, att.acc - Math.floor(def.def * 0.3));
  if (Math.random() * 100 > ch) return 0;
  return rnd(1, att.maxHit);
}

function getPositions(n, cx, cy, r) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
  });
}

/* ── draw helpers ──────────────────────────────────────────────────────────── */
function drawCharacter(ctx, f, t) {
  const x = f.x;
  const bob = f.alive ? Math.sin(t * 2 + f.bobOffset) * 3 : 0;
  const y = f.y + bob;
  const angle = f.alive ? 0 : f.deathAngle;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const flash = f.flashTimer > 0;
  const alpha = f.alive ? 1 : 0.45;
  ctx.globalAlpha = alpha;

  // shadow
  if (f.alive) {
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(0, 22, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const bc = flash ? "#ffffff" : f.cfg.bc;
  const lc = flash ? "#ffcccc" : f.cfg.lc;
  const hc = flash ? "#ffffff" : f.cfg.hc;

  // legs
  ctx.fillStyle = lc;
  ctx.fillRect(-10, 8, 8, 14);
  ctx.fillRect(2, 8, 8, 14);

  // body
  ctx.fillStyle = bc;
  ctx.fillRect(-12, -8, 24, 18);

  // arms
  ctx.fillStyle = bc;
  ctx.fillRect(-18, -6, 7, 14);
  ctx.fillRect(11, -6, 7, 14);

  // head
  ctx.fillStyle = "#ffcc99";
  ctx.fillRect(-9, -22, 18, 17);

  // helmet
  ctx.fillStyle = hc;
  ctx.fillRect(-10, -26, 20, 10);

  // eyes
  ctx.fillStyle = "#111";
  ctx.fillRect(-7, -17, 4, 3);
  ctx.fillRect(3, -17, 4, 3);

  // weapon
  ctx.fillStyle = "#aaa";
  if (f.cfg.weapon === "sword") {
    ctx.fillStyle = "#cccccc";
    ctx.fillRect(16, -18, 4, 22);
    ctx.fillStyle = "#886622";
    ctx.fillRect(12, -6, 12, 4);
  } else if (f.cfg.weapon === "axe") {
    ctx.fillStyle = "#885533";
    ctx.fillRect(16, -16, 4, 22);
    ctx.fillStyle = "#aaaaaa";
    ctx.fillRect(14, -20, 12, 10);
  } else if (f.cfg.weapon === "staff") {
    ctx.fillStyle = "#775522";
    ctx.fillRect(17, -24, 4, 30);
    ctx.fillStyle = "#9933ff";
    ctx.beginPath();
    ctx.arc(19, -26, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (f.cfg.weapon === "bow") {
    ctx.strokeStyle = "#885533";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(22, 0, 14, -Math.PI * 0.6, Math.PI * 0.6);
    ctx.stroke();
    ctx.strokeStyle = "#ccaa77";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(22, -8);
    ctx.lineTo(22, 8);
    ctx.stroke();
  } else {
    ctx.fillStyle = "#cccccc";
    ctx.fillRect(16, -14, 3, 16);
    ctx.fillStyle = "#886622";
    ctx.fillRect(12, -6, 10, 3);
  }

  // class label tag
  if (f.alive) {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(-24, -40, 48, 14);
    ctx.fillStyle = "#ffcc00";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.fillText(f.cfg.name.toUpperCase(), 0, -29);
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawHpBar(ctx, f) {
  if (!f.alive) return;
  const bw = 50, bh = 6;
  const bx = f.x - bw / 2;
  const by = f.y - 55;
  const pct = Math.max(0, f.hp / f.maxHp);
  ctx.fillStyle = "#111";
  ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
  const hcol = pct > 0.5 ? "#00cc00" : pct > 0.25 ? "#ffaa00" : "#cc0000";
  ctx.fillStyle = hcol;
  ctx.fillRect(bx, by, bw * pct, bh);
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 1;
  ctx.strokeRect(bx, by, bw, bh);

  ctx.fillStyle = "#fff";
  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  ctx.fillText(f.name.length > 10 ? f.name.slice(0, 10) + "…" : f.name, f.x, by - 3);
}

function drawArena(ctx, w, h) {
  // floor
  const tileSize = 40;
  for (let tx = 0; tx < w; tx += tileSize) {
    for (let ty = 0; ty < h; ty += tileSize) {
      const even = ((Math.floor(tx / tileSize) + Math.floor(ty / tileSize)) % 2 === 0);
      ctx.fillStyle = even ? "#2a2a3a" : "#22222f";
      ctx.fillRect(tx, ty, tileSize, tileSize);
    }
  }
  // vignette
  const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.85);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.7)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

/* ── splat / particle types ────────────────────────────────────────────────── */
function makeSplat(x, y, dmg) {
  return { x, y, dmg, life: 1.0, vy: -60 };
}

function makeParticles(x, y) {
  return Array.from({ length: 12 }, () => ({
    x, y,
    vx: (Math.random() - 0.5) * 120,
    vy: -(Math.random() * 100 + 40),
    life: 1.0,
    color: ["#ff4400","#ff8800","#ffcc00"][rnd(0, 2)],
  }));
}

function makeFirework(cx, cy) {
  return Array.from({ length: 20 }, () => {
    const a = Math.random() * Math.PI * 2;
    const s = rnd(60, 160);
    return {
      x: cx, y: cy,
      vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      life: 1.2,
      color: `hsl(${rnd(0, 360)},100%,60%)`,
    };
  });
}

/* ── main component ────────────────────────────────────────────────────────── */
export default function LunchQuest() {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    fighters: [], splats: [], particles: [], log: [],
    running: false, winner: null, rafId: null, lastT: 0,
  });
  const [screen, setScreen] = useState("input");
  const [inputText, setInputText] = useState("");
  const [log, setLog] = useState([]);
  const [hudFighters, setHudFighters] = useState([]);
  const [winner, setWinner] = useState(null);
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  function addLog(txt, col) {
    const entry = { txt, col: col || "#ccc" };
    stateRef.current.log.push(entry);
    setLog(prev => [...prev, entry]);
  }

  /* ── render loop ─────────────────────────────────────────────────────────── */
  const startLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    function loop(ts) {
      const dt = Math.min((ts - stateRef.current.lastT) / 1000, 0.05);
      stateRef.current.lastT = ts;
      const { fighters, splats, particles } = stateRef.current;
      const w = canvas.width, h = canvas.height;

      ctx.clearRect(0, 0, w, h);
      drawArena(ctx, w, h);

      // update fighters
      fighters.forEach(f => {
        if (f.flashTimer > 0) f.flashTimer -= dt;
        if (!f.alive && f.deathAngle < Math.PI / 2) f.deathAngle = Math.min(Math.PI / 2, f.deathAngle + dt * 3);
      });

      // draw fighters
      fighters.forEach(f => drawHpBar(ctx, f));
      fighters.forEach(f => drawCharacter(ctx, f, ts / 1000));

      // splats
      for (let i = splats.length - 1; i >= 0; i--) {
        const s = splats[i];
        s.life -= dt;
        s.y += s.vy * dt;
        if (s.life <= 0) { splats.splice(i, 1); continue; }
        ctx.globalAlpha = s.life;
        ctx.fillStyle = s.dmg > 0 ? "#cc0000" : "#4444cc";
        ctx.beginPath();
        ctx.arc(s.x, s.y, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 13px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(s.dmg > 0 ? String(s.dmg) : "0", s.x, s.y);
        ctx.globalAlpha = 1;
        ctx.textBaseline = "alphabetic";
      }

      // particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 200 * dt;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
        ctx.globalAlpha = 1;
      }

      stateRef.current.rafId = requestAnimationFrame(loop);
    }

    stateRef.current.rafId = requestAnimationFrame(ts => {
      stateRef.current.lastT = ts;
      stateRef.current.rafId = requestAnimationFrame(loop);
    });
  }, []);

  useEffect(() => {
    return () => { if (stateRef.current.rafId) cancelAnimationFrame(stateRef.current.rafId); };
  }, []);

  /* ── combat ──────────────────────────────────────────────────────────────── */
  function doRound() {
    const S = stateRef.current;
    if (!S.running) return;
    const alive = S.fighters.filter(f => f.alive);
    if (alive.length <= 1) {
      S.running = false;
      const w = alive[0] || null;
      S.winner = w;
      setWinner(w);
      setScreen("winner");
      if (w) {
        addLog(w.name + " wins the Lunch Quest!", "#ffcc00");
        // fireworks
        const canvas = canvasRef.current;
        if (canvas) {
          for (let k = 0; k < 8; k++) {
            setTimeout(() => {
              const fw = makeFirework(rnd(80, canvas.width - 80), rnd(80, canvas.height - 80));
              fw.forEach(p => S.particles.push(p));
            }, k * 300);
          }
        }
      }
      return;
    }

    const att = alive[rnd(0, alive.length - 1)];
    const defs = alive.filter(f => f.id !== att.id);
    const def = defs[rnd(0, defs.length - 1)];
    const dmg = calcHit(att, def);
    const xp = dmg > 0 ? rnd(dmg * 3, dmg * 5) : rnd(1, 5);

    const lc = dmg === 0 ? "#5566dd" : dmg >= att.maxHit * 0.8 ? "#ff9900" : "#cccccc";
    let msg;
    if (dmg === 0) msg = att.name + " misses " + def.name + ".";
    else if (dmg >= att.maxHit * 0.8) msg = "Critical! " + att.name + " smites " + def.name + " for " + dmg + "!";
    else msg = att.name + " hits " + def.name + " for " + dmg + ".";
    addLog(msg, lc);

    setTimeout(() => {
      if (!S.running && alive.length > 1) return;
      def.hp = Math.max(0, def.hp - dmg);
      att.xp += xp;
      def.flashTimer = 0.25;
      S.splats.push(makeSplat(def.x, def.y - 30, dmg));

      if (def.hp <= 0) {
        def.alive = false;
        S.particles.push(...makeParticles(def.x, def.y));
        addLog(def.name + " has been defeated!", "#cc2222");
      }

      setHudFighters(S.fighters.map(f => ({ ...f })));
      setTimeout(doRound, 500);
    }, 500);
  }

  function startGame() {
    const lines = inputText.split("\n").map(s => s.trim()).filter(Boolean);
    if (lines.length < 2) { alert("Enter at least 2 restaurants!"); return; }
    if (lines.length > 8) { alert("Max 8 restaurants!"); return; }

    const S = stateRef.current;
    S.fighters = [];
    S.splats = [];
    S.particles = [];
    S.log = [];
    S.running = true;
    S.winner = null;
    S.pendingNames = lines;

    setLog([]);
    setHudFighters([]);
    setWinner(null);
    setScreen("combat");
  }

  function resetGame() {
    const S = stateRef.current;
    S.running = false;
    S.fighters = [];
    S.splats = [];
    S.particles = [];
    if (S.rafId) { cancelAnimationFrame(S.rafId); S.rafId = null; }
    setScreen("input");
    setLog([]);
    setHudFighters([]);
    setWinner(null);
  }

  /* ── canvas sizing ───────────────────────────────────────────────────────── */
  const containerRef = useRef(null);
  useEffect(() => {
    if (screen !== "combat") return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Size the canvas NOW before anything else
    canvas.width = container.clientWidth || window.innerWidth;
    canvas.height = container.clientHeight || window.innerHeight;

    const S = stateRef.current;
    const names = S.pendingNames || [];
    const w = canvas.width, h = canvas.height;
    const positions = getPositions(names.length, w / 2, h / 2, Math.min(w, h) * 0.3);
    const fighters = names.map((name, i) => makeFighter(name, i, positions[i]));
    S.fighters = fighters;
    setHudFighters(fighters.map(f => ({ ...f })));

    startLoop();
    addLog("The Lunch Quest begins!", "#ffcc00");
    setTimeout(doRound, 900);

    const resize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      const pos = getPositions(S.fighters.length, canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.3);
      S.fighters.forEach((f, i) => { f.x = pos[i].x; f.y = pos[i].y; });
    };
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [screen]);

  const RS = "'Courier New', monospace";

  /* ── render ──────────────────────────────────────────────────────────────── */
  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", fontFamily: RS }}>
      <BackButton />
    <div style={{ flex: 1, background: "#111", overflow: "hidden", position: "relative" }}>

      {/* INPUT */}
      {screen === "input" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.92)" }}>
          <div style={{ background: "#2a1f0e", border: "2px solid #8b6914", borderRadius: 6, padding: 24, width: 340, textAlign: "center" }}>
            <div style={{ color: "#ffcc00", fontSize: 22, fontWeight: "bold", marginBottom: 4 }}>LUNCH QUEST 3D</div>
            <div style={{ color: "#ff9900", fontSize: 12, marginBottom: 16 }}>May the mightiest meal prevail</div>
            <textarea
              value={inputText} onChange={e => setInputText(e.target.value)}
              rows={7} placeholder={"McDonald's\nChipotle\nSubway\nPanda Express"}
              style={{ width: "100%", background: "#0d0802", border: "1px solid #8b6914", color: "#fff", fontFamily: RS, fontSize: 13, borderRadius: 4, padding: 9, resize: "none", outline: "none", boxSizing: "border-box" }}
            />
            <button onClick={startGame} style={{ marginTop: 11, width: "100%", padding: 10, cursor: "pointer", background: "linear-gradient(180deg,#c8860a,#7a4f05)", border: "2px solid #ffcc00", borderRadius: 4, color: "#ffcc00", fontFamily: RS, fontSize: 13, fontWeight: "bold" }}>
              BEGIN THE DUEL
            </button>
          </div>
        </div>
      )}

      {/* COMBAT / WINNER */}
      {(screen === "combat" || screen === "winner") && (
        <div ref={containerRef} style={{ width: "100%", height: "100%", position: "relative" }}>
          <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />

          {/* combat log */}
          <div ref={logRef} style={{ position: "absolute", bottom: 0, left: 0, width: 280, maxHeight: 140, overflowY: "auto", background: "rgba(8,5,2,0.93)", borderTop: "2px solid #8b6914", borderRight: "2px solid #8b6914", padding: 7, fontSize: 11, lineHeight: 1.75 }}>
            {log.map((l, i) => <div key={i} style={{ color: l.col }}>{l.txt}</div>)}
          </div>

          {/* abandon */}
          {screen === "combat" && (
            <button onClick={resetGame} style={{ position: "absolute", top: 8, left: 8, padding: "5px 13px", background: "transparent", border: "1px solid #555", borderRadius: 4, color: "#777", fontFamily: RS, fontSize: 11, cursor: "pointer" }}>
              Abandon Quest
            </button>
          )}

          {/* winner overlay */}
          {screen === "winner" && winner && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)" }}>
              <div style={{ background: "#2a1f0e", border: "3px solid #ffcc00", borderRadius: 8, padding: 24, width: 340, textAlign: "center", boxShadow: "0 0 40px #ffcc0055" }}>
                <div style={{ fontSize: 46 }}>🏆</div>
                <div style={{ color: "#ffcc00", fontSize: 20, fontWeight: "bold", marginTop: 6 }}>🏆 {winner.name} WINS!</div>
                <div style={{ color: "#ff9900", fontSize: 13, marginTop: 4 }}>That's where you're eating lunch today!</div>
                <div style={{ color: "#777", fontSize: 11, marginTop: 6 }}>{winner.cfg.name} · Lvl {winner.level} · {winner.xp} XP · {winner.hp}/{winner.maxHp} HP left</div>
                <button onClick={resetGame} style={{ marginTop: 14, padding: "8px 24px", background: "linear-gradient(180deg,#c8860a,#7a4f05)", border: "2px solid #ffcc00", borderRadius: 4, color: "#ffcc00", fontFamily: RS, fontSize: 13, fontWeight: "bold", cursor: "pointer" }}>
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
    </div>
  );
}
