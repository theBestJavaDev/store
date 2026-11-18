// Seattle Solvers shop — app.js
// Wires index.html (#grid, #pills, #search, #sort, #materials, #pw/#ph/#pq,
// #drop/#dxf, #addPlate, #drawer, #items, #checkout, #orderDialog …) to catalogData.js.

import { FTC_CATALOG, FTC_RESCUE_KIT, PLATE_MATERIALS, SHOP_CONFIG as CFG } from './catalogData.js';

/* ---------------- Helpers ---------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, lo, hi) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
const setText = (sel, v) => { const el = $(sel); if (el) el.textContent = v; };
const specList = (p) => (Array.isArray(p.specs) ? p.specs : [p.specs]).filter(Boolean);
const debounce = (fn, ms = 120) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

const PRODUCTS = new Map([...FTC_CATALOG, FTC_RESCUE_KIT].map((p) => [p.id, p]));

const ICONS = {
  bearing: '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="26"/><circle cx="32" cy="32" r="16"/><circle class="hl" cx="32" cy="32" r="7"/></svg>',
  collar:  '<svg viewBox="0 0 64 64"><path d="M32 6a26 26 0 1 0 0 52 26 26 0 0 0 0-52z"/><circle class="hl" cx="32" cy="32" r="9"/><path d="M32 6v17M24 10h16"/></svg>',
  shaft:   '<svg viewBox="0 0 64 64"><rect x="6" y="26" width="52" height="12" rx="2"/><path class="hl" d="M6 30h52"/></svg>',
  screw:   '<svg viewBox="0 0 64 64"><rect x="22" y="6" width="20" height="12" rx="2"/><path d="M27 18v38h10V18"/><path class="hl" d="M27 26l10 4M27 34l10 4M27 42l10 4"/></svg>',
  nut:     '<svg viewBox="0 0 64 64"><path d="M32 6l22 13v26L32 58 10 45V19z"/><circle class="hl" cx="32" cy="32" r="10"/></svg>',
  spacer:  '<svg viewBox="0 0 64 64"><rect x="18" y="8" width="28" height="48" rx="3"/><path class="hl" d="M32 8v48"/></svg>',
  string:  '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="22"/><circle cx="32" cy="32" r="6"/><path class="hl" d="M54 32c4 10 2 18-4 24"/></svg>',
  wheel:   '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="24"/><circle class="hl" cx="32" cy="32" r="6"/><path d="M32 8v10M32 46v10M8 32h10M46 32h10M15 15l7 7M42 42l7 7M49 15l-7 7M22 42l-7 7"/></svg>',
  kit:     '<svg viewBox="0 0 64 64"><rect x="8" y="16" width="48" height="38" rx="4"/><path d="M24 16v-6h16v6"/><path class="hl" d="M8 32h48"/></svg>',
};

/* ---------------- State + storage ---------------- */
const state = {
  category: 'All',
  query: '',
  sort: 'featured',
  plateFile: '',
  cart: loadCart(),
};

function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CFG.storageKey));
    if (!Array.isArray(raw)) return [];
    // Drop lines whose product was removed from the catalog.
    return raw.filter((l) => l && (l.plate || PRODUCTS.has(l.id)) && l.qty > 0);
  } catch { return []; }
}
function saveCart() {
  try { localStorage.setItem(CFG.storageKey, JSON.stringify(state.cart)); } catch { /* private mode: cart lives in memory */ }
}

/* ---------------- Toast ---------------- */
let toastTimer;
function toast(msg) {
  const t = $('#toast'); if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
}

