/* Presentation only. Products, stock, cart, checkout and orders are WooCommerce-owned. */
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const toggle = (button, panel, cls) => {
    if (!button || !panel) return;
    button.addEventListener('click', () => button.setAttribute('aria-expanded', String(panel.classList.toggle(cls))));
  };
  toggle($('#mobile-menu'), $('.main-nav'), 'mobile-open');
  toggle($('#mega-toggle'), $('#mega-menu'), 'open');
  toggle($('#filter-toggle'), $('#shop-filters'), 'open');
  // Page content imported from the approved static source can contain <span data-icon="…">.
  // Fill those with the same inline SVG set the source used so styling stays identical.
  if (!window.mhtIcons) {
    const paths = window.mhtIconPaths || {};
    $$('[data-icon]').forEach((el) => {
      const name = el.dataset.icon;
      if (paths[name]) {
        el.innerHTML = `<svg class="icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
      }
    });
    window.mhtIcons = true;
  }
  const closeMenus = () => {
    $('#mega-menu')?.classList.remove('open');
    $('.main-nav')?.classList.remove('mobile-open');
    $('#mega-toggle')?.setAttribute('aria-expanded', 'false');
    $('#mobile-menu')?.setAttribute('aria-expanded', 'false');
  };
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenus(); });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.category-menu') && !e.target.closest('#mobile-menu')) {
      $('#mega-menu')?.classList.remove('open');
      $('#mega-toggle')?.setAttribute('aria-expanded', 'false');
    }
    const quick = e.target.closest('[data-quick-id]');
    if (quick) {
      const template = quick.closest('.product-visual').querySelector('template');
      const dialog = $('#mht-quick-dialog');
      if (!template || !dialog) return;
      $('#mht-quick-content').replaceChildren(template.content.cloneNode(true));
      dialog.showModal();
    }
  });
  $('#mht-quick-dialog .dialog-close')?.addEventListener('click', () => $('#mht-quick-dialog').close());
  $$('[data-scroll]').forEach((b) => b.addEventListener('click', () => {
    const rail = document.getElementById(b.dataset.scroll);
    rail?.scrollBy({ left: Number(b.dataset.direction) * rail.clientWidth * .8, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }));
  // Cart quantity steppers: mirror the source's +/− buttons by driving the real
  // WooCommerce cart form field and letting WooCommerce's own update button submit.
  const cartForm = $('form.woocommerce-cart-form');
  if (cartForm) {
    cartForm.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-mht-qty]');
      if (!btn) return;
      const row = btn.closest('.cart-item');
      const input = row?.querySelector('input.qty');
      if (!input) return;
      const step = Number(btn.dataset.mhtQty) || 0;
      const min = Number(input.min || 1);
      const max = Number(input.max || 0);
      let next = (Number(input.value) || min) + step;
      if (next < min) next = min;
      if (max > 0 && next > max) next = max;
      input.value = next;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      const submit = cartForm.querySelector('[name="update_cart"]');
      if (submit) submit.disabled = false;
      if (typeof cartForm.requestSubmit === 'function') cartForm.requestSubmit(submit || undefined);
      else cartForm.submit();
    });
  }

  const hero = $('.hero');
  if (hero?.dataset.slides) {
    let slides;
    try { slides = JSON.parse(hero.dataset.slides); } catch { return; }
    if (!Array.isArray(slides) || !slides.length) return;
    let current = 0, paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dots = $('#hero-dots');
    slides.forEach((_, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('aria-label', `اسلاید ${(i + 1).toLocaleString('fa-IR')}`);
      b.addEventListener('click', () => show(i)); dots.append(b);
    });
    // HTML is restricted server-side to br/span in Customizer; no user input is interpolated here.
    function show(i) {
      current = (i + slides.length) % slides.length;
      const s = slides[current];
      hero.className = 'hero ' + s.class;
      hero.style.backgroundImage = s.image ? `url(${JSON.stringify(s.image)})` : '';
      $('.hero .eyebrow').innerHTML = '<i></i>' + s.eyebrow;
      $('.hero h1').innerHTML = s.title;
      $('.hero p').innerHTML = s.body;
      $('#hero-link').href = s.link;
      $('#hero-link').textContent = s.cta + ' ←';
      $('#hero-index').textContent = (current + 1).toLocaleString('fa-IR', { minimumIntegerDigits: 2 }) + ' / ' + slides.length.toLocaleString('fa-IR', { minimumIntegerDigits: 2 });
      [...dots.children].forEach((b, n) => { b.classList.toggle('active', n === current); b.setAttribute('aria-pressed', String(n === current)); });
    }
    function pauseLabel() {
      $('#hero-pause').textContent = paused ? '▶' : 'Ⅱ';
      $('#hero-pause').setAttribute('aria-label', paused ? 'پخش اسلایدر' : 'توقف اسلایدر');
    }
    $('#hero-prev').addEventListener('click', () => show(current - 1));
    $('#hero-next').addEventListener('click', () => show(current + 1));
    $('#hero-pause').addEventListener('click', () => { paused = !paused; pauseLabel(); });
    setInterval(() => { if (!paused && !document.hidden && !hero.matches(':hover,:focus-within')) show(current + 1); }, 7500);
    show(0); pauseLabel();
  }
})();
