// ── CAR LIGHT STREAKS ──────────────────────────────
const cRng = rng(91);
const STREAKS = [];
for(let i=0;i<24;i++){
  STREAKS.push({
    phase: cRng(),
    speed: 0.18 + cRng()*0.35,
    lane: cRng()*1.6 - 0.8,    // -0.8..0.8
    dir:  cRng()>0.45 ? 1 : -1, // 1=approaching, -1=receding
    width: 0.7 + cRng()*0.6,
    heightOff: cRng()*4,
  });
}

const VPX = W * 0.5;

function drawRoad(p, t){
  // Ground
  const ground = ctx.createLinearGradient(0, HZ, 0, H);
  const g0 = lerpHex('#3a3036', '#04030a', 1 - p.ambient*0.7);
  const g1 = lerpHex('#15101a', '#000000', 1 - p.ambient*0.4);
  ground.addColorStop(0, g0);
  ground.addColorStop(1, g1);
  ctx.fillStyle = ground;
  ctx.fillRect(0, HZ, W, H-HZ);

  // Road
  ctx.beginPath();
  ctx.moveTo(VPX - 4, HZ);
  ctx.lineTo(VPX + 4, HZ);
  ctx.lineTo(VPX + 460, H + 30);
  ctx.lineTo(VPX - 460, H + 30);
  ctx.closePath();
  ctx.fillStyle = lerpHex('#383038', '#0a0810', 1 - p.ambient*0.5);
  ctx.fill();

  // Wet-look reflection of sky on road
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(VPX - 4, HZ);
  ctx.lineTo(VPX + 4, HZ);
  ctx.lineTo(VPX + 460, H + 30);
  ctx.lineTo(VPX - 460, H + 30);
  ctx.closePath();
  ctx.clip();
  const reflGrad = ctx.createLinearGradient(0, HZ, 0, H);
  // Use bottom sky color as reflection tint
  const reflHex = p.sky[p.sky.length-1][1];
  const refl0 = hex(reflHex);
  reflGrad.addColorStop(0, `rgba(${refl0[0]},${refl0[1]},${refl0[2]},${0.30 + (1-p.ambient)*0.18})`);
  reflGrad.addColorStop(0.55, 'transparent');
  ctx.fillStyle = reflGrad;
  ctx.fillRect(0, HZ, W, H-HZ);
  ctx.restore();

  // Center dashes
  for(let i=0;i<14;i++){
    const ph = ((i/14 + t*0.42) % 1);
    const y1 = HZ + ph*ph * (H - HZ + 30);
    const y2 = y1 + lerp(2, 24, ph);
    const lw = lerp(1, 6, ph);
    ctx.fillStyle = `rgba(245,225,180,${0.10 + p.ambient*0.25})`;
    ctx.fillRect(VPX - lw/2, y1, lw, y2-y1);
  }
}

function drawStreaks(p, t){
  // Car headlight/tail light streaks down the road
  STREAKS.forEach(s=>{
    const ph = (s.phase + t*s.speed) % 1;
    if(s.dir > 0){
      // approaching (heads, white) — moves toward viewer
      const y0 = HZ + 4;
      const y1 = HZ + ph*ph * (H - HZ + 20);
      const x0 = VPX + s.lane * 12;
      const x1 = VPX + s.lane * 460;
      const xMid = lerp(x0, x1, ph);
      const yMid = y1;

      // streak line
      const grd = ctx.createLinearGradient(x0, y0, xMid, yMid);
      const intensity = 0.05 + (1-p.ambient)*0.85;
      grd.addColorStop(0, `rgba(255,250,235,0)`);
      grd.addColorStop(0.4, `rgba(255,250,235,${intensity*0.2})`);
      grd.addColorStop(1, `rgba(255,250,235,${intensity*0.9})`);
      ctx.strokeStyle = grd;
      ctx.lineWidth = lerp(0.6, 3.0, ph) * s.width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo((x0+xMid)/2 - s.lane*8, (y0+yMid)/2, xMid, yMid);
      ctx.stroke();

      // bright point at head
      if(p.ambient < 0.6 && ph > 0.15){
        const r2 = lerp(2, 11, ph) * s.width;
        const hg = ctx.createRadialGradient(xMid, yMid, 0, xMid, yMid, r2*3);
        hg.addColorStop(0, `rgba(255,250,230,${intensity})`);
        hg.addColorStop(1, 'transparent');
        ctx.fillStyle = hg;
        ctx.fillRect(xMid-r2*3, yMid-r2*3, r2*6, r2*6);
      }
    } else {
      // receding (tails, red) — moves away
      const phR = 1 - ph;
      const y0 = HZ + 4;
      const y1 = HZ + phR*phR * (H - HZ + 20);
      const x0 = VPX + s.lane * 12;
      const x1 = VPX + s.lane * 460;
      const xMid = lerp(x0, x1, phR);
      const yMid = y1;

      const grd = ctx.createLinearGradient(xMid, yMid, x0, y0);
      const intensity = 0.05 + (1-p.ambient)*0.75;
      grd.addColorStop(0, `rgba(255,55,30,${intensity*0.95})`);
      grd.addColorStop(0.6, `rgba(255,55,30,${intensity*0.2})`);
      grd.addColorStop(1, 'transparent');
      ctx.strokeStyle = grd;
      ctx.lineWidth = lerp(0.6, 2.6, phR) * s.width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo((x0+xMid)/2 + s.lane*8, (y0+yMid)/2, xMid, yMid);
      ctx.stroke();

      if(p.ambient < 0.6 && phR > 0.15){
        const r2 = lerp(2, 9, phR) * s.width;
        const hg = ctx.createRadialGradient(xMid, yMid, 0, xMid, yMid, r2*3);
        hg.addColorStop(0, `rgba(255,40,20,${intensity*0.95})`);
        hg.addColorStop(1, 'transparent');
        ctx.fillStyle = hg;
        ctx.fillRect(xMid-r2*3, yMid-r2*3, r2*6, r2*6);
      }
    }
  });
}