/* ---------------- Hero plate drawing ---------------- */
function drawHeroPlate() {
  const svg = $('#plateSvg'); if (!svg) return;
  const ns = 'http://www.w3.org/2000/svg';
  const W = 480, H = 220, pad = 14, step = 12;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const holes = [[60, 60], [60, 160], [150, 110], [240, 60], [240, 160], [330, 110], [420, 110]];

  const inside = (x, y) => {
    if (x < pad || x > W - pad || y < pad || y > H - pad) return false;
    if (x > W - 120) { const inset = ((x - (W - 120)) / (120 - pad)) * 50; if (y < pad + inset || y > H - pad - inset) return false; }
    return true;
  };
  const onRing = (x, y) => holes.some(([hx, hy]) => { const d = Math.hypot(x - hx, y - hy); return d >= 10 && d <= 20; });

  const frag = document.createDocumentFragment();
  const edge = document.createElementNS(ns, 'path');
  edge.setAttribute('class', 'plate-edge');
  edge.setAttribute('d', `M${pad} ${pad + 10}q0-10 10-10H${W - 120}L${W - pad} ${pad + 50}V${H - pad - 50}L${W - 120} ${H - pad}H${pad + 10}q-10 0-10-10z`);
  frag.appendChild(edge);

  let i = 0;
  for (let y = pad + 6; y < H - pad; y += step) {
    for (let x = pad + 6; x < W - pad; x += step) {
      if (!inside(x, y)) continue;
      const lit = onRing(x, y);
      const c = document.createElementNS(ns, 'circle');
      c.setAttribute('cx', x); c.setAttribute('cy', y);
      c.setAttribute('r', lit ? 3 : 2.2);
      c.setAttribute('class', lit ? 'dot on' : 'dot');
      if (lit) {
        if (reduced) c.style.opacity = 1;
        else c.style.animationDelay = `${0.15 + (x / W) * 0.9 + (i++ % 3) * 0.03}s`;
      }
      frag.appendChild(c);
    }
  }
  svg.replaceChildren(frag);
}

/* ---------------- Catalog ---------------- */
function renderPills() {
  const box = $('#pills'); if (!box) return;
  const cats = ['All', ...new Set(FTC_CATALOG.map((p) => p.category))];
  box.innerHTML = cats.map((c) =>
    `<button class="pill" aria-pressed="${c === state.category}" data-cat="${esc(c)}">${c === 'All' ? `All (${FTC_CATALOG.length})` : esc(c)}</button>`
  ).join('');
}

function filteredProducts() {
  const q = state.query.toLowerCase();
  let list = FTC_CATALOG.filter((p) =>
    (state.category === 'All' || p.category === state.category) &&
    (!q || [p.name, p.desc, p.sku, p.category, p.packSize, ...specList(p)].join(' ').toLowerCase().includes(q))
  );
  if (state.sort === 'low') list = [...list].sort((a, b) => a.price - b.price);
  if (state.sort === 'high') list = [...list].sort((a, b) => b.price - a.price);
  return list;
}

function renderCatalog() {
  const grid = $('#grid'); if (!grid) return;
  const list = filteredProducts();

  if (!list.length) {
    grid.innerHTML = `<div class="empty">No parts match “${esc(state.query)}”${state.category !== 'All' ? ` in ${esc(state.category)}` : ''}. Try a size like 8 mm or a part number like 688ZZ.<br><button class="btn btn-ghost" data-action="clear-filters">Clear filters</button></div>`;
    return;
  }

  grid.innerHTML = list.map((p) => `
    <article class="product">
      <div class="product-art">${ICONS[p.icon] || ICONS.kit}</div>
      <div class="product-body">
        <div class="product-meta"><span>${esc(p.category)}</span><span>${esc(p.sku)}</span></div>
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.desc)}</p>
        <ul class="specs">${[...specList(p), p.packSize].map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
        <div class="product-foot">
          <div class="price">${money(p.price)}</div>
          ${p.inStock === false
            ? '<button class="add-btn" disabled>Out of stock</button>'
            : `<button class="add-btn" data-add="${esc(p.id)}" aria-label="Add ${esc(p.name)} to cart">Add to cart</button>`}
        </div>
      </div>
    </article>`).join('');
}

function clearFilters() {
  state.query = ''; state.category = 'All';
  const s = $('#search'); if (s) s.value = '';
  renderPills(); renderCatalog();
}

/* ---------------- Plate quote ---------------- */
function renderMaterials() {
  const box = $('#materials'); if (!box) return;
  box.innerHTML = PLATE_MATERIALS.map((m, i) => `
    <div class="mat">
      <input type="radio" name="mat" id="m-${m.id}" value="${m.id}" ${i === 0 ? 'checked' : ''}>
      <label for="m-${m.id}"><strong>${esc(m.name)}</strong><span>${esc(m.detail)} · ${money(m.ratePerSqIn)}/sq in</span></label>
    </div>`).join('');
}

