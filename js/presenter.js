/* POM Tutorials - Presenter Mode
 *
 * Full-screen slide presentation for teaching tutorials.
 * Reads slide data from content.js and renders one slide at a time.
 * Navigation: Arrow keys, on-screen buttons, touch swipe.
 */

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

// ─── Slide Rendering ───
function renderSlide(index) {
  const slide = session.teachingSlides[index];
  const el = document.getElementById("slide-container");

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

  el.innerHTML = html;

  // Update counter
  document.getElementById("slide-counter").textContent = `${index + 1} / ${totalSlides}`;

  // Update progress bar
  const pct = totalSlides > 1 ? ((index) / (totalSlides - 1)) * 100 : 100;
  document.getElementById("progress-fill").style.width = pct + "%";
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
      case "f":
      case "F":
        if (e.target.tagName !== "INPUT") toggleFullscreen();
        break;
      case "Escape":
        if (document.fullscreenElement) {
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
