# POM Tutorials - INSEAD MBA

> **🔗 Live Site: [https://stefanospoulidis.github.io/pom-tutorials/](https://stefanospoulidis.github.io/pom-tutorials/)**

Interactive static website for Process & Operations Management tutorial sessions, plus a public Newsvendor Challenge. Built for GitHub Pages with a client-side password gate for tutorial content.

## Quick Start

1. Push this folder to a GitHub repo
2. Enable GitHub Pages (see `deploy.md`)
3. Share the live URL above with students

## Project Structure

```
pom-tutorials/
├── index.html          ← Dashboard (renders from content.js)
├── session.html        ← Session page template (renders from content.js)
├── newsvendor-game.html← Public Newsvendor Challenge
├── css/style.css       ← All styles
├── js/
│   ├── config.js       ← Password hash (edit to change password)
│   ├── content.js      ← ALL session data — edit this to update content
│   └── app.js          ← Rendering logic (don't need to touch)
├── assets/
│   └── session1/       ← PDFs for session 1
│       ├── POM Tutorial 1.pdf
│       ├── Recipe 1_Process Improvement.pdf
│       ├── Review Sheet 1.pdf
│       └── Review Sheet 1_Solutions.pdf
├── README.md
└── deploy.md
```

## How to Add a New Session

**You only edit `js/content.js`.** No HTML changes needed.

### Step 1: Drop your PDFs into `assets/sessionN/`

```
assets/session2/
├── slides.pdf
├── review-sheet.pdf
└── solutions.pdf
```

### Step 2: Update the session entry in `js/content.js`

Find the session object (e.g., session 2) and change:

```js
{
  number: 2,
  topic: "Managing Variability",
  status: "available",               // ← change from "coming-soon"
  summary: "Your 2-3 sentence description here.",
  slides: "assets/session2/slides.pdf",
  recipe: null,                      // or a path if you have one
  reviewSheet: "assets/session2/review-sheet.pdf",
  solutions: "assets/session2/solutions.pdf",
  problems: [
    {
      title: "Problem Name",
      difficulty: "**",
      parts: [
        "Part a description",
        "Part b description"
      ]
    }
  ],
  readings: [
    { label: "Article Title", url: "https://example.com" }
  ]
}
```

### Step 3: Commit and push

```bash
git add -A && git commit -m "Add session 2 materials" && git push
```

GitHub Pages will update automatically within a minute.

## How to Change the Password

1. Pick your new password
2. Generate the SHA-256 hash:
   ```bash
   echo -n "YOUR_NEW_PASSWORD" | shasum -a 256
   ```
3. Open `js/config.js` and replace the `passwordHash` value
4. Commit and push

Share the password with students through an appropriate private course channel. Do not add it to this public repository or display it on the login screen.

## How It Works

- `index.html` and `session.html` are thin HTML shells
- `content.js` holds ALL session data (topics, PDFs, problems, readings)
- `app.js` reads `content.js` and renders everything dynamically
- `session.html?s=1` renders Session 1, `?s=2` renders Session 2, etc.
- Password is hashed client-side with SHA-256 and compared against the stored hash
- On correct entry, `sessionStorage` remembers the auth so students don't re-enter during the same browser session
- The Newsvendor Challenge is a public page and does not load the password configuration or tutorial content

> **Security note:** A client-side gate on a static GitHub Pages site deters casual browsing, but it cannot make repository files or direct asset URLs private. Confidential or licence-restricted materials require authenticated hosting such as the institution's learning platform.

## Tech Stack

- Pure HTML / CSS / JavaScript — no build tools, no frameworks
- Mobile-responsive
- INSEAD-inspired color scheme (navy + teal + white)