function readQuote() {
  const matId = $('input[name=mat]:checked')?.value;
  const mat = PLATE_MATERIALS.find((m) => m.id === matId) || PLATE_MATERIALS[0];
  const w = clamp(parseFloat($('#pw')?.value), 0.5, CFG.plateMaxInches);
  const h = clamp(parseFloat($('#ph')?.value), 0.5, CFG.plateMaxInches);
  const qty = Math.round(clamp(parseInt($('#pq')?.value, 10), 1, CFG.plateMaxQty));

  const area = w * h;
  const each = area * mat.ratePerSqIn;
  const base = each * qty;
  const discount = qty >= 2 ? base * CFG.platePairDiscount : 0;
  const afterDiscount = base - discount;
  const setup = afterDiscount > CFG.plateSetupWaiveOver ? 0 : CFG.plateSetupFee;
  const total = afterDiscount + setup;
  return { mat, w, h, qty, area, each, discount, setup, total };
}

function renderQuote() {
  const q = readQuote();
  setText('#quoteMat', q.mat.label);
  setText('#qArea', `${q.area.toFixed(2)} sq in`);
  setText('#qEach', money(q.each));
  setText('#qSetup', q.setup ? money(q.setup) : 'Waived');
  setText('#qDisc', q.discount ? `−${money(q.discount)}` : '—');
  setText('#qTotal', money(q.total));
  return q;
}

// Snap typed values back into range when the field loses focus.
function normalizeQuoteInputs(e) {
  const el = e.target;
  if (el.id === 'pq') el.value = Math.round(clamp(parseInt(el.value, 10), 1, CFG.plateMaxQty));
  if (el.id === 'pw' || el.id === 'ph') el.value = clamp(parseFloat(el.value), 0.5, CFG.plateMaxInches);
  renderQuote();
}

function setPlateFile(file) {
  const label = $('#dropText');
  if (!file) return;
  if (!/\.(dxf|step|stp)$/i.test(file.name)) {
    state.plateFile = '';
    if (label) label.innerHTML = `<strong>${esc(file.name)}</strong> isn’t a DXF or STEP file. Choose a .dxf, .step, or .stp.`;
    return;
  }
  state.plateFile = file.name;
  if (label) label.innerHTML = `<strong>${esc(file.name)}</strong> ready. Attach it to your order email.`;
}

function addPlateJob() {
  const q = renderQuote();
  state.cart.push({
    id: `PLATE-${Date.now()}`,
    qty: 1,
    plate: { mat: q.mat.label, w: q.w, h: q.h, q: q.qty, total: Number(q.total.toFixed(2)), file: state.plateFile },
  });
  saveCart(); renderCart();
  toast('Plate job added');
  openCart();
}

/* ---------------- Cart ---------------- */
function lineInfo(line) {
  if (line.plate) {
    const p = line.plate;
    return { name: `Custom plate × ${p.q}`, detail: `${p.mat}, ${p.w} × ${p.h} in${p.file ? `, ${p.file}` : ''}`, unit: p.total, sku: 'SS-PLATE' };
  }
  const p = PRODUCTS.get(line.id);
  return p ? { name: p.name, detail: [...specList(p), p.packSize].join(', '), unit: p.price, sku: p.sku } : null;
}

function addToCart(id) {
  if (!PRODUCTS.has(id)) return;
  const line = state.cart.find((l) => l.id === id && !l.plate);
  if (line) line.qty += 1; else state.cart.push({ id, qty: 1 });
  saveCart(); renderCart();
  toast('Added to cart');
}

function changeQty(index, delta) {
  const line = state.cart[index]; if (!line) return;
  line.qty += delta;
  if (line.qty < 1) state.cart.splice(index, 1);
  saveCart(); renderCart();
}

function removeLine(index) {
  state.cart.splice(index, 1);
  saveCart(); renderCart();
}

function isPickup() { return $('input[name=ship]:checked')?.value === 'pickup'; }

