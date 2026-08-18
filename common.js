/* ── PROCEDURAL CONNECTED LINE-ART WAVE SIMULATION ── */
const canvas = document.getElementById('waveCanvas');
const ctx = canvas.getContext('2d');

let width, height;
function resizeCanvas() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let time = 0;
const waveLayers = [
  { base: 0.15, amp: 45, freq: 0.0018, speed: 0.007, width: 1.4, alpha: 0.5 },
  { base: 0.22, amp: 55, freq: 0.0014, speed: 0.005, width: 1.6, alpha: 0.7 },
  { base: 0.30, amp: 65, freq: 0.0012, speed: 0.009, width: 1.8, alpha: 0.9 },
  { base: 0.38, amp: 50, freq: 0.0016, speed: 0.006, width: 1.3, alpha: 0.6 },
  { base: 0.50, amp: 75, freq: 0.0011, speed: 0.008, width: 2.0, alpha: 1.0 },
  { base: 0.58, amp: 60, freq: 0.0015, speed: 0.005, width: 1.5, alpha: 0.7 },
  { base: 0.68, amp: 70, freq: 0.0013, speed: 0.007, width: 1.7, alpha: 0.85 },
  { base: 0.78, amp: 85, freq: 0.0009, speed: 0.004, width: 2.2, alpha: 0.95 },
  { base: 0.88, amp: 60, freq: 0.0017, speed: 0.008, width: 1.4, alpha: 0.6 }
];

function drawWaves() {
  ctx.clearRect(0, 0, width, height);
  time += 1;

  waveLayers.forEach((layer) => {
    ctx.beginPath();
    ctx.lineWidth = layer.width;
    ctx.strokeStyle = `rgba(24, 24, 27, ${layer.alpha * 0.42})`;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const baseY = height * layer.base;

    for (let x = -50; x <= width + 50; x += 15) {
      const y = baseY +
        Math.sin(x * layer.freq + time * layer.speed) * layer.amp +
        Math.cos(x * (layer.freq * 1.6) - time * (layer.speed * 0.8)) * (layer.amp * 0.45) +
        Math.sin(x * 0.0005 + time * 0.002) * 20;

      if (x === -50) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  });

  requestAnimationFrame(drawWaves);
}
drawWaves();

/* ── TOAST FEEDBACK ENGINE ── */
function showToast(msg) {
  let t = document.getElementById('global-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'global-toast';
    t.className = 'toast-notification';
    document.body.appendChild(t);
  }
  t.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
    <span>${msg}</span>
  `;
  t.classList.add('show');
  setTimeout(() => { t.classList.remove('show'); }, 3200);
}

/* ── LOADING MODAL ── */
function showLoading(msg) {
  const m = document.createElement('div');
  m.id = 'loading-modal';
  m.style.cssText = 'position:fixed;inset:0;background:rgba(24,24,27,0.4);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);';
  m.innerHTML = `<div style="font-family:var(--font-mono);font-size:12px;font-weight:600;background:#FFFFFF;border:1.5px solid #18181B;padding:12px 24px;border-radius:999px;">${msg}</div>`;
  document.body.appendChild(m);
}
function closeLoading() { document.getElementById('loading-modal')?.remove(); }

/* Vercel Analytics */
window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
