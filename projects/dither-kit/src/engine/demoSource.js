// Built-in test image so the app renders something before a file is loaded.
export const demoSource = () => {
  const w = 960;
  const h = 640;
  const c = new OffscreenCanvas(w, h);
  const ctx = c.getContext("2d");
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#1b1446");
  sky.addColorStop(0.55, "#e0457b");
  sky.addColorStop(1, "#ffb86b");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  const sun = ctx.createRadialGradient(w / 2, h * 0.58, 10, w / 2, h * 0.58, 190);
  sun.addColorStop(0, "#fff6c4");
  sun.addColorStop(1, "#ff7b5c");
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(w / 2, h * 0.58, 180, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#120c2b";
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 40) ctx.lineTo(x, h * 0.72 - Math.abs(Math.sin(x * 0.011)) * 150);
  ctx.lineTo(w, h);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 72px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("DITHER KIT", w / 2, 110);
  return {
    kind: "image",
    name: "Demo image",
    demo: true,
    width: w,
    height: h,
    duration: 3,
    drawAt: async (dctx, dw, dh) => dctx.drawImage(c, 0, 0, dw, dh),
    dispose: () => {},
  };
};