function totals() {
  const subtotal = state.cart.reduce((s, l) => s + (lineInfo(l)?.unit || 0) * l.qty, 0);
  const pickup = isPickup();
  const shipping = pickup || subtotal === 0 || subtotal >= CFG.freeShipThreshold ? 0 : CFG.flatShipping;
  return { subtotal, shipping, grand: subtotal + shipping, pickup };
}

function renderCart() {
  const count = state.cart.reduce((s, l) => s + l.qty, 0);
  setText('#cartCount', String(count));

  const box = $('#items');
  if (box) {
    box.innerHTML = state.cart.length
      ? state.cart.map((l, i) => {
          const it = lineInfo(l);
          return `
          <div class="item">
            <div><h4>${esc(it.name)}</h4><div class="detail">${esc(it.sku)} · ${esc(it.detail)}</div></div>
            <div class="item-price">${money(it.unit * l.qty)}</div>
            ${l.plate ? '<div></div>' : `
            <div class="qty">
              <button data-qty="-1" data-idx="${i}" aria-label="Decrease ${esc(it.name)}">−</button>
              <span>${l.qty}</span>
              <button data-qty="1" data-idx="${i}" aria-label="Increase ${esc(it.name)}">+</button>
            </div>`}
            <button class="remove" data-remove="${i}">Remove</button>
          </div>`;
        }).join('')
      : '<div class="cart-empty">Your cart is empty.<br><br><a class="btn btn-ghost" href="#catalog" data-action="close-cart">Browse hardware</a></div>';
  }

  const t = totals();
  setText('#sub', money(t.subtotal));
  setText('#shipCost', t.pickup ? 'Pickup' : t.shipping ? money(t.shipping) : t.subtotal ? 'Free' : money(0));
  setText('#grand', money(t.grand));

  const left = Math.max(0, CFG.freeShipThreshold - t.subtotal);
  setText('#shipText', t.pickup
    ? 'Local pickup in Sammamish, no shipping cost'
    : left > 0 ? `Add ${money(left)} more for free shipping` : 'You’ve got free USPS Ground shipping');
  const fill = $('#shipFill');
  if (fill) fill.style.width = `${t.pickup ? 100 : Math.min(100, (t.subtotal / CFG.freeShipThreshold) * 100)}%`;

  const btn = $('#checkout');
  if (btn) {
    btn.disabled = !state.cart.length;
    btn.textContent = $('#po')?.checked ? 'Request PO invoice' : 'Place order';
  }
}

/* ---------------- Drawer ---------------- */
let lastFocus = null;
function openCart() {
  lastFocus = document.activeElement;
  $('#drawer')?.classList.add('open');
  $('#backdrop')?.classList.add('show');
  $('#drawer')?.setAttribute('aria-hidden', 'false');
  $('#closeCart')?.focus();
}
function closeCart() {
  $('#drawer')?.classList.remove('open');
  $('#backdrop')?.classList.remove('show');
  $('#drawer')?.setAttribute('aria-hidden', 'true');
  lastFocus?.focus?.();
}

/* ---------------- Checkout ---------------- */
function buildOrderText(po) {
  const t = totals();
  const lines = state.cart.map((l) => {
    const it = lineInfo(l);
    return `${l.qty} × ${it.name} [${it.sku}] (${it.detail}) — ${money(it.unit * l.qty)}`;
  });
  const out = [
    ...lines,
    '',
    `Subtotal: ${money(t.subtotal)}`,
    `Delivery: ${t.pickup ? 'Local pickup, Sammamish' : `USPS Ground ${t.shipping ? money(t.shipping) : '(free)'}`}`,
    `Total: ${money(t.grand)}`,
    `Payment: ${po ? 'School PO, Net-30' : 'Invoice'}`,
    '',
    'Team number / school:',
    t.pickup ? 'Contact name and phone:' : 'Ship-to name and address:',
  ];
  if (po) out.push('PO number (attach signed PO):');
  if (state.cart.some((l) => l.plate)) out.push('Plate files: attach DXF/STEP to this email.');
  return out.join('\n');
}

