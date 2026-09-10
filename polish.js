/* Invisible Fence — front-end polish behaviours
   Progressive enhancement only: nothing here is required for the page to work. */
(() => {
  const q = (s, r = document) => r.querySelector(s);
  const qa = (s, r = document) => [...r.querySelectorAll(s)];
  document.documentElement.classList.add('js');

  /* 1. Skip link target safety */
  const main = q('main');
  if (main && !main.id) { main.id = 'main'; main.setAttribute('tabindex', '-1'); }

  /* 2. Mobile navigation */
  const nav = q('.site-nav');
  const toggle = q('.nav-toggle');
  if (nav && toggle) {
    const setOpen = (open) => {
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
    qa('.site-nav nav a').forEach(a => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
    matchMedia('(min-width:861px)').addEventListener('change', e => { if (e.matches) setOpen(false); });
  }

  /* 3. Current-section highlighting in the nav */
  const links = qa('.site-nav nav a[href^="#"]');
  const sections = links.map(a => q(a.getAttribute('href'))).filter(Boolean);
  if (sections.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(a => a.toggleAttribute('aria-current', q(a.getAttribute('href')) === entry.target));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => spy.observe(s));
  }

  /* 4. Reveal fallback — content must never stay invisible */
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion:reduce)').matches) {
    qa('.reveal').forEach(el => el.classList.add('in'));
  }
  setTimeout(() => qa('.reveal:not(.in)').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight) el.classList.add('in');
  }), 1200);

  /* 5. Announce live model values to screen readers */
  const live = document.createElement('p');
  live.className = 'sr-only';
  live.setAttribute('aria-live', 'polite');
  document.body.appendChild(live);
  const announce = (msg) => { live.textContent = msg; };

  const watch = (sel, label) => {
    const el = q(sel);
    if (!el) return;
    new MutationObserver(() => {
      el.classList.add('value-flash');
      setTimeout(() => el.classList.remove('value-flash'), 320);
      clearTimeout(watch._t);
      watch._t = setTimeout(() => announce(`${label} ${el.textContent}`), 400);
    }).observe(el, { childList: true, characterData: true, subtree: true });
  };
  watch('#projectedRisk', 'Projected risk');
  watch('#zoneScore', 'Zone risk score');
  watch('#zoneName', 'Selected zone');

  /* 6. Modal: focus trap + focus restore */
  const modal = q('#reportModal');
  if (modal) {
    let lastFocus = null;
    const focusables = () => qa('a[href],button,select,input,textarea,[tabindex]:not([tabindex="-1"])', modal)
      .filter(el => !el.disabled && el.offsetParent !== null);
    qa('[data-open-report]').forEach(b => b.addEventListener('click', () => { lastFocus = b; }));
    modal.addEventListener('keydown', e => {
      if (e.key !== 'Tab') return;
      const f = focusables();
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    new MutationObserver(() => {
      if (modal.getAttribute('aria-hidden') === 'true' && lastFocus) { lastFocus.focus(); lastFocus = null; }
    }).observe(modal, { attributes: true, attributeFilter: ['aria-hidden'] });
  }

  /* 7. Field reports stay visible in the demo session */
  const form = q('#reportForm');
  const sheet = q('.report-sheet');
  if (form && sheet) {
    const log = document.createElement('ul');
    log.className = 'report-log';
    log.setAttribute('aria-label', 'Signals added in this session');
    sheet.appendChild(log);
    form.addEventListener('submit', () => {
      const d = new FormData(form);
      const li = document.createElement('li');
      li.innerHTML = `<span>${d.get('count')} × ${d.get('animal')} · ${d.get('situation')}</span><b>${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</b>`;
      log.prepend(li);
      announce('Signal added to the demo model.');
    });
  }

  /* 8. Map shimmer stops once tiles are painted */
  const mapEl = q('#mainMap');
  if (mapEl) {
    const done = () => mapEl.classList.add('ready');
    new MutationObserver((m, o) => { if (mapEl.querySelector('canvas')) { done(); o.disconnect(); } })
      .observe(mapEl, { childList: true, subtree: true });
    setTimeout(done, 6000);
  }

  /* 9. Smooth anchor scrolling that respects reduced motion */
  qa('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const target = q(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({
      behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth',
      block: 'start'
    });
    if (target.tabIndex < 0) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }));
})();
