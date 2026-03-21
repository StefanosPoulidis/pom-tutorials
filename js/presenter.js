/* POM Tutorials - Presenter Mode
 *
 * Full-screen slide presentation for teaching tutorials.
 * Reads slide data from content.js and renders one slide at a time.
 * Navigation: Arrow keys, on-screen buttons, touch swipe.
 * Hint buttons: Interactive overlays for formulas, diagrams, reminders.
 * Slide Jump: Click the counter or press G to jump to any slide.
 * Themes: Each problem section has a distinct background color.
 */

// ─── Load KaTeX dynamically via fetch+eval (for math rendering) ───
var _katexReady = (function loadKaTeX() {
  var base = 'vendor/katex/';
  // CSS
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = base + 'katex.min.css';
  document.head.appendChild(link);
  // Load JS via fetch+eval (works in sandboxed environments)
  return fetch(base + 'katex.min.js').then(function(r) { return r.text(); })
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

// ─── Auth (same as app.js) ───
async function hashPassword(password) {
  const enc = new TextEncoder().encode(password);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function isAuthenticated() {
  return sessionStorage.getItem("pom_auth") === "true";
}

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
    initPresenter();
  } else {
    error.textContent = "Incorrect password. Please try again.";
    input.value = "";
    input.focus();
  }
}

// ─── Presenter State ───
let session = null;
let currentSlide = 0;
let totalSlides = 0;

// ─── Theme System ───
const themeLabels = {
  p1: "Problem 1: Instant Dolls",
  p2: "Problem 2: Ceramics",
  p3: "Problem 3: Sugar Plant",
  p4: "Problem 4: Sport Obermeyer"
};

function applyTheme(slide) {
  const presenter = document.querySelector(".presenter");
  // Remove all existing theme classes
  presenter.classList.remove("theme-p1", "theme-p2", "theme-p3", "theme-p4");
  if (slide.theme) {
    presenter.classList.add("theme-" + slide.theme);
  }
}

// ─── Hint System ───
function renderHints(hints) {
  if (!hints || hints.length === 0) return "";
  let html = '<div class="hint-bar">';
  hints.forEach((hint, i) => {
    html += `<button class="hint-btn" onclick="toggleHint(this, ${i})" data-hint-index="${i}">
      <span class="hint-icon">${hint.icon || "\u{1F4A1}"}</span> ${hint.label}
    </button>`;
  });
  html += '</div><div class="hint-panels">';
  hints.forEach((hint, i) => {
    html += `<div class="hint-panel" id="hint-panel-${i}" style="display:none">
      <div class="hint-panel-header">
        <span>${hint.icon || "\u{1F4A1}"} ${hint.label}</span>
        <button class="hint-close" onclick="closeHint(${i})">✕</button>
      </div>
      <div class="hint-panel-body">${hint.content}</div>
    </div>`;
  });
  html += '</div>';
  return html;
}

function toggleHint(btn, index) {
  const panel = document.getElementById("hint-panel-" + index);
  const isOpen = panel.style.display !== "none";
  // Close all panels first
  document.querySelectorAll(".hint-panel").forEach(p => p.style.display = "none");
  document.querySelectorAll(".hint-btn").forEach(b => b.classList.remove("active"));
  if (!isOpen) {
    panel.style.display = "block";
    btn.classList.add("active");
    // Re-render KaTeX math in the opened hint panel
    if (typeof renderMathInElement === 'function') {
      renderMathInElement(panel, {
        delimiters: [
          {left: '\\(', right: '\\)', display: false},
          {left: '\\[', right: '\\]', display: true}
        ],
        throwOnError: false
      });
    }
  }
}

function closeHint(index) {
  document.getElementById("hint-panel-" + index).style.display = "none";
  document.querySelectorAll(".hint-btn").forEach(b => b.classList.remove("active"));
}

// ─── Slide Jump / Go-To ───
function openSlideJump() {
  // Don't open if already open
  if (document.getElementById("slide-jump-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "slide-jump-overlay";
  overlay.className = "slide-jump-overlay";

  let gridHTML = '<div class="slide-jump-header"><h3>Jump to Slide</h3><button class="hint-close" onclick="closeSlideJump()">\u2715</button></div>';
  gridHTML += '<div class="slide-jump-grid">';

  session.teachingSlides.forEach((slide, i) => {
    const isCurrent = (i === currentSlide) ? " current" : "";
    const themeClass = slide.theme ? " sj-" + slide.theme : "";
    const label = slide.title.length > 35 ? slide.title.substring(0, 33) + "\u2026" : slide.title;
    const typeIcon = { title: "\u{1F3AC}", concept: "\u{1F4D6}", formula: "\u{1F9EE}", step: "\u{1F4CB}", table: "\u{1F4CA}", diagram: "\u{1F5BC}" }[slide.type] || "\u{1F4C4}";
    gridHTML += `<button class="sj-item${isCurrent}${themeClass}" onclick="jumpToSlide(${i})" title="${slide.title}">
      <span class="sj-num">${i + 1}</span>
      <span class="sj-icon">${typeIcon}</span>
      <span class="sj-label">${label}</span>
    </button>`;
  });

  gridHTML += '</div>';
  overlay.innerHTML = gridHTML;
  document.querySelector(".presenter").appendChild(overlay);

  // Focus for keyboard navigation
  overlay.focus();
}

function closeSlideJump() {
  const overlay = document.getElementById("slide-jump-overlay");
  if (overlay) overlay.remove();
}

function jumpToSlide(index) {
  closeSlideJump();
  currentSlide = index;
  renderSlide(index);
  // Scroll viewport to top
  document.querySelector(".slide-viewport").scrollTop = 0;
}

// ─── Slide Rendering ───
function renderSlide(index) {
  const slide = session.teachingSlides[index];
  const el = document.getElementById("slide-container");

  // Apply theme
  applyTheme(slide);

  // Re-trigger animation
  el.style.animation = "none";
  el.offsetHeight; // force reflow
  el.style.animation = "";

  el.className = "slide-container slide-" + slide.type;

  let html = "";
  switch (slide.type) {
    case "title":
      html = `<div class="slide-title-content">
        <h1>${slide.title}</h1>
        ${slide.subtitle ? `<p class="slide-subtitle">${slide.subtitle}</p>` : ""}
        ${slide.content ? `<div class="slide-body">${slide.content}</div>` : ""}
      </div>`;
      break;
    case "formula":
      html = `<h2 class="slide-heading">${slide.title}</h2>
        <div class="slide-body">${slide.content}</div>`;
      break;
    case "diagram":
    case "image":
      html = `<h2 class="slide-heading">${slide.title}</h2>
        <div class="slide-visual">${slide.content}</div>`;
      break;
    default: // concept, step, table
      html = `<h2 class="slide-heading">${slide.title}</h2>
        <div class="slide-body">${slide.content}</div>`;
      break;
  }

  // Add hints if present
  if (slide.hints && slide.hints.length > 0) {
    html += renderHints(slide.hints);
  }

  el.innerHTML = html;

  // Update counter
  document.getElementById("slide-counter").textContent = `${index + 1} / ${totalSlides}`;

  // Update progress bar
  const pct = totalSlides > 1 ? ((index) / (totalSlides - 1)) * 100 : 100;
  document.getElementById("progress-fill").style.width = pct + "%";

  // Re-render KaTeX math in the slide
  if (typeof renderMathInElement === 'function') {
    renderMathInElement(document.querySelector('.slide-container'), {
      delimiters: [
        {left: '\\(', right: '\\)', display: false},
        {left: '\\[', right: '\\]', display: true}
      ],
      throwOnError: false
    });
  }
}

function nextSlide() {
  if (currentSlide < totalSlides - 1) {
    currentSlide++;
    renderSlide(currentSlide);
    document.querySelector(".slide-viewport").scrollTop = 0;
  }
}

function prevSlide() {
  if (currentSlide > 0) {
    currentSlide--;
    renderSlide(currentSlide);
    document.querySelector(".slide-viewport").scrollTop = 0;
  }
}

// ─── Keyboard Navigation ───
function setupKeyboardNav() {
  document.addEventListener("keydown", (e) => {
    // If slide jump is open, handle its keyboard events
    const jumpOverlay = document.getElementById("slide-jump-overlay");
    if (jumpOverlay) {
      if (e.key === "Escape") {
        closeSlideJump();
        e.preventDefault();
      }
      return; // Don't process other keys when jump is open
    }

    switch (e.key) {
      case "ArrowRight":
      case " ":
        e.preventDefault();
        nextSlide();
        break;
      case "ArrowLeft":
        e.preventDefault();
        prevSlide();
        break;
      case "g":
      case "G":
        if (e.target.tagName !== "INPUT") {
          e.preventDefault();
          openSlideJump();
        }
        break;
      case "f":
      case "F":
        if (e.target.tagName !== "INPUT") toggleFullscreen();
        break;
      case "Escape":
        // Close hints first, then exit fullscreen, then exit presenter
        const openHint = document.querySelector('.hint-panel[style*="display: block"], .hint-panel[style*="display:block"]');
        if (openHint) {
          document.querySelectorAll(".hint-panel").forEach(p => p.style.display = "none");
          document.querySelectorAll(".hint-btn").forEach(b => b.classList.remove("active"));
        } else if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          window.location.href = document.getElementById("exit-btn").href;
        }
        break;
    }
  });
}

// ─── Button Navigation ───
function setupButtonNav() {
  document.getElementById("prev-btn").addEventListener("click", prevSlide);
  document.getElementById("next-btn").addEventListener("click", nextSlide);
  document.getElementById("fullscreen-btn").addEventListener("click", toggleFullscreen);
  // Click slide counter to open jump
  document.getElementById("slide-counter").addEventListener("click", openSlideJump);
  document.getElementById("slide-counter").style.cursor = "pointer";
  document.getElementById("slide-counter").title = "Click to jump to any slide (or press G)";
}

// ─── Touch/Swipe Navigation ───
function setupTouchNav() {
  let touchStartX = 0;
  let touchStartY = 0;

  document.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  document.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    const dy = e.changedTouches[0].screenY - touchStartY;
    // Only trigger if horizontal swipe is dominant and > 50px
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) nextSlide();
      else prevSlide();
    }
  }, { passive: true });
}

// ─── Fullscreen ───
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen();
  }
}

// ─── Init ───
function initPresenter() {
  const params = new URLSearchParams(window.location.search);
  const num = parseInt(params.get("s"), 10);
  session = SESSIONS.find(s => s.number === num);

  if (!session || !session.teachingSlides || session.teachingSlides.length === 0) {
    document.getElementById("slide-container").innerHTML =
      '<div style="text-align:center"><h2>No slides available</h2><p style="opacity:.7;margin-top:.5rem">Slides for this session have not been added yet.</p><a href="index.html" style="color:#5eead4;margin-top:1rem;display:inline-block">Return to dashboard</a></div>';
    return;
  }

  totalSlides = session.teachingSlides.length;
  document.title = `Presenting: Session ${session.number} | POM Tutorials`;
  document.getElementById("exit-btn").href = `session.html?s=${num}`;

  renderSlide(0);
  setupKeyboardNav();
  setupButtonNav();
  setupTouchNav();
}

document.addEventListener("DOMContentLoaded", () => {
  const gateForm = document.getElementById("gate-form");
  if (gateForm) gateForm.addEventListener("submit", handleSiteLogin);

  if (isAuthenticated()) {
    showApp();
    initPresenter();
  } else {
    showAuthGate();
  }
});