function openCheckout() {
  if (!state.cart.length) return;
  const po = !!$('#po')?.checked;
  const body = buildOrderText(po);
  setText('#dlgTitle', po ? 'Request a PO invoice' : 'Send your order');
  setText('#dlgText', po
    ? 'Email this order with your signed PO attached. We ship on approval and invoice Net-30.'
    : 'Online payment is coming soon. Email this order and we’ll reply with an invoice within one school day.');
  setText('#dlgBody', body);
  const mail = $('#dlgMail');
  if (mail) {
    const subject = `${po ? 'PO order' : 'Shop order'} — FTC hardware`;
    mail.href = `mailto:${CFG.orderEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
  const dlg = $('#orderDialog');
  if (dlg?.showModal) dlg.showModal(); else window.prompt('Copy your order:', body);
}

async function copyOrder() {
  const text = $('#dlgBody')?.textContent || '';
  try { await navigator.clipboard.writeText(text); toast('Order copied'); }
  catch { toast('Select the text to copy it'); }
}

/* ---------------- Events ---------------- */
function bindEvents() {
  // One delegated click handler for everything rendered dynamically.
  document.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) {
      addToCart(add.dataset.add);
      if (add.classList.contains('add-btn')) {
        add.textContent = 'Added'; add.classList.add('added');
        setTimeout(() => { add.textContent = 'Add to cart'; add.classList.remove('added'); }, 1200);
      }
      return;
    }
    const pill = e.target.closest('.pill[data-cat]');
    if (pill) { state.category = pill.dataset.cat; renderPills(); renderCatalog(); return; }

    const qty = e.target.closest('[data-qty]');
    if (qty) { changeQty(+qty.dataset.idx, +qty.dataset.qty); return; }

    const rm = e.target.closest('[data-remove]');
    if (rm) { removeLine(+rm.dataset.remove); return; }

    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'clear-filters') clearFilters();
    if (action === 'close-cart') closeCart();
  });

  $('#search')?.addEventListener('input', debounce((e) => { state.query = e.target.value.trim(); renderCatalog(); }));
  $('#sort')?.addEventListener('change', (e) => { state.sort = e.target.value; renderCatalog(); });

  // Quote
  ['#pw', '#ph', '#pq'].forEach((s) => {
    $(s)?.addEventListener('input', renderQuote);
    $(s)?.addEventListener('blur', normalizeQuoteInputs);
  });
  $('#materials')?.addEventListener('change', renderQuote);
  $('#addPlate')?.addEventListener('click', addPlateJob);

  const drop = $('#drop'), dxf = $('#dxf');
  dxf?.addEventListener('change', () => setPlateFile(dxf.files?.[0]));
  if (drop) {
    ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', (e) => setPlateFile(e.dataTransfer?.files?.[0]));
  }

  // Cart
  $('#openCart')?.addEventListener('click', openCart);
  $('#closeCart')?.addEventListener('click', closeCart);
  $('#backdrop')?.addEventListener('click', closeCart);
  $$('input[name=ship]').forEach((r) => r.addEventListener('change', renderCart));
  $('#po')?.addEventListener('change', renderCart);
  $('#checkout')?.addEventListener('click', openCheckout);

  // Dialog
  $('#dlgClose')?.addEventListener('click', () => $('#orderDialog')?.close());
  $('#dlgCopy')?.addEventListener('click', copyOrder);

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $('#drawer')?.classList.contains('open')) closeCart();
    if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement?.tagName)) {
      e.preventDefault(); $('#search')?.focus();
    }
  });

  // Mobile nav
  const nav = $('#mainNav'), menu = $('#menuBtn');
  menu?.addEventListener('click', () => menu.setAttribute('aria-expanded', String(nav.classList.toggle('open'))));
  nav?.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') { nav.classList.remove('open'); menu?.setAttribute('aria-expanded', 'false'); }
  });

  // Keep cart in sync across open tabs.
  window.addEventListener('storage', (e) => {
    if (e.key === CFG.storageKey) { state.cart = loadCart(); renderCart(); }
  });
}

/* ---------------- Init ---------------- */
function init() {
  drawHeroPlate();
  renderPills();
  renderCatalog();
  renderMaterials();
  renderQuote();
  renderCart();
  bindEvents();
}

// Module scripts are deferred, but guard anyway.
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
