// ────────────────────────────────────────────────
// Cinematic city timelapse — dawn → midnight
// ────────────────────────────────────────────────
const W = 1920, H = 1080;
const c = document.getElementById('c');
c.width = W; c.height = H;
const ctx = c.getContext('2d');

function resize(){
  c.style.width = '100%';
  c.style.height = '100%';
}
resize(); addEventListener('resize', resize);

// ── HORIZON ──
const HZ = H * 0.66;

// ── TIME PALETTE ─────────────────────────────────
// t = 0..1 (pre-dawn → midnight)
// each phase blends smoothly through getPhase()
const PHASES = [
  // pre-dawn (deep navy)
  { t:0.00,
    sky:[ [0,'#06061a'],[0.55,'#1a1230'],[0.85,'#3a1c38'],[1,'#5a2030'] ],
    sun:{x:1.15,y:0.78, c:'#ff8050', a:0.0, r:60},
    fog:'rgba(40,30,60,0.5)', haze:'rgba(80,40,80,0.25)',
    bldA:0.92, bldB:0.74, bldC:0.55,
    bldCol:'#08060f', winA:0.85, ambient:0.10
  },
  // dawn
  { t:0.10,
    sky:[ [0,'#1a1442'],[0.50,'#a83860'],[0.78,'#ff8050'],[1,'#ffc080'] ],
    sun:{x:0.18,y:0.62, c:'#ffd080', a:0.95, r:64},
    fog:'rgba(255,150,90,0.30)', haze:'rgba(255,180,120,0.22)',
    bldA:0.94, bldB:0.74, bldC:0.50,
    bldCol:'#1a0a1a', winA:0.55, ambient:0.25
  },
  // morning
  { t:0.22,
    sky:[ [0,'#3a78c0'],[0.60,'#9ec8e8'],[0.85,'#ffd8a0'],[1,'#ffc080'] ],
    sun:{x:0.30,y:0.30, c:'#fffae0', a:1.0, r:48},
    fog:'rgba(220,210,200,0.18)', haze:'rgba(255,220,180,0.10)',
    bldA:0.88, bldB:0.62, bldC:0.34,
    bldCol:'#26303e', winA:0.08, ambient:0.78
  },
  // noon
  { t:0.40,
    sky:[ [0,'#1a68b8'],[0.55,'#6aa8d8'],[1,'#bedaee'] ],
    sun:{x:0.50,y:0.10, c:'#ffffff', a:1.0, r:52},
    fog:'rgba(200,215,230,0.12)', haze:'rgba(220,230,240,0.06)',
    bldA:0.86, bldB:0.58, bldC:0.28,
    bldCol:'#2c3848', winA:0.04, ambient:1.0
  },
  // golden hour
  { t:0.62,
    sky:[ [0,'#1c4080'],[0.50,'#c87850'],[0.82,'#ffa860'],[1,'#ffd090'] ],
    sun:{x:0.78,y:0.55, c:'#ffb060', a:0.95, r:78},
    fog:'rgba(255,160,80,0.28)', haze:'rgba(255,180,100,0.22)',
    bldA:0.93, bldB:0.74, bldC:0.50,
    bldCol:'#1c1018', winA:0.30, ambient:0.45
  },
  // dusk
  { t:0.74,
    sky:[ [0,'#0e0830'],[0.45,'#5a1850'],[0.80,'#c83050'],[1,'#ff7040'] ],
    sun:{x:0.92,y:0.74, c:'#ff5030', a:0.6, r:64},
    fog:'rgba(180,40,60,0.32)', haze:'rgba(200,60,80,0.28)',
    bldA:0.95, bldB:0.80, bldC:0.58,
    bldCol:'#0a0612', winA:0.78, ambient:0.20
  },
  // evening
  { t:0.86,
    sky:[ [0,'#04020e'],[0.55,'#120820'],[0.85,'#2a0c30'],[1,'#48142a'] ],
    sun:{x:1.2,y:0.85, c:'#601020', a:0.0, r:60},
    fog:'rgba(60,20,50,0.45)', haze:'rgba(80,30,60,0.30)',
    bldA:0.96, bldB:0.82, bldC:0.62,
    bldCol:'#040208', winA:0.95, ambient:0.10
  },
  // midnight
  { t:1.00,
    sky:[ [0,'#020308'],[0.55,'#06080f'],[0.90,'#0a0a14'],[1,'#10081a'] ],
    sun:{x:1.2,y:0.95, c:'#000', a:0.0, r:60},
    fog:'rgba(30,20,50,0.48)', haze:'rgba(40,20,50,0.32)',
    bldA:0.98, bldB:0.86, bldC:0.65,
    bldCol:'#010104', winA:1.0, ambient:0.04
  },
];

// ── COLOR HELPERS ────────────────────────────────
const hex = s => [parseInt(s.slice(1,3),16),parseInt(s.slice(3,5),16),parseInt(s.slice(5,7),16)];
const toHex = (r,g,b) => '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
const lerp = (a,b,t) => a+(b-a)*t;
function lerpHex(c1,c2,t){
  const a=hex(c1), b=hex(c2);
  return toHex(lerp(a[0],b[0],t), lerp(a[1],b[1],t), lerp(a[2],b[2],t));
}
function lerpStops(s1, s2, t){
  // Both arrays expected same length
  const out = [];
  for(let i=0;i<Math.max(s1.length,s2.length);i++){
    const a=s1[Math.min(i,s1.length-1)], b=s2[Math.min(i,s2.length-1)];
    out.push([ lerp(a[0],b[0],t), lerpHex(a[1],b[1],t) ]);
  }
  return out;
}

function ease(x){ return x*x*(3-2*x); }

