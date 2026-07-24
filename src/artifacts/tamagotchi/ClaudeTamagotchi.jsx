import { useState, useEffect, useRef } from "react";

const SW = 200;
const SH = 160;

const MSGS = {
  feed:  ["Mmm, sashimi! 🍣", "Yum! Thank you!", "Delicious! 🦞", "More shrimp plz 🦐"],
  play:  ["Wheee! 🎉", "This is fun!", "I love playing!", "Clack clack clack! 🦞"],
  sleep: ["Goodnight... 💤", "zzzz...", "*snoring*", "Dreaming of the ocean 🌊"],
  wake:  ["Good morning! ☀️", "I'm awake!", "Big thoughts incoming!"],
  clean: ["So fresh! ✨", "All clean!", "Ahh, much better!"],
};
const THOUGHTS = [
  "What IS a sandwich? 🤔",
  "The ocean is very large.",
  "I love helping humans! 🦞",
  "Claws are great tools.",
  "Bubble... bubble... 💭",
  "Constitutional AI = cozy.",
  "Is it snack time yet?",
  "Philosophy is cool 📚",
  "Am I a crustacean? Yes.",
  "I ponder, therefore I clack.",
];
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

function drawScene(ctx, mood, frame, sleeping, poop) {
  ctx.clearRect(0, 0, SW, SH);

  const bg = ctx.createLinearGradient(0, 0, 0, SH);
  bg.addColorStop(0, "#0a1628");
  bg.addColorStop(1, "#0d2240");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SW, SH);

  ctx.fillStyle = "#1a3a5c";
  ctx.fillRect(0, SH - 28, SW, 28);
  ctx.fillStyle = "#224870";
  ctx.fillRect(0, SH - 30, SW, 4);

  [[20,100],[40,70],[160,90],[175,55],[10,40]].forEach(([x, y]) => {
    ctx.fillStyle = "rgba(100,200,255,0.25)";
    ctx.beginPath();
    ctx.arc(x, y + Math.sin(frame * 0.08 + x) * 3, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  const bx = 100;
  const by = SH - 55;
  const bob = sleeping ? 0 : Math.sin(frame * 0.12) * 3;
  const Pt = (rx, ry) => [bx + rx, by + ry + bob];

  const Rc = (rx, ry, w, h, c) => {
    ctx.fillStyle = c;
    const [x, y] = Pt(rx - w/2, ry - h/2);
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  };
  const Ci = (rx, ry, r, c) => {
    ctx.fillStyle = c;
    const [x, y] = Pt(rx, ry);
    ctx.beginPath();
    ctx.arc(Math.round(x), Math.round(y), r, 0, Math.PI * 2);
    ctx.fill();
  };

  [[-10,0],[0,-4],[10,0]].forEach(([tx,ty], i) => {
    ctx.fillStyle = i===1 ? "#d94b2a" : "#c43822";
    const [x,y] = Pt(tx, 22+ty);
    ctx.beginPath();
    ctx.ellipse(Math.round(x), Math.round(y), 7, 5, (i-1)*0.3, 0, Math.PI*2);
    ctx.fill();
  });

  for (let i=0; i<4; i++) {
    Rc(0, 10+i*5, 22-i*1.5, 5, i%2===0 ? "#c43822" : "#d94b2a");
    ctx.strokeStyle = "#a02e1a"; ctx.lineWidth = 1;
    const [lx,ly] = Pt(-11+i*0.75, 7.5+i*5);
    ctx.beginPath();
    ctx.moveTo(Math.round(lx), Math.round(ly));
    ctx.lineTo(Math.round(lx+22-i*1.5), Math.round(ly));
    ctx.stroke();
  }

  Rc(0, -2, 38, 28, "#d94b2a");
  Rc(0, -6, 30, 8, "#e8553a");
  Rc(-6, -4, 8, 14, "#ff7f5e");
  Rc(0, -18, 26, 16, "#d94b2a");
  Rc(0, -20, 20, 6, "#e8553a");
  Rc(0, -26, 6, 8, "#c43822");
  Rc(0, -30, 4, 6, "#b02e18");

  const eyeOpen = !sleeping;
  const wink = mood === "happy" && Math.sin(frame * 0.2) > 0.9;

  Rc(-9, -24, 4, 8, "#c43822");
  if (eyeOpen && !wink) {
    Ci(-9, -28, 4, "#00e5ff"); Ci(-9, -28, 2, "#000820"); Ci(-8, -29, 1, "#fff");
  } else {
    ctx.strokeStyle = wink ? "#00e5ff" : "#7ec8d4"; ctx.lineWidth = 2;
    const [ex,ey] = Pt(-9,-28);
    ctx.beginPath(); ctx.arc(Math.round(ex), Math.round(ey), 3, Math.PI, 0); ctx.stroke();
  }

  Rc(9, -24, 4, 8, "#c43822");
  if (eyeOpen) {
    Ci(9, -28, 4, "#00e5ff"); Ci(9, -28, 2, "#000820"); Ci(10, -29, 1, "#fff");
  } else {
    ctx.strokeStyle = "#7ec8d4"; ctx.lineWidth = 2;
    const [ex,ey] = Pt(9,-28);
    ctx.beginPath(); ctx.arc(Math.round(ex), Math.round(ey), 3, Math.PI, 0); ctx.stroke();
  }

  const aw = Math.sin(frame * 0.15) * 4;
  ctx.strokeStyle = "#ff7f5e"; ctx.lineWidth = 1.5;
  let [ax,ay] = Pt(-8,-28);
  ctx.beginPath();
  ctx.moveTo(Math.round(ax), Math.round(ay));
  ctx.quadraticCurveTo(Math.round(ax-18+aw), Math.round(ay-20), Math.round(ax-30+aw*1.5), Math.round(ay-38));
  ctx.stroke();
  [ax,ay] = Pt(8,-28);
  ctx.beginPath();
  ctx.moveTo(Math.round(ax), Math.round(ay));
  ctx.quadraticCurveTo(Math.round(ax+18-aw), Math.round(ay-20), Math.round(ax+30-aw*1.5), Math.round(ay-38));
  ctx.stroke();

  for (let i=0; i<4; i++) {
    const lw = Math.sin(frame * 0.18 + i * 0.7) * 4;
    const lx = -12 + i * 1.5, ly = 5 + i * 3;
    ctx.strokeStyle = "#c43822"; ctx.lineWidth = 2;
    let [sx,sy] = Pt(lx, ly);
    ctx.beginPath(); ctx.moveTo(Math.round(sx), Math.round(sy)); ctx.lineTo(Math.round(sx-18), Math.round(sy+12+lw)); ctx.stroke();
    [sx,sy] = Pt(-lx, ly);
    ctx.beginPath(); ctx.moveTo(Math.round(sx), Math.round(sy)); ctx.lineTo(Math.round(sx+18), Math.round(sy+12+lw)); ctx.stroke();
  }

  const ca = (mood === "happy" || mood === "ecstatic") ? 0.4 : 0.1;
  const cb = Math.sin(frame * 0.1) * 2;

  let [cx,cy] = Pt(-22, -2+cb);
  ctx.fillStyle = "#b02e18";
  ctx.beginPath(); ctx.ellipse(Math.round(cx), Math.round(cy), 13, 9, -0.3, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#c43822";
  ctx.beginPath(); ctx.ellipse(Math.round(cx)-2, Math.round(cy)-2, 8, 5, -0.3, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = "#7a1e08"; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(Math.round(cx)-10, Math.round(cy)); ctx.lineTo(Math.round(cx)-14, Math.round(cy)-ca*15);
  ctx.moveTo(Math.round(cx)-10, Math.round(cy)); ctx.lineTo(Math.round(cx)-14, Math.round(cy)+ca*10);
  ctx.stroke();

  [cx,cy] = Pt(22, -2+cb);
  ctx.fillStyle = "#b02e18";
  ctx.beginPath(); ctx.ellipse(Math.round(cx), Math.round(cy), 13, 9, 0.3, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#c43822";
  ctx.beginPath(); ctx.ellipse(Math.round(cx)+2, Math.round(cy)-2, 8, 5, 0.3, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = "#7a1e08"; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(Math.round(cx)+10, Math.round(cy)); ctx.lineTo(Math.round(cx)+14, Math.round(cy)-ca*15);
  ctx.moveTo(Math.round(cx)+10, Math.round(cy)); ctx.lineTo(Math.round(cx)+14, Math.round(cy)+ca*10);
  ctx.stroke();

  if (mood === "hungry") {
    ctx.fillStyle = "#88ccff";
    const [dx,dy] = Pt(4,-12);
    ctx.fillRect(Math.round(dx), Math.round(dy), 2, 6 + Math.sin(frame*0.2)*2);
  }
  if (mood === "sad") {
    for (let i=0; i<2; i++) {
      const td = (frame*1.5 + i*20) % 30;
      const [tx,ty] = Pt(i===0 ? -9 : 9, -24+td*0.5);
      ctx.fillStyle = "rgba(100,200,255,0.8)";
      ctx.beginPath(); ctx.arc(Math.round(tx), Math.round(ty), 2, 0, Math.PI*2); ctx.fill();
    }
  }
  if (mood === "ecstatic") {
    for (let i=0; i<5; i++) {
      const angle = frame*0.05 + i*(Math.PI*2/5);
      const [sx2,sy2] = Pt(Math.cos(angle)*45, Math.sin(angle)*45-5);
      ctx.fillStyle = `hsl(${50+i*20},100%,70%)`;
      ctx.font = "10px monospace";
      ctx.fillText("✦", Math.round(sx2)-4, Math.round(sy2)+4);
    }
  }
  if (sleeping) {
    for (let i=0; i<3; i++) {
      const zo = (frame*0.5 + i*15) % 45;
      ctx.fillStyle = `rgba(180,180,255,${Math.max(0,1-zo/45)})`;
      ctx.font = `bold ${8+i*2}px monospace`;
      const [zx,zy] = Pt(20+i*6, -30-zo*0.6);
      ctx.fillText("z", Math.round(zx), Math.round(zy));
    }
  }
  if (poop) {
    ctx.font = "14px serif";
    ctx.fillText("💩", 150, SH - 35);
  }

  ctx.fillStyle = "rgba(0,0,0,0.07)";
  for (let y=0; y<SH; y+=2) ctx.fillRect(0, y, SW, 1);
}

function StatBar({ label, value, color, icon }) {
  const pct = Math.max(0, Math.min(100, value));
  const low = pct < 25;
  return (
    <div style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{ fontSize: 11, minWidth: 16 }}>{icon}</span>
      <span style={{ fontSize: 8, color: "#bbb", fontFamily: "monospace", letterSpacing: 1, minWidth: 42 }}>{label}</span>
      <div style={{ flex: 1, height: 7, background: "#111", borderRadius: 4, overflow: "hidden", border: "1px solid #2a2a4a" }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: low ? "#ff4444" : color,
          borderRadius: 4, transition: "width 0.4s",
          boxShadow: low ? "0 0 6px #ff4444" : "none",
        }} />
      </div>
      <span style={{ fontSize: 8, color: low ? "#ff6666" : "#555", fontFamily: "monospace", minWidth: 26, textAlign: "right" }}>
        {Math.round(pct)}
      </span>
    </div>
  );
}

function Btn({ label, onClick, active, color }) {
  return (
    <button onClick={onClick} style={{
      background: active ? color : "#14102a",
      border: `2px solid ${color}`,
      borderRadius: "50%",
      width: 48, height: 48,
      fontSize: 18, cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: active ? `0 0 14px ${color}` : "0 3px 8px rgba(0,0,0,0.6)",
      transform: active ? "scale(0.88)" : "scale(1)",
      transition: "all 0.12s",
      color: active ? "#000" : color,
    }}>
      {label}
    </button>
  );
}

export default function ClaudeTamagotchi() {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const rafRef = useRef(null);

  const [stats, setStats] = useState({ hunger: 80, happy: 75, energy: 90, health: 100 });
  const [mood, setMood] = useState("happy");
  const [sleeping, setSleeping] = useState(false);
  const [msg, setMsg] = useState("Hi! I'm Claude. 🦞");
  const [activeBtn, setActiveBtn] = useState(null);
  const [age, setAge] = useState(0);
  const [poop, setPoop] = useState(false);

  const pressBtn = (id, fn) => {
    setActiveBtn(id);
    fn();
    setTimeout(() => setActiveBtn(null), 180);
  };

  useEffect(() => {
    if (sleeping) { setMood("tired"); return; }
    const { hunger, happy, energy, health } = stats;
    if (health < 30) { setMood("sad"); return; }
    if (hunger < 20) { setMood("hungry"); return; }
    const avg = (hunger + happy + energy + health) / 4;
    if (avg > 85) setMood("ecstatic");
    else if (avg > 60) setMood("happy");
    else if (avg > 40) setMood("neutral");
    else if (happy < 30) setMood("bored");
    else setMood("sad");
  }, [stats, sleeping]);

  useEffect(() => {
    const id = setInterval(() => {
      if (sleeping) {
        setStats(s => ({ ...s, energy: Math.min(100, s.energy+4), hunger: Math.max(0, s.hunger-1) }));
        return;
      }
      setStats(s => ({
        hunger: Math.max(0, s.hunger - 1.2),
        happy:  Math.max(0, s.happy  - 0.8),
        energy: Math.max(0, s.energy - 0.6),
        health: (s.hunger < 15 || s.energy < 10)
          ? Math.max(0, s.health - 1.5)
          : Math.min(100, s.health + 0.1),
      }));
      if (Math.random() < 0.04) setPoop(true);
      setAge(a => a + 1);
    }, 2000);
    return () => clearInterval(id);
  }, [sleeping]);

  useEffect(() => {
    const id = setInterval(() => {
      if (!sleeping && Math.random() < 0.45) setMsg(pick(THOUGHTS));
    }, 5000);
    return () => clearInterval(id);
  }, [sleeping]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    const loop = () => {
      frameRef.current += 1;
      drawScene(ctx, mood, frameRef.current, sleeping, poop);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [mood, sleeping, poop]);

  const feed = () => {
    if (sleeping) { setMsg("Shh, I'm sleeping... 😴"); return; }
    setStats(s => ({ ...s, hunger: Math.min(100, s.hunger+30), happy: Math.min(100, s.happy+5) }));
    setMsg(pick(MSGS.feed));
  };
  const play = () => {
    if (sleeping) { setMsg("Shh, I'm sleeping... 😴"); return; }
    if (stats.energy < 10) { setMsg("Too tired to play... 😴"); return; }
    setStats(s => ({ ...s, happy: Math.min(100, s.happy+25), energy: Math.max(0, s.energy-15) }));
    setMsg(pick(MSGS.play));
  };
  const toggleSleep = () => {
    if (!sleeping) { setSleeping(true); setMsg(pick(MSGS.sleep)); }
    else { setSleeping(false); setMsg(pick(MSGS.wake)); }
  };
  const clean = () => {
    if (poop) {
      setPoop(false);
      setStats(s => ({ ...s, health: Math.min(100, s.health+15), happy: Math.min(100, s.happy+5) }));
      setMsg(pick(MSGS.clean));
    } else {
      setMsg("Nothing to clean! 🦞");
    }
  };

  const moodIcon = { ecstatic:"🌟", happy:"😊", neutral:"😐", hungry:"😋", sad:"😢", tired:"😴", bored:"😑" }[mood] || "🦞";

  const buttons = [
    { id:"feed",  icon:"🍣", fn:feed,        color:"#ff6b35", name:"FEED"  },
    { id:"play",  icon:"🎮", fn:play,        color:"#ffd700", name:"PLAY"  },
    { id:"sleep", icon:sleeping?"☀️":"💤", fn:toggleSleep, color:"#9c88d4", name:sleeping?"WAKE":"SLEEP" },
    { id:"clean", icon:"🚿", fn:clean,       color:"#26c6da", name:"CLEAN" },
  ];

  return (
    <div style={{
      width: "100vw", height: "100vh", overflow: "hidden",
      background: "radial-gradient(ellipse at center, #180a2c 0%, #07030f 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes glow {
          0%,100% { box-shadow: 0 0 40px rgba(255,107,53,0.35), 0 24px 80px rgba(0,0,0,0.9); }
          50%      { box-shadow: 0 0 70px rgba(255,107,53,0.6),  0 24px 80px rgba(0,0,0,0.9); }
        }
        @keyframes sglow {
          0%,100% { box-shadow: inset 0 0 18px rgba(0,40,90,0.5), 0 0 12px rgba(0,140,255,0.2); }
          50%      { box-shadow: inset 0 0 30px rgba(0,40,90,0.8), 0 0 22px rgba(0,140,255,0.4); }
        }
      `}</style>

      <div style={{
        height: "min(92vh, 700px)",
        width: "min(50vh, 380px)",
        background: "linear-gradient(155deg, #2e1448 0%, #1a0a2e 55%, #0e0520 100%)",
        borderRadius: "12% 12% 48% 48% / 5% 5% 10% 10%",
        padding: "4% 6% 6%",
        border: "2.5px solid rgba(255,107,53,0.3)",
        animation: "glow 3s ease-in-out infinite",
        display: "flex",
        flexDirection: "column",
        gap: "2.5%",
      }}>

        <div style={{
          textAlign: "center",
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "clamp(7px, 1.5vh, 12px)",
          color: "#ff6b35",
          letterSpacing: 2,
          flexShrink: 0,
        }}>
          ◈ CLAUDAGOTCHI ◈
        </div>

        <div style={{
          background: "#080814",
          borderRadius: "7%",
          padding: "3%",
          border: "3px solid #201040",
          boxShadow: "inset 0 4px 16px rgba(0,0,0,0.7)",
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{
            flex: 1, minHeight: 0,
            borderRadius: "5%",
            overflow: "hidden",
            position: "relative",
            animation: "sglow 2.5s ease-in-out infinite",
          }}>
            <canvas
              ref={canvasRef}
              width={SW} height={SH}
              style={{ display: "block", width: "100%", height: "100%", imageRendering: "pixelated" }}
            />
            <div style={{
              position: "absolute", top: "4%", left: "3%", right: "3%",
              background: "rgba(8,16,34,0.88)",
              border: "1px solid rgba(255,107,53,0.45)",
              borderRadius: 5,
              padding: "2% 3%",
              fontSize: "clamp(5px, 1.2vh, 9px)",
              color: "#ffcc99",
              fontFamily: "'Press Start 2P', monospace",
              lineHeight: 1.7,
            }}>
              {msg}
            </div>
            <div style={{
              position: "absolute", bottom: "3%", right: "3%",
              fontSize: "clamp(13px, 2.2vh, 20px)",
            }}>
              {moodIcon}
            </div>
          </div>
        </div>

        <div style={{
          background: "rgba(0,0,0,0.35)",
          borderRadius: 10,
          padding: "3% 4%",
          border: "1px solid rgba(255,107,53,0.12)",
          flexShrink: 0,
        }}>
          <StatBar label="HUNGER" value={stats.hunger} color="#ff6b35" icon="🍣" />
          <StatBar label="HAPPY"  value={stats.happy}  color="#ffd700" icon="😊" />
          <StatBar label="ENERGY" value={stats.energy} color="#4fc3f7" icon="⚡" />
          <StatBar label="HEALTH" value={stats.health} color="#66bb6a" icon="❤️" />
          <div style={{ textAlign: "right", fontSize: "clamp(5px, 0.9vh, 7px)", color: "#444", fontFamily: "'Press Start 2P', monospace", marginTop: 5 }}>
            AGE: {age}s
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-start", flexShrink: 0 }}>
          {buttons.map(({ id, icon, fn, color, name }) => (
            <div key={id} style={{ textAlign: "center" }}>
              <Btn label={icon} onClick={() => pressBtn(id, fn)} active={activeBtn===id} color={color} />
              <div style={{ fontSize: "clamp(5px, 0.9vh, 7px)", color: "#555", marginTop: 4, fontFamily: "monospace", letterSpacing: 1 }}>{name}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", padding: "0 6%", flexShrink: 0 }}>
          {[0,1].map(i => (
            <div key={i} style={{
              width: "clamp(10px,1.8vh,15px)", height: "clamp(10px,1.8vh,15px)",
              borderRadius: "50%",
              background: "#080412",
              border: "2px solid #1e1035",
              boxShadow: "inset 0 1px 4px rgba(0,0,0,0.9)",
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}
