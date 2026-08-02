const WORKER_URL = 'https://payment-handler.bernardliatme.workers.dev';

/* ── SCROLL REVEAL ── */
function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.06, rootMargin: '0px 0px -32px 0px' });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}
document.addEventListener('DOMContentLoaded', initReveal);
window.addEventListener('load', () => {
  document.querySelectorAll('.hero .reveal').forEach(el => {
    setTimeout(() => el.classList.add('visible'), 100);
  });
});

/* ── STRIPE ── */
async function openStripeCheckout(product) {
  try {
    showLoading('Creating checkout...');
    const r = await fetch(`${WORKER_URL}/api/create-checkout`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ product }) });
    const d = await r.json();
    closeLoading();
    if (d.url) window.location.href = d.url;
    else alert('Failed to create checkout. Please try again.');
  } catch(e) { closeLoading(); alert('Error. Please try again.'); }
}

/* ── TOKEN ── */
async function validateTokenOnPage(product) {
  const el = document.getElementById('croupierToken');
  const token = el ? el.value.trim() : '';
  if (!token) { alert('Please enter your access token.'); return; }
  try {
    showLoading('Validating...');
    const r = await fetch(`${WORKER_URL}/api/validate-token`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ token }) });
    const result = await r.json();
    closeLoading();
    if (result.valid) { localStorage.setItem('fidmarkToken', token); showDashboard(product, token); }
    else alert('Invalid token. Check your email or contact sales@asqsys.com');
  } catch(e) { closeLoading(); alert('Error validating. Please try again.'); }
}

/* ── DASHBOARD ── */
async function showDashboard(product, token) {
  showLoading('Loading The Croupier...');
  try {
    const r = await fetch(`${WORKER_URL}/api/get-usage`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ token }) });
    const d = await r.json();
    closeLoading();
    const usage = d.usage || {};
    const pct = Math.min(100, ((usage.candidates_found / usage.limit) * 100)).toFixed(1);
    const barColor = pct >= 90 ? 'var(--red)' : pct >= 75 ? 'var(--yellow)' : 'var(--accent)';
    const dashUrl = 'https://croupier-site.vercel.app/';
    const isCancelling = d.cancelling || d.status === 'cancelling';
    const cancelsAt = d.cancels_at ? new Date(d.cancels_at).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}) : null;
    const statusBadge = isCancelling
      ? `<div style="background:rgba(250,204,21,0.08);border:1px solid rgba(250,204,21,0.2);padding:10px 14px;margin-bottom:20px;border-radius:8px;"><span style="font-family:var(--mono);font-size:10px;color:var(--yellow);letter-spacing:0.08em;">Cancels ${cancelsAt} — full access until then</span></div>`
      : d.status === 'past_due'
      ? `<div style="background:rgba(248,113,113,0.08);border:1px solid rgba(248,113,113,0.2);padding:10px 14px;margin-bottom:20px;border-radius:8px;"><span style="font-family:var(--mono);font-size:10px;color:var(--red);letter-spacing:0.08em;">Payment past due — update billing</span></div>`
      : '';
    const cancelButton = isCancelling
      ? `<div style="font-family:var(--mono);font-size:9px;color:var(--t3);text-align:center;padding:12px;letter-spacing:0.1em;text-transform:uppercase;">Cancellation already scheduled</div>`
      : `<button onclick="cancelSubscription('${token}',this)" style="width:100%;padding:11px;background:transparent;border:1px solid rgba(248,113,113,0.2);color:rgba(248,113,113,0.5);font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:0.1em;cursor:pointer;transition:all 0.15s;border-radius:8px;" onmouseover="this.style.borderColor='var(--red)';this.style.color='var(--red)'" onmouseout="this.style.borderColor='rgba(248,113,113,0.2)';this.style.color='rgba(248,113,113,0.5)'">Cancel Subscription</button>`;
    const modal = document.createElement('div');
    modal.id = 'dashboard-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(20px);';
    modal.innerHTML = `<div style="background:var(--bg1);border:1px solid rgba(168,85,247,0.2);max-width:460px;width:100%;padding:44px 36px;border-radius:16px;">
      <div style="font-family:var(--mono);font-size:9px;color:var(--accent);letter-spacing:0.2em;text-transform:uppercase;margin-bottom:12px;">Access Granted</div>
      <h2 style="font-family:var(--display);font-size:2rem;font-weight:800;letter-spacing:-0.04em;margin-bottom:32px;">The Croupier</h2>
      ${statusBadge}
      <div style="margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="font-family:var(--mono);font-size:10px;color:var(--t3);text-transform:uppercase;letter-spacing:0.08em;">Monthly Usage</span>
          <span style="font-family:var(--mono);font-size:10px;color:var(--accent);">${(usage.candidates_found||0).toLocaleString()} / ${(usage.limit||0).toLocaleString()}</span>
        </div>
        <div style="height:2px;background:var(--bg3);width:100%;border-radius:2px;">
          <div style="height:2px;background:${barColor};width:${pct}%;transition:width 0.6s;border-radius:2px;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:6px;">
          <span style="font-family:var(--mono);font-size:9px;color:var(--t4);">${pct}% used</span>
          <span style="font-family:var(--mono);font-size:9px;color:var(--t4);">${usage.searches_this_month||0} searches</span>
        </div>
      </div>
      <a href="${dashUrl}" target="_blank" style="display:block;width:100%;padding:14px;background:var(--accent);color:#000;font-family:var(--mono);font-size:11px;text-transform:uppercase;letter-spacing:0.12em;text-align:center;text-decoration:none;font-weight:700;margin-bottom:10px;border-radius:8px;">Open The Croupier →</a>
      <button onclick="document.getElementById('dashboard-modal').remove()" style="width:100%;padding:11px;background:transparent;border:1px solid var(--b2);color:var(--t2);font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:0.1em;cursor:pointer;margin-bottom:10px;border-radius:8px;">Close</button>
      <div id="cancel-area">${cancelButton}</div>
    </div>`;
    document.body.appendChild(modal);
  } catch(e) { closeLoading(); alert('Error loading dashboard.'); }
}