function getPhase(t){
  let i=0;
  while(i<PHASES.length-2 && PHASES[i+1].t<=t) i++;
  const a=PHASES[i], b=PHASES[i+1];
  const f = ease((t-a.t)/(b.t-a.t));
  return {
    sky:   lerpStops(a.sky, b.sky, f),
    sun:   {
      x:lerp(a.sun.x,b.sun.x,f), y:lerp(a.sun.y,b.sun.y,f),
      a:lerp(a.sun.a,b.sun.a,f),  r:lerp(a.sun.r,b.sun.r,f),
      c:lerpHex(a.sun.c,b.sun.c,f)
    },
    fog: lerpRgba(a.fog,b.fog,f),
    haze: lerpRgba(a.haze,b.haze,f),
    bldA:lerp(a.bldA,b.bldA,f), bldB:lerp(a.bldB,b.bldB,f), bldC:lerp(a.bldC,b.bldC,f),
    bldCol: lerpHex(a.bldCol,b.bldCol,f),
    winA: lerp(a.winA,b.winA,f),
    ambient: lerp(a.ambient,b.ambient,f),
  };
}

function parseRgba(s){
  const m = s.match(/rgba?\(([^)]+)\)/);
  return m ? m[1].split(',').map((v,i)=>i<3?parseInt(v):parseFloat(v)) : [0,0,0,0];
}
function lerpRgba(s1,s2,t){
  const a=parseRgba(s1), b=parseRgba(s2);
  return `rgba(${Math.round(lerp(a[0],b[0],t))},${Math.round(lerp(a[1],b[1],t))},${Math.round(lerp(a[2],b[2],t))},${lerp(a[3],b[3],t).toFixed(3)})`;
}

// ── SKYLINE GENERATION ────────────────────────────
function rng(seed){
  let s = seed>>>0;
  return ()=>{ s=(s*1664525+1013904223)>>>0; return s/0xffffffff; };
}

function makeSkyline(seed, count, yBase, hMin, hMax, widthRange) {
  const r = rng(seed);
  const blds = [];
  let x = -50;
  while(x < W + 50) {
    const w = widthRange[0] + r()*(widthRange[1]-widthRange[0]);
    const h = hMin + Math.pow(r(),1.4)*(hMax-hMin);
    // window grid
    const cols = Math.max(1, Math.floor(w/lerp(12,24,r())));
    const rows = Math.max(2, Math.floor(h/lerp(14,22,r())));
    // mask of which windows are lit (sparse — bias toward dark)
    const mask = [];
    for(let i=0;i<cols*rows;i++) mask.push(r()*r()); // squared = bias toward dark
    // varied silhouette: antenna, spire, setback, or flat
    const styleR = r();
    const style = styleR < 0.28 ? 'antenna'
                : styleR < 0.48 ? 'spire'
                : styleR < 0.70 ? 'setback'
                : 'flat';
    const detailH = h * (0.08 + r()*0.20);
    const detailW = w * (0.20 + r()*0.40);
    blds.push({ x:x+w/2, w, h, y:yBase-h, cols, rows, mask, style, detailH, detailW, seed:r()*9999|0 });
    x += w * (0.92 + r()*0.18); // tight packing, some overlap
  }
  return blds;
}

// 3 layers — far, mid, near
const LAYER_FAR  = makeSkyline(11, 40, HZ+2,  90, 280, [40,110]);
const LAYER_MID  = makeSkyline(22, 30, HZ+4, 160, 460, [60,170]);
const LAYER_NEAR = makeSkyline(33, 18, HZ+8, 220, 600, [100,260]);

// ── DRAW LAYER ────────────────────────────────────
function drawSkyline(layer, color, alpha, winAlpha, t, layerKey){
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  layer.forEach(b=>{
    ctx.fillRect(b.x - b.w/2, b.y, b.w, b.h+4);
    if(b.style === 'antenna'){
      const aw = Math.max(2, b.w*0.03);
      ctx.fillRect(b.x - aw/2, b.y - b.detailH, aw, b.detailH);
    } else if(b.style === 'spire'){
      ctx.beginPath();
      ctx.moveTo(b.x - b.detailW/2, b.y);
      ctx.lineTo(b.x + b.detailW/2, b.y);
      ctx.lineTo(b.x, b.y - b.detailH*1.5);
      ctx.closePath();
      ctx.fill();
    } else if(b.style === 'setback'){
      const sw = b.detailW, sh = b.detailH;
      ctx.fillRect(b.x - sw/2, b.y - sh, sw, sh);
      const aw = Math.max(1.5, b.w*0.018);
      ctx.fillRect(b.x - aw/2, b.y - sh - sh*0.5, aw, sh*0.5);
    }
  });
  ctx.restore();

  // WINDOWS
  if(winAlpha > 0.02){
    layer.forEach(b=>{
      const cw = b.w / b.cols;
      const rh = b.h / b.rows;
      for(let r2=0;r2<b.rows;r2++){
        for(let cc=0;cc<b.cols;cc++){
          const m = b.mask[r2*b.cols+cc];
          if(m > 0.32){
            // gentle twinkle per-building
            const flick = 0.85 + 0.15 * Math.sin(t*Math.PI*2*1.5 + b.seed + r2*7 + cc*3);
            const a = winAlpha * (0.35 + m*0.65) * flick;
            const wx = b.x - b.w/2 + cc*cw + cw*0.18;
            const wy = b.y + r2*rh + rh*0.18;
            // warm window glow
            ctx.fillStyle = `rgba(255,225,150,${a.toFixed(3)})`;
            ctx.fillRect(wx, wy, cw*0.64, rh*0.64);
          }
        }
      }
    });
  }
}
