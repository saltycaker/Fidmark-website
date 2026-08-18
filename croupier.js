const WORKER_URL = 'https://payment-handler.bernardliatme.workers.dev';

/* ── DEMO CANDIDATE SCORER ── */
function runDemo() {
  const title = document.getElementById('demoJobTitle')?.value.trim() || 'Senior Backend Engineer';
  const skillsInput = document.getElementById('demoSkills')?.value.trim() || 'Python, AWS, Distributed Systems';
  const exp = document.getElementById('demoExperience')?.value.trim() || '5+ years';
  const location = document.getElementById('demoLocation')?.value.trim() || 'San Francisco Bay Area';

  const userSkills = skillsInput.split(',').map(s => s.trim()).filter(Boolean);

  const container = document.getElementById('resultsContainer');
  container.innerHTML = `
    <div style="padding:40px 0;text-align:center;">
      <span class="section-eyebrow">The Croupier Scouting pool...</span>
      <div style="font-size:13px;color:var(--ink-tertiary);margin-top:8px;">Running Fidmark fine-tuned model for "${title}" in ${location}</div>
    </div>
  `;

  setTimeout(() => {
    const demoProfiles = [
      {
        name: 'Sarah Chen',
        title: title,
        company: 'Upstart',
        years: 8,
        skills: userSkills.length ? userSkills : ['Python', 'AWS', 'Kubernetes'],
        score: 94,
        verdict: 'Hire',
        reason: `Strong ${exp} alignment with production expertise in ${(userSkills.slice(0, 2).join(' & ')) || 'cloud infra'}. Led team of 6 engineers.`
      },
      {
        name: 'Michael Rodriguez',
        title: `Lead ${title.replace(/Senior|Staff|Lead/gi, '').trim() || 'Engineer'}`,
        company: 'Stripe',
        years: 6,
        skills: userSkills.length ? [...userSkills.slice(0, 2), 'PostgreSQL', 'Redis'] : ['Node.js', 'Python', 'PostgreSQL', 'Redis'],
        score: 88,
        verdict: 'Hire',
        reason: `High velocity systems background in ${location}. Excellent transactional scale and architectural depth.`
      },
      {
        name: 'James Kim',
        title: `Staff ${title.replace(/Senior|Staff|Lead/gi, '').trim() || 'Architect'}`,
        company: 'Persona',
        years: 10,
        skills: userSkills.length ? [...userSkills.slice(0, 1), 'Java', 'Docker', 'Kubernetes'] : ['Java', 'React', 'AWS', 'Kubernetes'],
        score: 82,
        verdict: 'Hire',
        reason: `Senior breadth across languages; strong match for ${exp} target scope.`
      },
      {
        name: 'Emily Thompson',
        title: `Full Stack ${title.replace(/Senior|Staff|Lead/gi, '').trim() || 'Developer'}`,
        company: 'Notion',
        years: 5,
        skills: ['TypeScript', 'React', 'Node.js', ...(userSkills.slice(0, 1))],
        score: 74,
        verdict: 'Maybe',
        reason: `Solid full-stack candidate; meets basic ${exp} requirement but slightly lighter on specialized infrastructure tooling.`
      }
    ];

    container.innerHTML = demoProfiles.map((c) => {
      const badgeClass = c.score >= 80 ? 'badge-hire' : 'badge-maybe';
      return `
        <div class="eval-card" style="margin-bottom:14px;">
          <div class="eval-top">
            <div>
              <div class="eval-name">${c.name}</div>
              <div class="eval-role">${c.title} · ${c.company} · ${c.years}y exp</div>
            </div>
            <span class="badge-pill ${badgeClass}">${c.verdict} · ${c.score}/100</span>
          </div>
          <div class="eval-reason">${c.reason}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;margin-bottom:12px;">
            ${c.skills.map(s => `<span style="font-family:var(--font-mono);font-size:10.5px;background:var(--bg-paper);border:1px solid var(--border-ink);padding:2px 8px;border-radius:4px;">${s}</span>`).join('')}
          </div>
          <div class="eval-actions">
            <button class="btn-sm-ink" onclick="showToast('Candidate ${c.name} approved to ATS!')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:4px;"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Approve to ATS
            </button>
            <button class="btn-sm-outline" onclick="showToast('Opening dossier for ${c.name}...')">View Dossier</button>
          </div>
        </div>
      `;
    }).join('');
  }, 800);
}

/* ── STRIPE CHECKOUT ── */
async function openStripeCheckout(product) {
  try {
    showLoading('Creating secure session...');
    const r = await fetch(`${WORKER_URL}/api/create-checkout`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ product })
    });
    const d = await r.json();
    closeLoading();
    if (d.url) window.location.href = d.url;
    else alert('Failed to create checkout session.');
  } catch(e) {
    closeLoading();
    alert('Error initiating checkout. Please contact sales@asqsys.com');
  }
}

/* ── TOKEN VALIDATION & DASHBOARD MODAL ── */
async function validateTokenOnPage(product) {
  const el = document.getElementById('croupierToken');
  const token = el ? el.value.trim() : '';
  if (!token) { alert('Please enter your access token.'); return; }
  try {
    showLoading('Validating token...');
    const r = await fetch(`${WORKER_URL}/api/validate-token`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ token })
    });
    const result = await r.json();
    closeLoading();
    if (result.valid) {
      localStorage.setItem('fidmarkToken', token);
      showDashboard(product, token);
    } else {
      alert('Invalid access token. Please check format (DEALERS/TRIAL-XXXXXX)');
    }
  } catch(e) {
    closeLoading();
    alert('Error during authentication.');
  }
}

async function showDashboard(product, token) {
  showLoading('Loading workspace...');
  try {
    const r = await fetch(`${WORKER_URL}/api/get-usage`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ token })
    });
    const d = await r.json();
    closeLoading();
    const usage = d.usage || {};
    const pct = Math.min(100, ((usage.candidates_found / (usage.limit || 1000)) * 100)).toFixed(1);

    const modal = document.createElement('div');
    modal.id = 'dashboard-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(24,24,27,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(8px);';
    modal.innerHTML = `
      <div style="background:#FFFFFF;border:1.5px solid #18181B;max-width:440px;width:100%;padding:36px;border-radius:24px;box-shadow:var(--shadow-float);">
        <span class="section-eyebrow">Fidmark Workspace</span>
        <h2 style="font-family:var(--font-serif);font-size:24px;font-weight:600;margin:8px 0 20px;">The Croupier Console</h2>

        <div style="background:var(--bg-paper);border:1.5px solid #18181B;border-radius:12px;padding:16px;margin-bottom:20px;">
          <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:6px;">
            <span>Monthly Usage</span>
            <strong>${(usage.candidates_found||0).toLocaleString()} / ${(usage.limit||1000).toLocaleString()}</strong>
          </div>
          <div style="height:6px;background:#E4E1D8;border-radius:3px;overflow:hidden;">
            <div style="height:100%;background:#18181B;width:${pct}%;"></div>
          </div>
        </div>

        <a href="https://croupier-site.vercel.app/" target="_blank" class="btn-pill-primary" style="width:100%;justify-content:center;margin-bottom:10px;">
          Open The Croupier
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </a>
        <button onclick="document.getElementById('dashboard-modal').remove()" class="btn-pill-outline" style="width:100%;justify-content:center;">
          Close
        </button>
      </div>
    `;
    document.body.appendChild(modal);
  } catch(e) {
    closeLoading();
    alert('Error loading dashboard.');
  }
}

/* Custom dropdown (job-title selector on home page bento box lives in index.html inline,
   this copy is kept here only if croupier.html ever reuses it — currently unused). */
