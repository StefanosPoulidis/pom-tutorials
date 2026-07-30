/* POM Tutorials - Application Logic
 *
 * Password gate for tutorial content. Public pages can opt out with
 * data-access="public" on the body element.
 *
 * Content is rendered from content.js — no HTML editing needed.
 */

// KaTeX is loaded with defer in the page head and is ready by DOMContentLoaded.
const mathRenderOptions = {
  delimiters: [
    { left: '\\(', right: '\\)', display: false },
    { left: '\\[', right: '\\]', display: true }
  ],
  throwOnError: false
};

function renderMath(root) {
  if (root && typeof renderMathInElement === "function") {
    renderMathInElement(root, mathRenderOptions);
  }
}

// ─── Password Utilities ───
async function hashPassword(password) {
  const enc = new TextEncoder().encode(password);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function isAuthenticated() {
  return sessionStorage.getItem("pom_auth") === "true";
}

function isPublicPage() {
  return document.body.dataset.access === "public";
}

// ─── Tutorial Auth Gate ───
function showAuthGate() {
  const gate = document.getElementById("auth-gate");
  const app = document.getElementById("app-content");
  if (gate) gate.style.display = "flex";
  if (app) app.style.display = "none";
}

function showApp() {
  const gate = document.getElementById("auth-gate");
  const app = document.getElementById("app-content");
  if (gate) gate.style.display = "none";
  if (app) app.style.display = "block";
}

async function handleSiteLogin(e) {
  e.preventDefault();
  const input = document.getElementById("gate-password");
  const error = document.getElementById("gate-error");
  const hash = await hashPassword(input.value);
  if (hash === POM_CONFIG.passwordHash) {
    input.setAttribute("aria-invalid", "false");
    error.textContent = "";
    sessionStorage.setItem("pom_auth", "true");
    showApp();
    init();
  } else {
    error.textContent = "Incorrect password. Please try again.";
    input.setAttribute("aria-invalid", "true");
    input.value = "";
    input.focus();
  }
}

// ─── Render: Dashboard Cards ───
function renderDashboard() {
  const grid = document.getElementById("card-grid");
  if (!grid) return;

  const sessionCards = SESSIONS.map(s => {
    const available = s.status === "available";
    const href = available ? `session.html?s=${s.number}` : "#";
    const badgeClass = available ? "badge-available" : "badge-coming";
    const badgeLabel = available ? "Available" : "Coming Soon";
    const dot = available ? "&#9679;" : "&#9711;";
    const cursorStyle = available ? "" : ' style="cursor:default;opacity:.7" aria-disabled="true" tabindex="-1"';

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

  const gameCard = `
    <a class="card card-game" href="newsvendor-game.html" aria-label="Play the Newsvendor Challenge">
      <div class="card-header">
        <div class="card-number card-game-mark" aria-hidden="true">Q?</div>
        <div class="card-header-text">
          <h3>Interactive Game</h3>
          <div class="card-topic">The Newsvendor Challenge</div>
        </div>
      </div>
      <div class="card-body">
        <p>Use controlled comparisons to predict how demand, uncertainty, and unit economics move Q*, then test your policy across eight market briefs.</p>
      </div>
      <div class="card-footer">
        <span class="badge badge-game">&#9654;&nbsp;Play now</span>
        <span class="card-game-time">About 6 minutes</span>
      </div>
    </a>`;

  grid.innerHTML = sessionCards + gameCard;
}

// ─── Render: Session Page ───
function renderSession() {
  const container = document.getElementById("session-content");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const num = parseInt(params.get("s"), 10);
  const session = SESSIONS.find(s => s.number === num);

  if (!session) {
    document.title = "Session not found | POM Tutorials";
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
    ? `<div class="section" id="concepts">
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
    ? `<div class="section" id="diagrams">
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

  // ── Recording video player ──
  const recordingHTML = session.recording ? `
    <div class="recording-section">
      <button class="recording-toggle" onclick="toggleRecording(this, '${session.recording}')" aria-expanded="false" aria-controls="recording-player">
        <span class="toggle-icon">▶</span>
        <span>Tutorial Recording</span>
        <span class="recording-badge">Watch</span>
      </button>
      <div id="recording-player" class="recording-player hidden" hidden>
        <video id="recording-video" controls preload="auto" width="100%" type="video/mp4"></video>
        <p style="text-align:center;padding:.5rem;font-size:.8rem;color:#64748b">Large file — may take a moment to buffer. <a href="${session.recording}" download style="color:#3b82f6">Download instead</a></p>
      </div>
    </div>` : "";

  const materialsHTML = materials.map(m =>
    `<li><a href="${m.path}" target="_blank" rel="noopener noreferrer">
      <span class="file-icon">${m.icon || 'PDF'}</span>
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
          <button class="solution-toggle" onclick="toggleSolution('${id}', this)" aria-expanded="false" aria-controls="${id}">
            <span>Show Solution</span>
            <span class="chevron">&#9654;</span>
          </button>
          <div class="solution-body" id="${id}" hidden>${part.solution}</div>
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

  // ── Practice Exams ──
  const practiceExamsHTML = (session.practiceExams && session.practiceExams.length > 0)
    ? `<div class="section" id="practice-exams">
        <h2>Practice Exams</h2>
        <p style="font-size:.85rem;color:var(--gray-500);margin-bottom:1.25rem;">Download the exam, time yourself (3 hours), then check your work against the solutions PDF. Detailed step-by-step walk-throughs of every problem are below under "Problems &amp; Solutions".</p>
        <div class="exam-grid">${session.practiceExams.map(e => `
          <div class="exam-card">
            <div class="exam-year">${e.year}</div>
            <h4>${e.title}</h4>
            <div class="exam-meta">
              <div><strong>Instructor:</strong> ${e.instructor}</div>
              <div><strong>Duration:</strong> ${e.duration}</div>
              <div><strong>Points:</strong> ${e.totalPoints}</div>
              <div><strong>Format:</strong> ${e.format}</div>
            </div>
            <div class="exam-topics">
              <strong>Topics:</strong>
              <ul>${e.topics.map(t => `<li>${t}</li>`).join("")}</ul>
            </div>
            <div class="exam-links">
              <a href="${e.examPDF}" target="_blank" rel="noopener noreferrer" class="btn btn-primary exam-btn">Exam PDF</a>
              <a href="${e.solutionsPDF}" target="_blank" rel="noopener noreferrer" class="btn exam-btn exam-btn-secondary">Solutions PDF</a>
            </div>
          </div>`).join("")}
        </div>
      </div>` : "";

  // ── Readings ──
  const readingsHTML = session.readings.map(r =>
    `<li><a href="${r.url}" target="_blank" rel="noopener noreferrer">
      <span>${r.label}</span>
      <span class="link-arrow" aria-hidden="true">&#8599;</span>
    </a></li>`
  ).join("");

  const outlineItems = [
    session.concepts && session.concepts.length > 0 ? ["concepts", "Concepts"] : null,
    session.diagrams && session.diagrams.length > 0 ? ["diagrams", "Diagrams"] : null,
    (materials.length > 0 || (session.teachingSlides && session.teachingSlides.length > 0) || session.recording) ? ["materials", "Materials"] : null,
    session.practiceExams && session.practiceExams.length > 0 ? ["practice-exams", "Practice exams"] : null,
    session.problems && session.problems.length > 0 ? ["problems", "Problems"] : null,
    session.readings && session.readings.length > 0 ? ["further-reading", "Further reading"] : null
  ].filter(Boolean);

  const outlineHTML = `<nav class="session-outline" aria-label="Session contents">
    <span>On this page</span>
    ${outlineItems.map(([id, label]) => `<a href="#${id}">${label}</a>`).join("")}
  </nav>`;

  container.innerHTML = `
    <aside class="session-guide">
      <span aria-hidden="true">&#128161;</span>
      <div><strong>Recommended flow:</strong> review the concepts, work through the interactive slides and optional hints, then attempt each problem before revealing its solution.</div>
    </aside>
    ${outlineHTML}
    ${conceptsHTML}
    ${diagramsHTML}

    <div class="section" id="materials">
      <h2>Materials</h2>
      ${session.teachingSlides && session.teachingSlides.length > 0
        ? `<a href="present.html?s=${session.number}" class="present-btn">&#9654;&ensp;Open Interactive Slides</a>`
        : ""}
      ${recordingHTML}
      <ul class="materials-list">${materialsHTML}</ul>
    </div>

    ${practiceExamsHTML}

    <div class="section" id="problems">
      <h2>Problems &amp; Solutions</h2>
      <p style="font-size:.85rem;color:var(--gray-500);margin-bottom:1.25rem;">Click "Show Solution" under each part to reveal the worked answer. Try the problem yourself first!</p>
      ${problemsHTML}
    </div>

    <div class="section" id="further-reading">
      <h2>Further Reading</h2>
      <ul class="reading-list">${readingsHTML}</ul>
    </div>`;

  renderMath(container);
}

// ─── Solution toggle ───
function toggleSolution(id, btn) {
  const el = document.getElementById(id);
  const open = el.classList.toggle("open");
  el.hidden = !open;
  btn.setAttribute("aria-expanded", open);
  btn.querySelector("span:first-child").textContent = open ? "Hide Solution" : "Show Solution";
}

// ─── Navigation Rendering ───
function renderNav() {
  const navLinks = document.getElementById("nav-links");
  if (!navLinks) return;

  const params = new URLSearchParams(window.location.search);
  const currentSession = parseInt(params.get("s"), 10);
  const pageName = window.location.pathname.split("/").pop();
  const isIndex = pageName === "" || pageName === "index.html";
  const isGame = pageName === "newsvendor-game.html";

  let html = `<li><a href="index.html" class="${isIndex ? "active" : ""}"${isIndex ? ' aria-current="page"' : ""}>Home</a></li>`;
  if (isGame && isPublicPage()) {
    navLinks.innerHTML = `
      <li><a href="index.html">Tutorial login</a></li>
      <li><a href="newsvendor-game.html" class="active" aria-current="page">Game</a></li>`;
    return;
  }

  SESSIONS.forEach(s => {
    const available = s.status === "available";
    const href = available ? `session.html?s=${s.number}` : "#";
    const active = s.number === currentSession ? "active" : "";
    const style = available ? "" : ' style="opacity:.5;cursor:default"';
    const current = active ? ' aria-current="page"' : "";
    const disabled = available ? "" : ' aria-disabled="true" tabindex="-1"';
    html += `<li><a href="${href}" class="${active}" data-session="${s.number}"${style}${current}${disabled}>S${s.number}</a></li>`;
  });
  html += `<li><a href="newsvendor-game.html" class="${isGame ? "active" : ""}"${isGame ? ' aria-current="page"' : ""}>Game</a></li>`;
  navLinks.innerHTML = html;
}

function setupMobileNav() {
  const toggle = document.getElementById("nav-toggle");
  const navLinks = document.getElementById("nav-links");
  if (toggle && navLinks) {
    const closeMenu = () => {
      navLinks.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    };

    toggle.addEventListener("click", () => {
      const open = navLinks.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    navLinks.addEventListener("click", event => {
      if (event.target.closest("a")) closeMenu();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeMenu();
    });
  }
}

// ─── Init ───
function init() {
  renderNav();
  renderDashboard();
  renderSession();
  setupMobileNav();
  if (typeof initNewsvendorGame === "function") initNewsvendorGame();
}

// ─── Recording video player ───
function toggleRecording(btn, url) {
  var player = document.getElementById("recording-player");
  var video = document.getElementById("recording-video");
  var isHidden = player.classList.contains("hidden");

  player.classList.toggle("hidden");
  player.hidden = !isHidden;
  btn.setAttribute("aria-expanded", String(isHidden));
  btn.querySelector(".toggle-icon").textContent = isHidden ? "▼" : "▶";

  // Only set source the first time it's opened
  if (isHidden && !video.getAttribute("src")) {
    video.src = url;
    video.load();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (isPublicPage()) {
    showApp();
    init();
    return;
  }

  const gateForm = document.getElementById("gate-form");
  const gateInput = document.getElementById("gate-password");
  if (gateForm) gateForm.addEventListener("submit", handleSiteLogin);
  if (gateInput) {
    gateInput.addEventListener("input", () => {
      gateInput.setAttribute("aria-invalid", "false");
      const error = document.getElementById("gate-error");
      if (error) error.textContent = "";
    });
  }

  if (isAuthenticated()) {
    showApp();
    init();
  } else {
    showAuthGate();
    if (gateInput) gateInput.focus();
  }
});
