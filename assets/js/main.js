/* ============================================================
   Patrick Toohey — Portfolio
   main.js handles three things:
     1. The password gate (soft / client-side)
     2. The unlock form submission
     3. A tiny "scroll to reveal" animation for case study sections

   IMPORTANT NOTE ON THE PASSWORD GATE:
   This is a *client-side* password check. It is intentionally
   easy to bypass for anyone with browser dev tools — it exists
   to deter casual browsing and signal confidentiality, NOT to
   provide real security. Do not put any content here that you
   would not be comfortable becoming public.
   ============================================================ */

(function () {
  'use strict';

  // The shared password. Change this string to rotate the password.
  // (You only need to update this one line.)
  var PASSWORD = 'clover';

  // The localStorage key we use to remember the unlock between visits.
  var KEY = 'pt_unlocked';

  /* ----- 1. Gate check (runs on protected pages) -----
     Pages that need protection include this snippet via main.js.
     We expose `window.PT_protect()` so each page can call it
     after setting the right relative path to unlock.html. */
  window.PT_protect = function (unlockPath) {
    if (localStorage.getItem(KEY) !== 'true') {
      window.location.replace(unlockPath || 'unlock.html');
    }
  };

  /* ----- 2. Unlock form submission -----
     unlock.html includes a form with id="unlock-form".
     On submit, check the password; if correct, set the flag
     and redirect home. If wrong, show an error message. */
  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('unlock-form');
    if (form) {
      var input = document.getElementById('unlock-input');
      var error = document.getElementById('unlock-error');

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (input.value === PASSWORD) {
          localStorage.setItem(KEY, 'true');
          window.location.replace('index.html');
        } else {
          error.textContent = 'That password is incorrect.';
          input.value = '';
          input.focus();
        }
      });
    }

    /* ----- 3. Scroll reveal -----
       Any element with the class .reveal will fade in
       once it scrolls into view. */
    var revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && revealEls.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      // Fallback: if the browser doesn't support IntersectionObserver,
      // just show everything immediately.
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    }
  });

  /* ----- 4. Carousel controls -----
     Any element with [data-carousel] becomes a scrollable carousel.
     Sibling buttons with [data-carousel-prev] and [data-carousel-next]
     scroll it one card-width at a time. The buttons auto-disable at
     either end. Trackpad/touch users can still drag/swipe natively. */
  document.addEventListener('DOMContentLoaded', function () {
    var carousels = document.querySelectorAll('[data-carousel]');
    carousels.forEach(function (track) {
      var wrap = track.parentElement;
      var prev = wrap.querySelector('[data-carousel-prev]');
      var next = wrap.querySelector('[data-carousel-next]');
      if (!prev || !next) return;

      // Compute how far to scroll: one card + the gap between cards
      var stepSize = function () {
        var card = track.querySelector(':scope > *');
        if (!card) return track.clientWidth * 0.8;
        var styles = getComputedStyle(track);
        var gap = parseInt(styles.columnGap || styles.gap || '0', 10);
        return card.offsetWidth + gap;
      };

      prev.addEventListener('click', function () {
        track.scrollBy({ left: -stepSize(), behavior: 'smooth' });
      });
      next.addEventListener('click', function () {
        track.scrollBy({ left: stepSize(), behavior: 'smooth' });
      });

      // Disable each button when there's nothing more to scroll in that direction
      var updateButtons = function () {
        var atStart = track.scrollLeft <= 1;
        var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
        prev.disabled = atStart;
        next.disabled = atEnd;
      };
      track.addEventListener('scroll', updateButtons, { passive: true });
      window.addEventListener('resize', updateButtons);
      // Run once on load (and again shortly after, once images have loaded
      // and the scrollWidth has settled)
      updateButtons();
      setTimeout(updateButtons, 300);
    });
  });

  /* ----- 5. Lightbox -----
     Any image inside a [data-carousel] becomes clickable: a single
     full-screen viewer (a "lightbox") opens with the enlarged image,
     a close button, ESC-to-close, and backdrop-click-to-close.
     The lightbox markup is injected once on first page load —
     so there's no HTML to add to individual pages. */
  document.addEventListener('DOMContentLoaded', function () {
    var triggers = document.querySelectorAll('[data-carousel] img');
    if (!triggers.length) return;

    // Build the lightbox markup once and append to <body>
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Image viewer');
    lb.innerHTML =
      '<button class="lightbox__close" type="button" aria-label="Close image viewer">&times;</button>' +
      '<button class="lightbox__nav lightbox__nav--prev" type="button" aria-label="Previous image">&#8249;</button>' +
      '<img class="lightbox__img" alt="" />' +
      '<button class="lightbox__nav lightbox__nav--next" type="button" aria-label="Next image">&#8250;</button>' +
      '<p class="lightbox__caption"></p>';
    document.body.appendChild(lb);

    var lbImg = lb.querySelector('.lightbox__img');
    var lbCap = lb.querySelector('.lightbox__caption');
    var lbClose = lb.querySelector('.lightbox__close');
    var lbPrev = lb.querySelector('.lightbox__nav--prev');
    var lbNext = lb.querySelector('.lightbox__nav--next');
    var lastFocus = null;     // remember what was focused before opening

    // Track which carousel we're viewing and where we are in it
    var currentSet = [];
    var currentIdx = 0;

    // Render the image at currentIdx (wraps around with modulo math)
    var showAt = function (idx) {
      if (!currentSet.length) return;
      var n = currentSet.length;
      currentIdx = ((idx % n) + n) % n;     // handles negative indices too
      var img = currentSet[currentIdx];
      var fig = img.closest('figure');
      var capEl = fig ? fig.querySelector('figcaption') : null;
      lbImg.src = img.src;
      lbImg.alt = img.alt || '';
      lbCap.textContent = capEl ? capEl.textContent : '';
    };

    var openLB = function (triggerImg) {
      lastFocus = document.activeElement;
      // Scope the lightbox session to the carousel that was clicked.
      // Arrow nav cycles within THIS carousel, not all images on the page.
      var carousel = triggerImg.closest('[data-carousel]');
      currentSet = carousel
        ? Array.prototype.slice.call(carousel.querySelectorAll('img'))
        : [triggerImg];
      currentIdx = currentSet.indexOf(triggerImg);
      if (currentIdx < 0) currentIdx = 0;

      // Hide nav arrows if there's only one image in this carousel
      var multi = currentSet.length > 1;
      lbPrev.hidden = !multi;
      lbNext.hidden = !multi;

      showAt(currentIdx);
      lb.classList.add('is-open');
      document.body.classList.add('no-scroll');
      lbClose.focus();
    };

    var closeLB = function () {
      lb.classList.remove('is-open');
      document.body.classList.remove('no-scroll');
      lbImg.src = '';        // free the image so memory isn't held
      currentSet = [];
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };

    // Wire up each carousel image
    triggers.forEach(function (img) {
      img.addEventListener('click', function () { openLB(img); });
    });

    // Close on X click
    lbClose.addEventListener('click', closeLB);
    // Prev/next click
    lbPrev.addEventListener('click', function () { showAt(currentIdx - 1); });
    lbNext.addEventListener('click', function () { showAt(currentIdx + 1); });
    // Close on backdrop click (but not when clicking the image or any button)
    lb.addEventListener('click', function (e) {
      if (e.target === lb) closeLB();
    });
    // Keyboard: ESC closes, arrows navigate
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLB();
      else if (e.key === 'ArrowLeft')  showAt(currentIdx - 1);
      else if (e.key === 'ArrowRight') showAt(currentIdx + 1);
    });
  });

  /* ----- 6. Snippet cards (Module Library case study) -----
     Each .snippet card has a <pre><code data-snippet-src="ID"></code></pre>.
     The raw code lives in a sibling <script type="text/template" id="ID">.
     This script element is "inert" — the browser doesn't parse its
     contents as HTML — so you can paste raw markup directly into it
     without escaping <, >, etc.

     On load we read that text, run a tiny syntax highlighter over it,
     and inject the result into the <code>. A toggle button expands or
     collapses the code block. */
  document.addEventListener('DOMContentLoaded', function () {

    // 1. Render code from each <script type="text/template"> into its <code>
    var stash = [];
    function stashSpan(token, cls) {
      stash.push('<span class="hl-' + cls + '">' + token + '</span>');
      return '\x01' + (stash.length - 1) + '\x01';
    }
    function escapeHTML(s) {
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    /* Highlighter — uses a "stash and substitute" trick so each regex
       only operates on the raw user text, never on our injected spans.
       Order matters: comments first (so HTML inside comments isn't
       tag-highlighted), then conditionals before literal handlebars
       (so {{#if x}} doesn't get caught by the literal regex). */
    function highlight(raw) {
      stash.length = 0;
      var s = escapeHTML(raw);
      // Comments: <!-- ... -->  (matches MSO conditional blocks too)
      s = s.replace(/&lt;!--[\s\S]*?--&gt;/g, function (m) { return stashSpan(m, 'comment'); });
      // Handlebars block helpers: {{#if x}}, {{/if}}, {{else}}
      s = s.replace(/\{\{[#\/][^{}]*\}\}+|\{\{else\}\}/g, function (m) { return stashSpan(m, 'hbs-cond'); });
      // Handlebars literal variables: {{var}}, {{{link}}}
      s = s.replace(/\{\{[^{}]*\}\}+/g, function (m) { return stashSpan(m, 'hbs-lit'); });
      // Attribute values: ="..."
      s = s.replace(/="[^"]*"/g, function (m) { return '=' + stashSpan(m.slice(1), 'str'); });
      // HTML tag names: <tag, </tag
      s = s.replace(/(&lt;\/?)([a-zA-Z][\w-]*)/g, function (m, lt, name) { return lt + stashSpan(name, 'tag'); });
      // Substitute placeholders back, iteratively (spans may contain placeholders)
      while (s.indexOf('\x01') !== -1) {
        s = s.replace(/\x01(\d+)\x01/g, function (m, i) { return stash[Number(i)]; });
      }
      return s;
    }

    document.querySelectorAll('[data-snippet-src]').forEach(function (codeEl) {
      var src = document.getElementById(codeEl.getAttribute('data-snippet-src'));
      if (!src) return;
      // Trim leading/trailing blank lines that come from <script> formatting
      var text = src.textContent.replace(/^\s*\n|\n\s*$/g, '');
      codeEl.innerHTML = highlight(text);
    });

    // 2. Wire up expand/collapse buttons
    document.querySelectorAll('[data-snippet-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var card = btn.closest('.snippet');
        if (!card) return;
        var isOpen = card.classList.toggle('is-open');
        btn.innerHTML = isOpen
          ? 'Collapse <span aria-hidden="true">&uarr;</span>'
          : 'View full code <span aria-hidden="true">&darr;</span>';
      });
    });
  });

  /* ----- Bonus: a tiny helper to lock the site again, e.g. from console.
     Run `PT_lock()` in dev tools to clear the unlock flag. */
  window.PT_lock = function () {
    localStorage.removeItem(KEY);
    console.log('Locked. Reload to see the unlock screen.');
  };
})();
