/* POM Tutorials - Application Logic
 *
 * Site-wide password gate: blocks ALL content until the correct password
 * is entered. Auth persists in sessionStorage for the browser session.
 *
 * Content is rendered from content.js — no HTML editing needed.
 */

// ─── Load KaTeX dynamically via fetch+eval (for math rendering) ───
(function loadKaTeX() {
  var base = 'vendor/katex/';
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = base + 'katex.min.css';
  document.head.appendChild(link);
  fetch(base + 'katex.min.js').then(function(r) { return r.text(); })
    .then(function(code) { (0, eval)(code); return fetch(base + 'auto-render.min.js'); })
    .then(function(r) { return r.text(); })
    .then(function(code) {
      (0, eval)(code);
      if (typeof renderMathInElement === 'function') {
        renderMathInElement(document.body, {
          delimiters: [
            {left: '\\(', right: '\\)', display: false},
            {left: '\\[', right: '\\]', display: true}
          ],
          throwOnError: false
        });
      }
    })
    .catch(function(e) { console.warn('KaTeX load failed:', e); });
})();

// ─── Password Utilities ───
async function hashPassword(password) {
  const enc = new TextEncoder().encode(password);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function isAuthenticated() {
  return sessionStorage.getItem("pom_auth") === "true";
}

// ─── Site-wide Auth Gate ───
function showAuthGate() {
  document.getElementById("auth-gate").style.display = "flex";
  document.getElementById("app-content").style.display = "none";
}

function showApp() {
  document.getElementById("auth-gate").style.display = "none";
  document.getElementById("app-content").style.display = "block";
}

async function handleSiteLogin(e) {
  e.preventDefault();
  const input = document.getElementById("gate-password");
  const error = document.getElementById("gate-error");
  const hash = await hashPassword(input.value);
  if (hash === POM_CONFIG.passwordHash) {
    sessionStorage.setItem("pom_auth", "true");
    showApp();
    init();
  } else {
    error.textContent = "Incorrect password. Please try again.";
    input.value = "";
    input.focus();
  }
}

// ─── Render: Dashboard Cards ───
function renderDashboard() {
  const grid = document.getElementById("card-grid");
  if (!grid) return;

  grid.innerHTML = SESSIONS.map(s => {
    const available = s.status === "available";
    const href = available ? `session.html?s=${s.number}` : "#";
    const badgeClass = available ? "badge-available" : "badge-coming";
    const badgeLabel = available ? "Available" : "Coming Soon";
    const dot = available ? "&#9679;" : "&#9711;";
    const cursorStyle = available ? "" : ' style="cursor:default;opacity:.7"';

    return `
      <a class="card" href="${href}"${cursorStyle}>
        <div class="card-header">
          <div class="card-number">${s.number}</div>
          <div class="card-header-text">
            <h3>Session ${s.number}</h3>
            <div class="card-topic">${s.topic}</div>
          </div>
        </div>
        <div class="card-body">
          <p>${s.summary}</p>
        </div>
        <div class="card-footer">
          <span class="badge ${badgeClass}">${dot}&nbsp;${badgeLabel}</span>
        </div>
      </a>`;
  }).join("");
}

// ─── Render: Session Page ───
function renderSession() {
  const container = document.getElementById("session-content");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const num = parseInt(params.get("s"), 10);
  const session = SESSIONS.find(s => s.number === num);

  if (!session) {
    container.innerHTML = '<div class="coming-soon"><div class="icon">&#128269;</div><h2>Session not found</h2><p>Return to the <a href="index.html">dashboard</a>.</p></div>';
    return;
  }

  // Update hero
  const heroTitle = document.getElementById("session-title");
  const heroSub = document.getElementById("session-subtitle");
  if (heroTitle) heroTitle.textContent = `Session ${session.number}: ${session.topic}`;
  if (heroSub) heroSub.textContent = session.summary;
  document.title = `Session ${session.number}: ${session.topic} | POM Tutorials`;

  // Highlight active nav
  document.querySelectorAll(".nav-links a").forEach(a => {
    if (a.dataset.session == num) a.classList.add("active");
    else a.classList.remove("active");
  });

  if (session.status === "coming-soon") {
    container.innerHTML = `
      <div class="coming-soon">
        <div class="icon">&#128679;</div>
        <h2>Coming Soon</h2>
        <p>Materials for Session ${session.number}: ${session.topic} will be available before the tutorial date.</p>
      </div>`;
    return;
  }

  // ── Key Concepts ──
  const conceptsHTML = (session.concepts && session.concepts.length > 0)
    ? `<div class="section">
        <h2>Key Concepts</h2>
        <div class="concepts-grid">${session.concepts.map(c =>
          `<div class="concept-card">
            <div class="concept-icon">${c.icon}</div>
            <h4>${c.title}</h4>
            <p>${c.body}</p>
          </div>`).join("")}
        </div>
      </div>` : "";

  // ── Diagrams ──
  const diagramsHTML = (session.diagrams && session.diagrams.length > 0)
    ? `<div class="section">
        <h2>Process Flow Diagrams</h2>
        ${session.diagrams.map(d =>
          `<div class="diagram-block">
            <h4>${d.title}</h4>
            ${d.svg}
          </div>`).join("")}
      </div>` : "";

  // ── Materials ──
  const materials = [];
  if (session.slidesPDF) materials.push({ label: "Slide Deck", path: session.slidesPDF });
  if (session.recipe) materials.push({ label: "Recipe / Cheat Sheet", path: session.recipe });
  if (session.reviewSheet) materials.push({ label: "Review Sheet (Problems)", path: session.reviewSheet });
  if (session.solutions) materials.push({ label: "Solutions PDF", path: session.solutions });

  const materialsHTML = materials.map(m =>
    `<li><a href="${m.path}" target="_blank">
      <span class="file-icon">PDF</span>
      <span>${m.label}</span>
    </a></li>`
  ).join("");

  // ── Problems with inline solutions ──
  const problemsHTML = session.problems.map((p, i) => {
    const stars = p.difficulty || "";
    const partsHTML = p.parts.map((part, j) => {
      const id = `sol-${i}-${j}`;
      return `
        <div class="problem-part">
          <div class="part-question">
            <span class="part-letter">${String.fromCharCode(97 + j)}</span>
            <span>${part.question}</span>
          </div>
          <button class="solution-toggle" onclick="toggleSolution('${id}', this)" aria-expanded="false">
            <span>Show Solution</span>
            <span class="chevron">&#9654;</span>
          </button>
          <div class="solution-body" id="${id}">${part.solution}</div>
        </div>`;
    }).join("");

    const contextHTML = p.context ? `<div class="problem-context">${p.context}</div>` : "";
    return `
      <div class="problem-block">
        <div class="problem-header">
          <span class="problem-num">${i + 1}</span>
          <strong>${p.title}</strong>
          <span class="difficulty">(${stars})</span>
        </div>
        ${contextHTML}
        ${partsHTML}
      </div>`;
  }).join("");

  // ── Readings ──
  const readingsHTML = session.readings.map(r =>
    `<li><a href="${r.url}" target="_blank">
      <span>${r.label}</span>
      <span class="link-arrow">&#8599;</span>
    </a></li>`
  ).join("");

  container.innerHTML = `
    ${conceptsHTML}
    ${diagramsHTML}

    <div class="section">
      <h2>Materials</h2>
      ${session.teachingSlides && session.teachingSlides.length > 0
        ? `<a href="present.html?s=${session.number}" class="present-btn">&#9654;&ensp;Present Teaching Slides</a>`
        : ""}
      <ul class="materials-list">${materialsHTML}</ul>
    </div>

    <div class="section">
      <h2>Problems &amp; Solutions</h2>
      <p style="font-size:.85rem;color:var(--gray-500);margin-bottom:1.25rem;">Click "Show Solution" under each part to reveal the worked answer. Try the problem yourself first!</p>
      ${problemsHTML}
    </div>

    <div class="section">
      <h2>Further Reading</h2>
      <ul class="reading-list">${readingsHTML}</ul>
    </div>`;
}

// ─── Solution toggle ───
function toggleSolution(id, btn) {
  const el = document.getElementById(id);
  const open = el.classList.toggle("open");
  btn.setAttribute("aria-expanded", open);
  btn.querySelector("span:first-child").textContent = open ? "Hide Solution" : "Show Solution";
}

// ─── Navigation Rendering ───
function renderNav() {
  const navLinks = document.getElementById("nav-links");
  if (!navLinks) return;

  const params = new URLSearchParams(window.location.search);
  const currentSession = parseInt(params.get("s"), 10);
  const isIndex = !window.location.pathname.includes("session.html");

  let html = `<li><a href="index.html" class="${isIndex ? "active" : ""}">Home</a></li>`;
  SESSIONS.forEach(s => {
    const available = s.status === "available";
    const href = available ? `session.html?s=${s.number}` : "#";
    const active = s.number === currentSession ? "active" : "";
    const style = available ? "" : ' style="opacity:.5;cursor:default"';
    html += `<li><a href="${href}" class="${active}" data-session="${s.number}"${style}>S${s.number}</a></li>`;
  });
  navLinks.innerHTML = html;
}

function setupMobileNav() {
  const toggle = document.getElementById("nav-toggle");
  const navLinks = document.getElementById("nav-links");
  if (toggle && navLinks) {
    toggle.addEventListener("click", () => navLinks.classList.toggle("open"));
  }
}

// ─── Init ───
function init() {
  renderNav();
  renderDashboard();
  renderSession();
  setupMobileNav();
}

document.addEventListener("DOMContentLoaded", () => {
  const gateForm = document.getElementById("gate-form");
  if (gateForm) gateForm.addEventListener("submit", handleSiteLogin);

  if (isAuthenticated()) {
    showApp();
    init();
  } else {
    showAuthGate();
  }
});
