/* ============================================
   LA CARRETERA — main.js
   ============================================ */

'use strict';

// ─── CONFIG ──────────────────────────────────
const CONFIG = {
  phone: '+40344730077',
  address: 'Strada Cuza Vodă, Nr. 6, Mizil, Prahova',
  hours: {
    weekdays: { open: 10, close: 22 },   // Mon–Sat
    sunday:   { open: 11, close: 21 },
  },
  menuUpdateHour: 10, // menu shows "today" after 10:00
};

// ─── UTILITY ─────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const ready = fn => document.readyState !== 'loading' ? fn() : document.addEventListener('DOMContentLoaded', fn);

// ─── INIT ────────────────────────────────────
ready(() => {
  initNav();
  initMenuTabs();
  initScrollReveal();
  initOpenStatus();
  initTodayBadge();
  initSmoothScroll();
  initLazyEmoji();
  initPhoneClick();
  initFloatingCTA();
  initMenuSearch();
  initToast();
});

/* ============================================
   1. NAVIGATION
   ============================================ */
function initNav() {
  const nav = $('.nav');
  if (!nav) return;

  // Scroll shadow
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 80);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Active link highlight based on section in view
  const sections = $$('section[id]');
  const links = $$('.nav-links a');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        links.forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => observer.observe(s));
}

// Mobile menu (called from HTML onclick — kept global)
window.toggleMenu = function () {
  const menu = $('#mobileMenu');
  const isOpen = menu.classList.toggle('open');
  document.body.style.overflow = isOpen ? 'hidden' : '';
};

/* ============================================
   2. MENU TABS + SEARCH
   ============================================ */
function initMenuTabs() {
  const tabs = $$('.tab');
  const cards = $$('.menu-card');

  // Show pizza by default
  filterCards('pizza', cards);

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const cat = tab.dataset.cat;
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      filterCards(cat, cards);
      // Re-trigger reveal for newly shown cards
      cards.forEach(c => {
        if (c.dataset.cat === cat) {
          c.classList.remove('visible');
          setTimeout(() => c.classList.add('visible'), 50);
        }
      });
    });
  });
}

function filterCards(cat, cards) {
  cards.forEach(c => {
    const show = c.dataset.cat === cat;
    c.style.display = show ? 'flex' : 'none';
    if (show) c.classList.add('visible');
  });
}

function initMenuSearch() {
  // Inject search bar above tabs
  const tabsWrap = $('.menu-tabs');
  if (!tabsWrap) return;

  const searchWrap = document.createElement('div');
  searchWrap.className = 'menu-search-wrap';
  searchWrap.innerHTML = `
    <input
      type="search"
      id="menuSearch"
      placeholder="Caută în meniu... (ex: pizza, paste)"
      autocomplete="off"
      aria-label="Caută preparat"
    />
    <span class="search-icon">🔍</span>
  `;
  tabsWrap.parentNode.insertBefore(searchWrap, tabsWrap);

  const input = $('#menuSearch');
  const cards = $$('.menu-card');
  const tabs  = $$('.tab');

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();

    if (!q) {
      // Restore last active tab
      const activeTab = $('.tab.active');
      const cat = activeTab ? activeTab.dataset.cat : 'pizza';
      filterCards(cat, cards);
      tabsWrap.style.display = '';
      return;
    }

    tabsWrap.style.display = 'none'; // hide tabs during search
    tabs.forEach(t => t.classList.remove('active'));

    cards.forEach(c => {
      const text = c.innerText.toLowerCase();
      const match = text.includes(q);
      c.style.display = match ? 'flex' : 'none';
      if (match) c.classList.add('visible');
    });

    const visible = cards.filter(c => c.style.display !== 'none');
    if (visible.length === 0) {
      let noResult = $('#noResult');
      if (!noResult) {
        noResult = document.createElement('p');
        noResult.id = 'noResult';
        noResult.className = 'menu-note';
        noResult.textContent = 'Niciun preparat găsit. Sunați-ne pentru mai multe opțiuni!';
        $('.menu-grid').after(noResult);
      }
    } else {
      $('#noResult')?.remove();
    }
  });
}

/* ============================================
   3. SCROLL REVEAL
   ============================================ */
