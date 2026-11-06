/* Second Thought — interactions (vanilla JS, no dependencies) */
(function () {
  'use strict';

  var STORAGE_KEY = 'st-entered';
  var welcome = document.getElementById('welcome');
  var onepager = document.getElementById('onepager');

  function storage(action, value) {
    try {
      if (action === 'get') return sessionStorage.getItem(STORAGE_KEY);
      if (action === 'set') sessionStorage.setItem(STORAGE_KEY, value);
      if (action === 'remove') sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* storage unavailable — ignore */ }
    return null;
  }

  /* ---------- Welcome → one pager ---------- */
  function showOnepager(scrollTop) {
    welcome.hidden = true;
    onepager.hidden = false;
    if (scrollTop) window.scrollTo(0, 0);
    document.title = 'Second Thought — think twice. act once.';
  }

  // Code validation is intentionally disabled for now (GitHub Pages preview).
  // On Netlify this is where the call to /.netlify/functions/validate-code will go.
  document.getElementById('code-form').addEventListener('submit', function (e) {
    e.preventDefault();
    storage('set', '1');
    showOnepager(true);
  });

  if (storage('get') === '1' || location.hash === '#start') {
    showOnepager(false);
  }

  /* ---------- Language toggle (visual only for now) ---------- */
  document.querySelectorAll('[aria-label="Język"]').forEach(function (group) {
    var buttons = group.querySelectorAll('button');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      });
    });
  });

  /* ---------- Sticky nav + mobile menu ---------- */
  var nav = document.getElementById('nav');
  var toggle = nav.querySelector('.nav__toggle');

  function onScroll() { nav.classList.toggle('is-scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    nav.classList.toggle('is-menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  }
  toggle.addEventListener('click', function () { setMenu(!nav.classList.contains('is-menu-open')); });
  nav.querySelectorAll('.nav__links a').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });

  /* ---------- Accordion ---------- */
  document.querySelectorAll('.accordion__trigger').forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      var item = trigger.closest('.accordion__item');
      var willOpen = !item.classList.contains('is-open');
      item.classList.toggle('is-open', willOpen);
      trigger.setAttribute('aria-expanded', String(willOpen));
    });
  });

  /* ---------- Modals (pop-ups) ---------- */
  var activeModal = null;
  var lastFocus = null;
  var FOCUSABLE = 'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])';

  function openModal(id, focusId) {
    var modal = document.getElementById(id);
    if (!modal) return;
    if (activeModal) closeModal(true);
    lastFocus = document.activeElement;
    activeModal = modal;
    modal.classList.add('is-open');
    document.body.classList.add('is-locked');
    modal.querySelector('.modal__body').scrollTop = 0;

    window.setTimeout(function () {
      var target = focusId ? document.getElementById(focusId) : null;
      if (target) {
        target.scrollIntoView({ block: 'center' });
        target.focus({ preventScroll: true });
      } else {
        modal.querySelector('[data-modal-close]').focus();
      }
    }, 50);
  }

  function closeModal(silent) {
    if (!activeModal) return;
    activeModal.classList.remove('is-open');
    activeModal = null;
    document.body.classList.remove('is-locked');
    if (!silent && lastFocus) lastFocus.focus();
  }

  document.querySelectorAll('[data-modal-open]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      openModal(btn.getAttribute('data-modal-open'), btn.getAttribute('data-focus'));
    });
  });

  document.querySelectorAll('.modal').forEach(function (modal) {
    modal.querySelectorAll('[data-modal-close]').forEach(function (btn) {
      btn.addEventListener('click', function () { closeModal(); });
    });
    // close when clicking the dark backdrop
    modal.addEventListener('mousedown', function (e) {
      if (e.target === modal) closeModal();
    });
  });

  document.addEventListener('keydown', function (e) {
    if (!activeModal) return;
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key === 'Tab') {
      var items = Array.prototype.filter.call(
        activeModal.querySelectorAll(FOCUSABLE),
        function (el) { return el.offsetParent !== null; }
      );
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- Sign-up form (inactive for now) ---------- */
  var signup = document.getElementById('signup-form');
  signup.addEventListener('submit', function (e) {
    e.preventDefault();
    document.getElementById('signup-msg').hidden = false;
  });
})();