async function cancelSubscription(token, btn) {
  if (!confirm('Are you sure you want to cancel?\n\nYou keep full access until the end of your billing period.')) return;
  btn.disabled = true; btn.textContent = 'Cancelling...';
  try {
    const r = await fetch(`${WORKER_URL}/api/cancel-subscription`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ token }) });
    const d = await r.json();
    if (d.success) {
      const ca = d.cancels_at ? new Date(d.cancels_at).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}) : 'end of billing period';
      document.getElementById('cancel-area').innerHTML = `<div style="background:rgba(250,204,21,0.06);border:1px solid rgba(250,204,21,0.2);padding:10px 14px;text-align:center;border-radius:8px;"><span style="font-family:var(--mono);font-size:10px;color:var(--yellow);letter-spacing:0.08em;">Cancels ${ca} — full access until then</span></div>`;
    } else { btn.disabled = false; btn.textContent = 'Cancel Subscription'; alert(d.error||'Cancellation failed. Contact sales@asqsys.com'); }
  } catch(e) { btn.disabled = false; btn.textContent = 'Cancel Subscription'; alert('Error. Contact sales@asqsys.com'); }
}

/* ── LOADING ── */
function showLoading(msg) {
  const m = document.createElement('div');
  m.id = 'loading-modal';
  m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(20px);';
  m.innerHTML = `<div style="font-family:var(--mono);font-size:10px;color:var(--accent);letter-spacing:0.2em;text-transform:uppercase;">${msg}</div>`;
  document.body.appendChild(m);
}
function closeLoading() { document.getElementById('loading-modal')?.remove(); }