// ── CLOUDS ────────────────────────────────────────
const CLOUDS = [];
const clRng = rng(44);
for(let i=0;i<7;i++){
  CLOUDS.push({
    x: clRng()*W*1.4 - W*0.2,
    y: H * (0.08 + clRng()*0.32),
    w: 200 + clRng()*400,
    h: 30 + clRng()*60,
    drift: 0.005 + clRng()*0.015,
  });
}

function drawClouds(p, t){
  // Cloud tint shifts with sky color (sample mid sky)
  const skyMid = hex(p.sky[Math.floor(p.sky.length*0.6)][1]);
  // brighten clouds in day, redden in dusk
  const day = p.ambient;
  const r0 = lerp(skyMid[0]+30, 255, day*0.6);
  const g0 = lerp(skyMid[1]+25, 250, day*0.6);
  const b0 = lerp(skyMid[2]+20, 245, day*0.55);
  CLOUDS.forEach(cl=>{
    const x = ((cl.x + t*cl.drift*W) % (W*1.4)) - W*0.2;
    const grd = ctx.createRadialGradient(x, cl.y, 0, x, cl.y, cl.w*0.6);
    const a = 0.04 + day*0.06 + (1-day)*0.03;
    grd.addColorStop(0, `rgba(${r0|0},${g0|0},${b0|0},${a})`);
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.ellipse(x, cl.y, cl.w, cl.h, 0, 0, Math.PI*2);
    ctx.fill();
  });
}

