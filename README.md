# Patrick Toohey — Portfolio

A static, hand-built portfolio site. Plain HTML, CSS, and JavaScript — no frameworks, no build step.

This README is your owner's manual. Read it once and you'll be able to maintain the site without any AI assistance.

---

## How to view it locally

You have two options:

**Option A — Just open the file**
Double-click `index.html`. It will open in your browser. The site works for browsing, but the password gate's `localStorage` may behave inconsistently across `file://` URLs in some browsers.

**Option B — Run a tiny local server (recommended)**
In Terminal, navigate to this folder and run:

```bash
cd ~/patrick2ee.github.io
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser. Press `Ctrl+C` in the Terminal to stop it.

---

## How to publish to the web (one-time setup)

1. Open **GitHub Desktop**.
2. **File → Add Local Repository** → choose this folder (`patrick2ee.github.io`).
3. GitHub Desktop will say "this directory does not appear to be a Git repository — create one?" → click **Create a Repository**.
4. Write an initial commit message ("Initial portfolio commit") and click **Commit to main**.
5. Click **Publish repository** in the top-right.
   - **IMPORTANT:** repository name must be exactly `patrick2ee.github.io`
   - **Uncheck** "Keep this code private" (GitHub Pages free tier requires public)
   - Click **Publish**
6. In a browser, go to `https://github.com/patrick2ee/patrick2ee.github.io` → **Settings** → **Pages** (left sidebar).
   - Source: **Deploy from a branch**
   - Branch: **main** / folder: **/ (root)**
   - Click **Save**.
7. Wait ~1 minute. Your site will be live at **https://patrick2ee.github.io**.

---

## How to update the site

Whenever you change a file:

1. Save the file.
2. Open GitHub Desktop. You'll see your changes listed.
3. Write a short summary of the change ("Updated CS1 numbers", "Added new case study").
4. Click **Commit to main**, then **Push origin**.
5. The live site updates within ~30 seconds.

---

## File map

```
patrick2ee.github.io/
├── index.html           # Home page
├── unlock.html          # Password gate
├── about.html           # Bio, resume, contact form
├── cs/
│   ├── dq-reactivation.html      # Case Study 1
│   ├── module-library.html       # Case Study 2 (horizontal timeline)
│   ├── case-study-3.html         # Placeholder
│   ├── case-study-4.html         # Placeholder
│   └── case-study-5.html         # Placeholder
├── assets/
│   ├── css/styles.css   # All styling — one file
│   ├── js/main.js       # Password gate + animations
│   └── images/          # Drop your images here
└── README.md            # This file
```

---

## Common tasks

### Change the password
Open `assets/js/main.js`, find the line:
```js
var PASSWORD = 'clover';
```
Change `'clover'` to your new password. Save, commit, push.

(After changing, you may also want to run `PT_lock()` in your browser's dev console to clear the old unlock and test the new one.)

### Change the colors or fonts
Open `assets/css/styles.css`. The first section, **DESIGN TOKENS**, has all the colors and font choices as CSS variables (`--bg`, `--accent`, etc.). Change the values there and the entire site updates.

### Update case study numbers
Each case study has its impact stats near the top, inside a block marked `<!-- IMPACT STAT -->`. Edit the `<div class="impact__num">` values directly.

### Add a new case study
Easiest path: copy `cs/case-study-3.html`, rename it (e.g. `cs/onboarding-revamp.html`), edit the content, then update the link in `index.html` (look for the matching placeholder `work-card`).

### Activate the contact form
1. Sign up at [Formspree](https://formspree.io) (free tier).
2. Create a new form, copy your form ID.
3. In `about.html`, find `YOUR_FORMSPREE_ID` and replace it with your actual ID.

### Stop search engines from indexing
Already handled — every page includes `<meta name="robots" content="noindex, nofollow" />`. As long as you don't link to the site from a public page (LinkedIn, Twitter), it stays effectively unlisted.

---

## On the password gate

The gate is **client-side only** — meaning the password check happens in the visitor's browser, not on a server. Anyone with browser dev tools can bypass it in under a minute. This is intentional and called out in `assets/js/main.js`. It exists to deter casual browsing and signal confidentiality, not to provide real security.

If you ever need real protection, the path is: migrate hosting from GitHub Pages to Cloudflare Pages or Netlify (both free, both deploy from this same GitHub repo) and use their built-in password protection. Roughly a one-hour migration.

---

## Tech stack

- HTML5
- CSS (custom properties + flex/grid, no preprocessor)
- Vanilla JavaScript (no jQuery, no frameworks, no build step)
- [Google Fonts](https://fonts.google.com): Source Serif 4 + Inter
- [GitHub Pages](https://pages.github.com) for hosting
- [Formspree](https://formspree.io) for the contact form (free tier)
