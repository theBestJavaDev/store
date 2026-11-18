import { FTC_CATALOG, FTC_RESCUE_KIT } from './catalogData.js';

let activeCategory = 'ALL';
let searchQuery = '';
let cart = [];
let uploadedFileName = 'custom_drivetrain_plate.dxf';

const MATERIAL_RATES = {
  alu_2mm: { label: '2.0mm 6061-T6 Aluminum', ratePerSqIn: 0.25 },
  poly_3mm: { label: '3.0mm Clear Polycarbonate', ratePerSqIn: 0.18 },
  delrin_3mm: { label: '3.0mm Black Delrin', ratePerSqIn: 0.18 },
};

function renderCatalog() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  const filtered = FTC_CATALOG.filter((item) => {
    const matchesCategory = activeCategory === 'ALL' || item.category === activeCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      q === '' ||
      item.name.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      item.specs.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<p style="color: var(--text-secondary); grid-column: 1/-1;">No FTC SKUs matched "${searchQuery}".</p>`;
    return;
  }

  grid.innerHTML = filtered
    .map(
      (product) => `
      <article class="product-card">
        <div>
          <div class="product-top-meta">
            <span class="sku-code">${product.sku}</span>
            <span class="pack-badge">${product.packSize}</span>
          </div>
          <div class="product-visual-placeholder">
            <span>[ CAD RENDER PLACEHOLDER ]</span>
            <small>${product.toleranceBadge}</small>
          </div>
          <h3 class="product-title">${product.name}</h3>
          <p class="product-specs">${product.specs}</p>
        </div>
        <div class="product-footer">
          <div>
            <span class="retail-strike">Retail: $${product.competitorPrice.toFixed(2)}</span>
            <span class="ss-price">$${product.price.toFixed(2)}</span>
          </div>
          <button class="btn btn-primary" data-add-id="${product.id}">+ Add</button>
        </div>
      </article>
    `
    )
    .join('');

  grid.querySelectorAll('[data-add-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-add-id');
      const product = FTC_CATALOG.find((p) => p.id === id);
      if (product) addProductToCart(product);
    });
  });
}

function calculatePlateQuote() {
  const matSelect = document.getElementById('plateMaterial');
  const qtyInput = document.getElementById('plateQty');
  const widthInput = document.getElementById('plateWidth');
  const heightInput = document.getElementById('plateHeight');

  const matKey = matSelect ? matSelect.value : 'alu_2mm';
  const qty = Math.max(1, parseInt(qtyInput ? qtyInput.value : '1', 10));
  const width = Math.max(0.5, parseFloat(widthInput ? widthInput.value : '1'));
  const height = Math.max(0.5, parseFloat(heightInput ? heightInput.value : '1'));

  const materialInfo = MATERIAL_RATES[matKey];
  const areaSqIn = width * height;
  const unitCutCost = areaSqIn * materialInfo.ratePerSqIn;
  const rawCutSubtotal = unitCutCost * qty;

  const pairDiscount = qty >= 2 ? rawCutSubtotal * 0.15 : 0;
  const discountedCutTotal = rawCutSubtotal - pairDiscount;

  const setupFee = discountedCutTotal >= 35 ? 0 : 3.5;
  const totalPrice = discountedCutTotal + setupFee;

  setText('quoteAreaDisplay', `${areaSqIn.toFixed(2)} sq in`);
  setText('quoteCutCostDisplay', `$${unitCutCost.toFixed(2)} / plate`);
  setText('quoteSetupDisplay', setupFee === 0 ? 'WAIVED ($0.00)' : `$${setupFee.toFixed(2)}`);
  setText('quoteDiscountDisplay', `-$${pairDiscount.toFixed(2)}`);
  setText('quoteTotalDisplay', `$${totalPrice.toFixed(2)}`);

  return {
    materialLabel: materialInfo.label,
    areaSqIn,
    totalPrice,
  };
}

function addProductToCart(product) {
  const existing = cart.find((item) => item.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      sku: product.sku,
      name: product.name,
      unitPrice: product.price,
      quantity: 1,
      metaNote: product.packSize,
    });
  }
  renderCart();
  toggleCartDrawer(true);
}

function addCustomPlateJobToCart() {
  const quote = calculatePlateQuote();
  const qtyInput = document.getElementById('plateQty');
  const qty = Math.max(1, parseInt(qtyInput ? qtyInput.value : '1', 10));

  cart.push({
    id: `plate-${Date.now()}`,
    sku: 'SS-CNC-PLATE',
    name: `Custom CNC Plate (${uploadedFileName})`,
    unitPrice: Number(quote.totalPrice.toFixed(2)),
    quantity: 1,
    metaNote: `${qty}x pcs • ${quote.materialLabel} (${quote.areaSqIn.toFixed(1)} sq in)`,
  });

  renderCart();
  toggleCartDrawer(true);
}

function renderCart() {
  const container = document.getElementById('cartItemsContainer');
  const badge = document.getElementById('cartCountBadge');
  if (!container || !badge) return;

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  badge.textContent = String(totalItems);

  if (cart.length === 0) {
    container.innerHTML = `<p style="color: var(--text-secondary); font-size: 0.9rem;">Your team cart is currently empty.</p>`;
  } else {
    container.innerHTML = cart
      .map(
        (item, idx) => `
        <div class="cart-item-row">
          <div>
            <div class="cart-item-title">${item.name}</div>
            <div class="cart-item-meta">${item.sku} • ${item.metaNote || ''} • $${item.unitPrice.toFixed(2)}</div>
          </div>
          <div class="qty-controls">
            <button class="qty-btn" data-qty-delta="-1" data-idx="${idx}">-</button>
            <span>${item.quantity}</span>
            <button class="qty-btn" data-qty-delta="1" data-idx="${idx}">+</button>
          </div>
        </div>
      `
      )
      .join('');

    container.querySelectorAll('[data-qty-delta]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-idx'));
        const delta = Number(btn.getAttribute('data-qty-delta'));
        cart[idx].quantity += delta;
        if (cart[idx].quantity <= 0) {
          cart.splice(idx, 1);
        }
        renderCart();
      });
    });
  }

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const freeShippingThreshold = 40.0;
  const qualifiesFreeShip = subtotal >= freeShippingThreshold || subtotal === 0;
  const shipping = subtotal === 0 ? 0 : qualifiesFreeShip ? 0 : 3.99;
  const grandTotal = subtotal + shipping;

  setText('cartSubtotal', `$${subtotal.toFixed(2)}`);
  setText('cartShipping', subtotal === 0 ? '$0.00' : shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`);
  setText('cartGrandTotal', `$${grandTotal.toFixed(2)}`);

  const progressBar = document.getElementById('shippingProgressBar');
  const progressText = document.getElementById('shippingProgressText');
  if (progressBar && progressText) {
    const pct = Math.min(100, (subtotal / freeShippingThreshold) * 100);
    progressBar.style.width = `${pct}%`;
    if (subtotal >= freeShippingThreshold) {
      progressText.textContent = '✓ Your team order qualifies for FREE USPS Ground Shipping!';
    } else {
      const remaining = (freeShippingThreshold - subtotal).toFixed(2);
      progressText.textContent = `Add $${remaining} more for FREE USPS Ground Shipping`;
    }
  }
}