// ── STARS ─────────────────────────────────────────
const STARS = [];
const stRng = rng(99);
for(let i=0;i<260;i++){
  STARS.push({
    x: stRng()*W, y: stRng()*HZ*0.92,
    s: stRng()*1.4+0.4, twinkle: stRng()
  });
}
function drawStars(p, t){
  const night = Math.max(0, 1 - p.ambient*1.3);
  if(night < 0.05) return;
  STARS.forEach(s=>{
    const tw = 0.55 + 0.45 * Math.sin(t*Math.PI*2*1.5 + s.twinkle*9);
    ctx.fillStyle = `rgba(255,255,250,${(night * tw * 0.85).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.s, 0, Math.PI*2);
    ctx.fill();
  });
}

// ── MAIN DRAW ─────────────────────────────────────
function draw(t){
  const p = getPhase(t);

  // SKY GRADIENT
  const sg = ctx.createLinearGradient(0, 0, 0, HZ + 50);
  p.sky.forEach(([s, c]) => sg.addColorStop(s, c));
  ctx.fillStyle = sg;
  ctx.fillRect(0, 0, W, H);

  // STARS
  drawStars(p, t);

  // MOON — only at deep night (faded during transitions)
  const moonA = Math.max(0, (0.18 - p.ambient) / 0.18);
  if(moonA > 0.05){
    const mx = W*0.74, my = H*0.18;
    const mg = ctx.createRadialGradient(mx, my, 0, mx, my, 75);
    mg.addColorStop(0, `rgba(220,225,250,${moonA*0.32})`);
    mg.addColorStop(1, 'transparent');
    ctx.fillStyle = mg;
    ctx.fillRect(mx-90, my-90, 180, 180);
    ctx.fillStyle = `rgba(240,242,255,${moonA*0.92})`;
    ctx.beginPath();
    ctx.arc(mx, my, 20, 0, Math.PI*2);
    ctx.fill();
  }

  // SUN with atmospheric glow + bloom
  if(p.sun.a > 0.02){
    const sx = p.sun.x * W;
    const sy = p.sun.y * H;
    // wide atmosphere glow
    const wide = ctx.createRadialGradient(sx, sy, 0, sx, sy, 600);
    const sunRGB = hex(p.sun.c);
    wide.addColorStop(0, `rgba(${sunRGB[0]},${sunRGB[1]},${sunRGB[2]},${p.sun.a*0.42})`);
    wide.addColorStop(0.25, `rgba(${sunRGB[0]},${sunRGB[1]},${sunRGB[2]},${p.sun.a*0.20})`);
    wide.addColorStop(1, 'transparent');
    ctx.fillStyle = wide;
    ctx.fillRect(0, 0, W, H);

    // mid bloom
    const mid = ctx.createRadialGradient(sx, sy, 0, sx, sy, 200);
    mid.addColorStop(0, `rgba(${sunRGB[0]},${sunRGB[1]},${sunRGB[2]},${p.sun.a*0.7})`);
    mid.addColorStop(1, 'transparent');
    ctx.fillStyle = mid;
    ctx.fillRect(sx-200, sy-200, 400, 400);

    // disc
    ctx.beginPath();
    ctx.arc(sx, sy, p.sun.r * p.sun.a, 0, Math.PI*2);
    const disc = ctx.createRadialGradient(sx-p.sun.r*0.2, sy-p.sun.r*0.2, 0, sx, sy, p.sun.r);
    disc.addColorStop(0, '#ffffff');
    disc.addColorStop(0.5, p.sun.c);
    disc.addColorStop(1, p.sun.c);
    ctx.fillStyle = disc;
    ctx.globalAlpha = p.sun.a;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // CLOUDS
  drawClouds(p, t);

  // FAR SKYLINE — hazy, recedes into fog
  drawSkyline(LAYER_FAR, p.bldCol, p.bldC*0.85, p.winA*0.4, t, 'far');

  // Fog band over far layer for depth
  const fogA = ctx.createLinearGradient(0, HZ - 200, 0, HZ + 40);
  fogA.addColorStop(0, 'transparent');
  fogA.addColorStop(1, p.fog);
  ctx.fillStyle = fogA;
  ctx.fillRect(0, 0, W, H);

  // MID SKYLINE
  drawSkyline(LAYER_MID, p.bldCol, p.bldB, p.winA*0.75, t, 'mid');

  // Haze
  const hazeG = ctx.createLinearGradient(0, HZ - 120, 0, HZ + 30);
  hazeG.addColorStop(0, 'transparent');
  hazeG.addColorStop(1, p.haze);
  ctx.fillStyle = hazeG;
  ctx.fillRect(0, 0, W, H);

  // NEAR SKYLINE
  drawSkyline(LAYER_NEAR, p.bldCol, p.bldA, p.winA, t, 'near');

  // ROAD
  drawRoad(p, t);

  // CAR STREAKS
  drawStreaks(p, t);

  // ATMOSPHERIC TINT WASH (subtle)
  if(p.ambient < 0.5){
    // night wash
    const nf = (0.5 - p.ambient) * 0.5;
    ctx.fillStyle = `rgba(15,20,40,${nf*0.35})`;
    ctx.fillRect(0, 0, W, H);
  }

  // VIGNETTE
  const vig = ctx.createRadialGradient(W/2, H*0.55, H*0.30, W/2, H*0.55, W*0.78);
  vig.addColorStop(0, 'transparent');
  vig.addColorStop(1, 'rgba(0,0,0,0.62)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

}

// ── LOOP ─────────────────────────────────────────
const DURATION = 12000; // 12s cycle
let start = null;
window.__paused = false;
window.__t = null;
function loop(ts){
  if(window.__paused){
    if(window.__t !== null) draw(window.__t);
    requestAnimationFrame(loop);
    return;
  }
  if(!start) start = ts;
  const t = ((ts - start) % DURATION) / DURATION;
  draw(t);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
