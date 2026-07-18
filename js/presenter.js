/* POM Tutorials - Presenter Mode
 *
 * Full-screen slide presentation for teaching tutorials.
 * Reads slide data from content.js and renders one slide at a time.
 * Navigation: Arrow keys, on-screen buttons, touch swipe.
 * Hint buttons: Interactive overlays for formulas, diagrams, reminders.
 * Slide Jump: Click the counter or press G to jump to any slide.
 * Themes: Each problem section has a distinct background color.
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
    input.setAttribute("aria-invalid", "false");
    error.textContent = "";
    sessionStorage.setItem("pom_auth", "true");
    showApp();
    initPresenter();
  } else {
    error.textContent = "Incorrect password. Please try again.";
    input.setAttribute("aria-invalid", "true");
    input.value = "";
    input.focus();
  }
}

// ─── Presenter State ───
let session = null;
let currentSlide = 0;
let totalSlides = 0;
let lastOverlayTrigger = null;

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
  let html = '<div class="hint-bar" aria-label="Optional slide hints">';
  hints.forEach((hint, i) => {
    html += `<button type="button" class="hint-btn" id="hint-button-${i}" onclick="toggleHint(this, ${i})" data-hint-index="${i}" aria-expanded="false" aria-controls="hint-panel-${i}">
      <span class="hint-icon" aria-hidden="true">${hint.icon || "\u{1F4A1}"}</span> ${hint.label}
    </button>`;
  });
  html += '</div><div class="hint-panels">';
  hints.forEach((hint, i) => {
    html += `<div class="hint-panel" id="hint-panel-${i}" role="region" aria-labelledby="hint-button-${i}" hidden>
      <div class="hint-panel-header">
        <span>${hint.icon || "\u{1F4A1}"} ${hint.label}</span>
        <button type="button" class="hint-close" onclick="closeHint(${i})" aria-label="Close hint">✕</button>
      </div>
      <div class="hint-panel-body">${hint.content}</div>
    </div>`;
  });
  html += '</div>';
  return html;
}

function toggleHint(btn, index) {
  const panel = document.getElementById("hint-panel-" + index);
  const isOpen = !panel.hidden;
  // Close all panels first
  document.querySelectorAll(".hint-panel").forEach(p => p.hidden = true);
  document.querySelectorAll(".hint-btn").forEach(b => {
    b.classList.remove("active");
    b.setAttribute("aria-expanded", "false");
  });
  if (!isOpen) {
    panel.hidden = false;
    btn.classList.add("active");
    btn.setAttribute("aria-expanded", "true");
    renderMath(panel);
    requestAnimationFrame(() => {
      panel.scrollIntoView({ block: "nearest", behavior: prefersReducedMotion() ? "auto" : "smooth" });
      updateScrollCue();
    });
  } else {
    requestAnimationFrame(updateScrollCue);
  }
}

function closeHint(index) {
  const panel = document.getElementById("hint-panel-" + index);
  const button = document.getElementById("hint-button-" + index);
  if (panel) panel.hidden = true;
  if (button) {
    button.classList.remove("active");
    button.setAttribute("aria-expanded", "false");
    button.focus({ preventScroll: true });
  }
  requestAnimationFrame(updateScrollCue);
}

// ─── Slide Jump / Go-To ───
function openSlideJump() {
  // Don't open if already open
  if (document.getElementById("slide-jump-overlay")) return;

  lastOverlayTrigger = document.activeElement;
  const overlay = document.createElement("div");
  overlay.id = "slide-jump-overlay";
  overlay.className = "slide-jump-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "slide-jump-title");
  overlay.tabIndex = -1;

  let gridHTML = '<div class="slide-jump-header"><h3 id="slide-jump-title">Jump to Slide</h3><button type="button" class="hint-close" onclick="closeSlideJump()" aria-label="Close slide navigator">\u2715</button></div>';
  gridHTML += '<div class="slide-jump-grid">';

  session.teachingSlides.forEach((slide, i) => {
    const isCurrent = (i === currentSlide) ? " current" : "";
    const themeClass = slide.theme ? " sj-" + slide.theme : "";
    const label = slide.title.length > 35 ? slide.title.substring(0, 33) + "\u2026" : slide.title;
    const typeIcon = { title: "\u{1F3AC}", concept: "\u{1F4D6}", formula: "\u{1F9EE}", step: "\u{1F4CB}", table: "\u{1F4CA}", diagram: "\u{1F5BC}" }[slide.type] || "\u{1F4C4}";
    gridHTML += `<button type="button" class="sj-item${isCurrent}${themeClass}" onclick="jumpToSlide(${i})" title="${slide.title}">
      <span class="sj-num">${i + 1}</span>
      <span class="sj-icon">${typeIcon}</span>
      <span class="sj-label">${label}</span>
    </button>`;
  });

  gridHTML += '</div>';
  overlay.innerHTML = gridHTML;
  document.querySelector(".presenter").appendChild(overlay);

  const currentItem = overlay.querySelector(".sj-item.current");
  (currentItem || overlay.querySelector(".hint-close")).focus();
}

function closeSlideJump(restoreFocus = true) {
  const overlay = document.getElementById("slide-jump-overlay");
  if (overlay) overlay.remove();
  if (restoreFocus && lastOverlayTrigger && document.contains(lastOverlayTrigger)) {
    lastOverlayTrigger.focus({ preventScroll: true });
  }
}

function jumpToSlide(index) {
  closeSlideJump(false);
  currentSlide = index;
  renderSlide(index);
  document.getElementById("slide-viewport").focus({ preventScroll: true });
}

// ─── Presenter Help ───
function openPresenterHelp() {
  if (document.getElementById("presenter-help-overlay")) return;

  lastOverlayTrigger = document.activeElement;
  document.getElementById("help-btn").setAttribute("aria-expanded", "true");

  const overlay = document.createElement("div");
  overlay.id = "presenter-help-overlay";
  overlay.className = "presenter-help-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "presenter-help-title");
  overlay.innerHTML = `
    <div class="presenter-help-dialog">
      <div class="slide-jump-header">
        <div>
          <span class="help-eyebrow">Interactive slides</span>
          <h3 id="presenter-help-title">Controls and study tips</h3>
        </div>
        <button type="button" class="hint-close" onclick="closePresenterHelp()" aria-label="Close presenter help">\u2715</button>
      </div>
      <div class="help-grid">
        <div><span class="help-keys"><kbd>\u2190</kbd><kbd>\u2192</kbd></span><strong>Change slide</strong><span>Use the arrow keys, the buttons below, or swipe horizontally.</span></div>
        <div><kbd>Space</kbd><strong>Read, then advance</strong><span>On a long slide, Space scrolls through the remaining content before moving forward.</span></div>
        <div><kbd>G</kbd><strong>Jump to a slide</strong><span>Open the complete slide navigator. You can also select the slide counter.</span></div>
        <div><kbd>F</kbd><strong>Present fullscreen</strong><span>Enter or leave fullscreen mode. Press Escape to close open panels first.</span></div>
        <div><span class="help-symbol">\u{1F4A1}</span><strong>Use hints deliberately</strong><span>Try the step yourself first, then open a hint for a formula, diagram, check, or common trap.</span></div>
        <div><span class="help-symbol">\u2193</span><strong>Watch for “More below”</strong><span>Some worked examples need vertical scrolling; the cue disappears once you reach the end.</span></div>
      </div>
    </div>`;
  document.querySelector(".presenter").appendChild(overlay);
  overlay.querySelector(".hint-close").focus();
}

function closePresenterHelp() {
  const overlay = document.getElementById("presenter-help-overlay");
  if (overlay) overlay.remove();
  const helpButton = document.getElementById("help-btn");
  if (helpButton) helpButton.setAttribute("aria-expanded", "false");
  if (lastOverlayTrigger && document.contains(lastOverlayTrigger)) {
    lastOverlayTrigger.focus({ preventScroll: true });
  }
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function updateScrollCue() {
  const viewport = document.getElementById("slide-viewport");
  const cue = document.getElementById("scroll-cue");
  if (!viewport || !cue) return;
  const hasMore = viewport.scrollTop + viewport.clientHeight < viewport.scrollHeight - 8;
  cue.classList.toggle("visible", hasMore);
}

function resetSlideScroll() {
  const viewport = document.getElementById("slide-viewport");
  if (viewport) viewport.scrollTop = 0;
}

function updateNavigationState() {
  const prev = document.getElementById("prev-btn");
  const next = document.getElementById("next-btn");
  if (!prev || !next) return;
  prev.disabled = currentSlide === 0;
  next.disabled = currentSlide === totalSlides - 1;
  prev.setAttribute("aria-disabled", String(prev.disabled));
  next.setAttribute("aria-disabled", String(next.disabled));
}

function scrollOrAdvance() {
  const viewport = document.getElementById("slide-viewport");
  const hasMore = viewport && viewport.scrollTop + viewport.clientHeight < viewport.scrollHeight - 8;
  if (hasMore) {
    viewport.scrollBy({
      top: Math.max(180, viewport.clientHeight * .72),
      behavior: prefersReducedMotion() ? "auto" : "smooth"
    });
  } else {
    nextSlide();
  }
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
  el.setAttribute("role", "group");
  el.setAttribute("aria-roledescription", "slide");
  el.setAttribute("aria-label", `Slide ${index + 1} of ${totalSlides}: ${slide.title}`);

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
  const counter = document.getElementById("slide-counter");
  counter.textContent = `${index + 1} / ${totalSlides}`;
  counter.setAttribute("aria-label", `Slide ${index + 1} of ${totalSlides}. Open slide navigator`);

  // Update progress bar
  const pct = totalSlides > 1 ? ((index) / (totalSlides - 1)) * 100 : 100;
  document.getElementById("progress-fill").style.width = pct + "%";
  const progress = document.getElementById("progress-bar");
  progress.setAttribute("aria-valuemax", String(totalSlides));
  progress.setAttribute("aria-valuenow", String(index + 1));
  progress.setAttribute("aria-valuetext", `Slide ${index + 1} of ${totalSlides}`);

  renderMath(el);
  updateNavigationState();
  resetSlideScroll();
  requestAnimationFrame(updateScrollCue);
}

function nextSlide() {
  if (currentSlide < totalSlides - 1) {
    currentSlide++;
    renderSlide(currentSlide);
  }
}

function prevSlide() {
  if (currentSlide > 0) {
    currentSlide--;
    renderSlide(currentSlide);
  }
}

// ─── Keyboard Navigation ───
function setupKeyboardNav() {
  document.addEventListener("keydown", (e) => {
    const helpOverlay = document.getElementById("presenter-help-overlay");
    if (helpOverlay) {
      if (e.key === "Escape") {
        closePresenterHelp();
        e.preventDefault();
      }
      return;
    }

    const jumpOverlay = document.getElementById("slide-jump-overlay");
    if (jumpOverlay) {
      if (e.key === "Escape") {
        closeSlideJump();
        e.preventDefault();
      }
      return; // Don't process other keys when jump is open
    }

    const interactiveTarget = e.target.closest && e.target.closest("button, a, input, textarea, select");
    if (interactiveTarget && (e.key === " " || e.key === "Enter")) return;

    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        nextSlide();
        break;
      case " ":
        e.preventDefault();
        scrollOrAdvance();
        break;
      case "ArrowLeft":
        e.preventDefault();
        prevSlide();
        break;
      case "ArrowDown":
      case "PageDown":
        e.preventDefault();
        document.getElementById("slide-viewport").scrollBy({ top: 220, behavior: prefersReducedMotion() ? "auto" : "smooth" });
        break;
      case "ArrowUp":
      case "PageUp":
        e.preventDefault();
        document.getElementById("slide-viewport").scrollBy({ top: -220, behavior: prefersReducedMotion() ? "auto" : "smooth" });
        break;
      case "Home":
        if (!interactiveTarget) {
          e.preventDefault();
          currentSlide = 0;
          renderSlide(currentSlide);
        }
        break;
      case "End":
        if (!interactiveTarget) {
          e.preventDefault();
          currentSlide = totalSlides - 1;
          renderSlide(currentSlide);
        }
        break;
      case "g":
      case "G":
        if (!interactiveTarget) {
          e.preventDefault();
          openSlideJump();
        }
        break;
      case "f":
      case "F":
        if (!interactiveTarget) toggleFullscreen();
        break;
      case "?":
        if (!interactiveTarget) {
          e.preventDefault();
          openPresenterHelp();
        }
        break;
      case "Escape":
        // Close hints first, then exit fullscreen, then exit presenter
        const openHint = document.querySelector(".hint-panel:not([hidden])");
        if (openHint) {
          closeHint(parseInt(openHint.id.replace("hint-panel-", ""), 10));
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
  document.getElementById("slide-counter").addEventListener("click", openSlideJump);
  document.getElementById("slide-counter").title = "Click to jump to any slide (or press G)";
  document.getElementById("help-btn").addEventListener("click", openPresenterHelp);
  document.getElementById("slide-viewport").addEventListener("scroll", updateScrollCue, { passive: true });
  window.addEventListener("resize", updateScrollCue);
  document.addEventListener("fullscreenchange", updateFullscreenButton);
}

// ─── Touch/Swipe Navigation ───
function setupTouchNav() {
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartedInHorizontalScroller = false;

  document.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    const scrollable = e.target.closest && e.target.closest(".slide-body, .formula-box, .hint-panel-body");
    touchStartedInHorizontalScroller = Boolean(scrollable && scrollable.scrollWidth > scrollable.clientWidth + 4);
  }, { passive: true });

  document.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    const dy = e.changedTouches[0].screenY - touchStartY;
    // Only trigger if horizontal swipe is dominant and > 50px
    if (!touchStartedInHorizontalScroller && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
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

function updateFullscreenButton() {
  const button = document.getElementById("fullscreen-btn");
  if (!button) return;
  const active = Boolean(document.fullscreenElement);
  button.setAttribute("aria-pressed", String(active));
  button.innerHTML = active ? "&#9974; Exit fullscreen" : "&#9974; Fullscreen";
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
  updateFullscreenButton();
}

document.addEventListener("DOMContentLoaded", () => {
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
    initPresenter();
  } else {
    showAuthGate();
    if (gateInput) gateInput.focus();
  }
});