function toggleCartDrawer(open) {
  const drawer = document.getElementById('cartDrawer');
  const backdrop = document.getElementById('drawerBackdrop');
  if (!drawer || !backdrop) return;
  drawer.classList.toggle('open', open);
  backdrop.classList.toggle('open', open);
  drawer.setAttribute('aria-hidden', String(!open));
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

document.addEventListener('DOMContentLoaded', () => {
  renderCatalog();
  calculatePlateQuote();
  renderCart();

  document.querySelectorAll('.filter-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      activeCategory = pill.getAttribute('data-category') || 'ALL';
      renderCatalog();
    });
  });

  const searchInput = document.getElementById('searchInput');
  searchInput?.addEventListener('input', () => {
    searchQuery = searchInput.value;
    renderCatalog();
  });

  document.getElementById('addRescueKitBtn')?.addEventListener('click', () => {
    addProductToCart(FTC_RESCUE_KIT);
  });

  ['plateMaterial', 'plateQty', 'plateWidth', 'plateHeight'].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', calculatePlateQuote);
  });

  const dxfInput = document.getElementById('dxfFileInput');
  dxfInput?.addEventListener('change', () => {
    if (dxfInput.files && dxfInput.files[0]) {
      uploadedFileName = dxfInput.files[0].name;
      setText('fileNameDisplay', `Loaded DXF: ${uploadedFileName}`);
    }
  });

  document.getElementById('addCustomPlateBtn')?.addEventListener('click', addCustomPlateJobToCart);

  document.getElementById('openCartBtn')?.addEventListener('click', () => toggleCartDrawer(true));
  document.getElementById('closeCartBtn')?.addEventListener('click', () => toggleCartDrawer(false));
  document.getElementById('drawerBackdrop')?.addEventListener('click', () => toggleCartDrawer(false));

  document.getElementById('checkoutBtn')?.addEventListener('click', () => {
    if (cart.length === 0) {
      alert('Add items to your cart first!');
      return;
    }
    const isPO = document.getElementById('poCheckoutToggle')?.checked;
    alert(
      isPO
        ? 'Placeholder: Redirecting to School Purchase Order (Net-30) & Tax-Exempt Upload Portal.'
        : 'Placeholder: Redirecting to Checkout.'
    );
  });
});