function initScrollReveal() {
  const targets = $$('.menu-card, .review-card, .cat-card, .stat, .about-text, .info-item, .cat-card');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger delay for grid items
        const siblings = [...entry.target.parentNode.children];
        const idx = siblings.indexOf(entry.target);
        entry.target.style.transitionDelay = `${idx * 60}ms`;
        entry.target.classList.add('reveal', 'visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(el => {
    el.classList.add('reveal');
    observer.observe(el);
  });
}

/* ============================================
   4. OPEN / CLOSED STATUS BADGE
   ============================================ */
function initOpenStatus() {
  const badge = document.createElement('div');
  badge.id = 'statusBadge';
  badge.className = 'status-badge';

  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const hour = now.getHours() + now.getMinutes() / 60;

  let isOpen = false;
  let closeTime = '';

  if (day === 0) {
    // Sunday
    isOpen = hour >= CONFIG.hours.sunday.open && hour < CONFIG.hours.sunday.close;
    closeTime = `${CONFIG.hours.sunday.close}:00`;
  } else {
    isOpen = hour >= CONFIG.hours.weekdays.open && hour < CONFIG.hours.weekdays.close;
    closeTime = `${CONFIG.hours.weekdays.close}:00`;
  }

  badge.innerHTML = isOpen
    ? `<span class="dot green"></span> Deschis acum · Închidem la ${closeTime}`
    : `<span class="dot red"></span> Momentan închis`;

  badge.classList.add(isOpen ? 'open' : 'closed');

  // Insert in contact section
  const contactSection = $('#contact');
  if (contactSection) {
    const h2 = contactSection.querySelector('h2');
    if (h2) h2.after(badge);
  }

  // Also inject CSS for badge
  injectStyle(`
    .status-badge {
      display: inline-flex; align-items: center; gap: .6rem;
      padding: .5rem 1.2rem; border-radius: 2rem;
      font-family: 'Lora', serif; font-size: .88rem;
      margin-bottom: 1.5rem; font-style: italic;
    }
    .status-badge.open  { background: rgba(39,174,96,.15); color: #27ae60; border: 1px solid rgba(39,174,96,.3); }
    .status-badge.closed { background: rgba(192,57,43,.12); color: #c0392b; border: 1px solid rgba(192,57,43,.3); }
    .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .dot.green { background: #27ae60; box-shadow: 0 0 6px #27ae60; animation: pulse-green 2s infinite; }
    .dot.red   { background: #c0392b; }
    @keyframes pulse-green {
      0%,100% { box-shadow: 0 0 4px #27ae60; }
      50%      { box-shadow: 0 0 12px #27ae60; }
    }
  `);
}

/* ============================================
   5. TODAY'S DATE BADGE IN MENU
   ============================================ */
function initTodayBadge() {
  const header = $('.meniu-azi .section-header');
  if (!header) return;

  const days = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
  const months = ['ianuarie','februarie','martie','aprilie','mai','iunie','iulie','august','septembrie','octombrie','noiembrie','decembrie'];
  const now = new Date();
  const label = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

  const badge = document.createElement('div');
  badge.className = 'today-badge';
  badge.textContent = `📅 ${label}`;
  header.appendChild(badge);

  injectStyle(`
    .today-badge {
      display: inline-block;
      margin-top: .8rem;
      background: var(--cream, #f5f0e8);
      border: 1px solid rgba(92,61,30,.2);
      color: var(--brown-light, #8b5e3c);
      font-family: 'Lora', serif; font-size: .85rem;
      padding: .35rem 1rem; border-radius: 2rem;
      font-style: italic;
    }
  `);
}

/* ============================================
   6. SMOOTH SCROLL (with nav offset)
   ============================================ */
function initSmoothScroll() {
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = $(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const navH = $('.nav')?.offsetHeight || 70;
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - navH - 12,
        behavior: 'smooth',
      });
      // Close mobile menu if open
      const menu = $('#mobileMenu');
      if (menu?.classList.contains('open')) window.toggleMenu();
    });
  });
}

/* ============================================
   7. LAZY EMOJI / HERO PARALLAX
   ============================================ */
function initLazyEmoji() {
  // Subtle parallax on hero background
  const heroBg = $('.hero-bg');
  if (!heroBg) return;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    heroBg.style.transform = `translateY(${y * 0.3}px)`;
  }, { passive: true });
}

