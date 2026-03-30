/* ══════════════════════════════════════════
   PERLE BLANCHE — script.js
   ══════════════════════════════════════════ */

/* ─────────────────────────────────────────
   LANGUAGE TOGGLE  (EN / NL)
   ───────────────────────────────────────── */
(function () {
  const STORAGE_KEY = 'pb-lang';
  const DEFAULT_LANG = 'en';
  const langBtns = document.querySelectorAll('.lang-btn');

  function applyLang(lang) {
    // Swap all [data-en] / [data-nl] elements
    document.querySelectorAll('[data-en]').forEach(function (el) {
      var text = el.getAttribute('data-' + lang);
      if (text !== null) el.innerHTML = text;
    });

    // Update button states
    langBtns.forEach(function (btn) {
      var isActive = btn.dataset.lang === lang;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });

    // Set html lang attribute
    document.documentElement.lang = lang === 'nl' ? 'nl' : 'en';
    localStorage.setItem(STORAGE_KEY, lang);
  }

  // Wire up buttons
  langBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyLang(btn.dataset.lang);
    });
  });

  // Init from localStorage or browser preference
  var saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    var browserLang = (navigator.language || '').toLowerCase();
    saved = browserLang.startsWith('nl') ? 'nl' : DEFAULT_LANG;
  }
  applyLang(saved);
})();


/* ─────────────────────────────────────────
   NAVBAR — add .scrolled class on scroll
   ───────────────────────────────────────── */
(function () {
  var navbar = document.getElementById('navbar');
  if (!navbar) return;

  function onScroll() {
    navbar.classList.toggle('scrolled', window.scrollY > 16);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load
})();


/* ─────────────────────────────────────────
   CAROUSEL
   ───────────────────────────────────────── */
(function () {
  var track      = document.getElementById('carouselTrack');
  var dotsWrap   = document.getElementById('carouselDots');
  var prevBtn    = document.getElementById('prevBtn');
  var nextBtn    = document.getElementById('nextBtn');

  if (!track || !dotsWrap || !prevBtn || !nextBtn) return;

  var slides      = Array.from(track.querySelectorAll('.carousel-slide'));
  var totalSlides = slides.length;
  var current     = 0;
  var autoTimer   = null;
  var AUTOPLAY_MS = 4200;

  /* ── How many slides are visible at once ── */
  function perView() {
    if (window.innerWidth < 480) return 1;
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  }

  function maxIndex() {
    return Math.max(0, totalSlides - perView());
  }

  /* ── Move carousel to position `idx` ── */
  function goTo(idx) {
    var max = maxIndex();
    current = Math.max(0, Math.min(idx, max));

    // Slide width = one slide's rendered width
    var slideW = slides[0].getBoundingClientRect().width;
    track.style.transform = 'translateX(-' + (current * slideW) + 'px)';

    updateDots();
  }

  /* ── Rebuild dot buttons ── */
  function updateDots() {
    var max = maxIndex();
    dotsWrap.innerHTML = '';

    for (var i = 0; i <= max; i++) {
      var dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === current ? ' active' : '');
      dot.setAttribute('aria-label', 'Slide ' + (i + 1));
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-selected', String(i === current));
      (function (index) {
        dot.addEventListener('click', function () {
          goTo(index);
          resetAutoplay();
        });
      }(i));
      dotsWrap.appendChild(dot);
    }
  }

  /* ── Autoplay ── */
  function startAutoplay() {
    autoTimer = setInterval(function () {
      goTo(current >= maxIndex() ? 0 : current + 1);
    }, AUTOPLAY_MS);
  }

  function resetAutoplay() {
    clearInterval(autoTimer);
    startAutoplay();
  }

  function pauseAutoplay() { clearInterval(autoTimer); }

  /* ── Arrow buttons ── */
  prevBtn.addEventListener('click', function () {
    goTo(current - 1);
    resetAutoplay();
  });
  nextBtn.addEventListener('click', function () {
    goTo(current + 1);
    resetAutoplay();
  });

  /* ── Pause on hover ── */
  track.addEventListener('mouseenter', pauseAutoplay);
  track.addEventListener('mouseleave', startAutoplay);

  /* ── Touch / swipe ── */
  var touchStartX = 0;
  var touchStartY = 0;

  track.addEventListener('touchstart', function (e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  track.addEventListener('touchend', function (e) {
    var dx = touchStartX - e.changedTouches[0].clientX;
    var dy = touchStartY - e.changedTouches[0].clientY;
    // Only treat as horizontal swipe if horizontal movement dominates
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 44) {
      goTo(dx > 0 ? current + 1 : current - 1);
      resetAutoplay();
    }
  }, { passive: true });

  /* ── Keyboard navigation ── */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft')  { goTo(current - 1); resetAutoplay(); }
    if (e.key === 'ArrowRight') { goTo(current + 1); resetAutoplay(); }
  });

  /* ── Recalculate on resize ── */
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { goTo(current); }, 120);
  }, { passive: true });

  /* ── Init ── */
  goTo(0);
  startAutoplay();
})();


/* ─────────────────────────────────────────
   SMOOTH APPEAR ANIMATION
   (intersection observer — no layout shift)
   ───────────────────────────────────────── */
(function () {
  // Inject keyframe once
  var style = document.createElement('style');
  style.textContent = [
    '@keyframes pbFadeUp {',
    '  from { opacity: 0; transform: translateY(22px); }',
    '  to   { opacity: 1; transform: translateY(0); }',
    '}',
    '.pb-reveal {',
    '  opacity: 0;',
    '}',
    '.pb-reveal.pb-visible {',
    '  animation: pbFadeUp 0.7s cubic-bezier(0.25,0.1,0.25,1) forwards;',
    '}'
  ].join('\n');
  document.head.appendChild(style);

  // Skip if browser doesn't support IntersectionObserver
  if (!('IntersectionObserver' in window)) return;
  // Skip for users who prefer reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var targets = document.querySelectorAll(
    '.about-visual, .about-text, .service-card, .portfolio-header, .contact-inner'
  );

  targets.forEach(function (el) { el.classList.add('pb-reveal'); });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('pb-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  targets.forEach(function (el) { observer.observe(el); });
})();