/* ============================================
   8. PHONE CLICK TRACKING (console log — replace with analytics)
   ============================================ */
function initPhoneClick() {
  $$('a[href^="tel:"]').forEach(a => {
    a.addEventListener('click', () => {
      console.info('[La Carretera] Apel inițiat:', CONFIG.phone);
      // If you add Google Analytics / Meta Pixel later, fire the event here:
      // gtag('event', 'phone_call', { event_category: 'engagement' });
    });
  });
}

/* ============================================
   9. FLOATING CALL CTA (appears after scrolling)
   ============================================ */
function initFloatingCTA() {
  const btn = document.createElement('a');
  btn.href = `tel:${CONFIG.phone}`;
  btn.className = 'floating-cta';
  btn.innerHTML = '📞';
  btn.setAttribute('aria-label', 'Sună acum');
  btn.title = 'Comandă telefonic';
  document.body.appendChild(btn);

  let shown = false;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400 && !shown) {
      btn.classList.add('visible');
      shown = true;
    } else if (window.scrollY <= 400 && shown) {
      btn.classList.remove('visible');
      shown = false;
    }
  }, { passive: true });

  injectStyle(`
    .floating-cta {
      position: fixed; bottom: 2rem; right: 2rem; z-index: 900;
      width: 56px; height: 56px; border-radius: 50%;
      background: var(--red, #c0392b);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; text-decoration: none;
      box-shadow: 0 4px 20px rgba(192,57,43,.5);
      opacity: 0; transform: scale(.7) translateY(10px);
      transition: opacity .35s, transform .35s;
      pointer-events: none;
    }
    .floating-cta.visible {
      opacity: 1; transform: scale(1) translateY(0);
      pointer-events: auto;
    }
    .floating-cta:hover { transform: scale(1.1); }

    /* Menu search styles */
    .menu-search-wrap {
      position: relative; max-width: 480px;
      margin: 0 auto 1.5rem;
    }
    #menuSearch {
      width: 100%; padding: .75rem 1rem .75rem 2.8rem;
      border: 1.5px solid var(--border, rgba(92,61,30,.2));
      border-radius: 2rem; font-family: 'Lora', serif;
      font-size: .95rem; background: #fff;
      color: var(--text-body, #3d2b14);
      transition: border-color .3s, box-shadow .3s;
      outline: none;
    }
    #menuSearch:focus {
      border-color: var(--red, #c0392b);
      box-shadow: 0 0 0 3px rgba(192,57,43,.1);
    }
    .search-icon {
      position: absolute; left: 1rem; top: 50%;
      transform: translateY(-50%); pointer-events: none;
      font-size: 1rem;
    }

    /* Active nav link */
    .nav-links a.active { color: var(--gold, #d4a843) !important; }
  `);
}

/* ============================================
   10. TOAST NOTIFICATION
   ============================================ */
function initToast() {
  // Show a welcome toast once per session
  if (sessionStorage.getItem('welcomed')) return;
  sessionStorage.setItem('welcomed', '1');

  setTimeout(() => showToast('🍕 Bun venit la La Carretera! Sună-ne pentru comenzi.', 4000), 2500);
}

window.showToast = function(msg, duration = 3000) {
  let container = $('#toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    document.body.appendChild(container);

    injectStyle(`
      #toastContainer {
        position: fixed; bottom: 5rem; left: 50%;
        transform: translateX(-50%);
        z-index: 9000; display: flex; flex-direction: column;
        align-items: center; gap: .5rem; pointer-events: none;
      }
      .toast {
        background: var(--dark, #1a1208);
        color: var(--cream, #f5f0e8);
        padding: .8rem 1.6rem; border-radius: 2rem;
        font-family: 'Lora', serif; font-size: .9rem;
        box-shadow: 0 4px 20px rgba(0,0,0,.3);
        border-left: 3px solid var(--gold, #d4a843);
        opacity: 0; transform: translateY(8px);
        transition: opacity .35s, transform .35s;
        pointer-events: auto;
      }
      .toast.show { opacity: 1; transform: translateY(0); }
    `);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, duration);
};

/* ============================================
   HELPER — inject <style> once per id
   ============================================ */
function injectStyle(css, id) {
  if (id && document.getElementById(id)) return;
  const style = document.createElement('style');
  if (id) style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}
