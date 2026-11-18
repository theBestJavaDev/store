import { FTC_CATALOG, FTC_RESCUE_KIT } from './catalogData.js';
import { CartItem, FTCProduct, PlateMaterialKey, PlateQuoteResult, ProductCategory } from './types.js';

// ============================================================================
// APPLICATION STATE
// ============================================================================
let activeCategory: ProductCategory | 'ALL' = 'ALL';
let searchQuery = '';
let cart: CartItem[] = [];
let uploadedFileName = 'custom_drivetrain_plate.dxf';

const MATERIAL_RATES: Record<PlateMaterialKey, { label: string; ratePerSqIn: number }> = {
  alu_2mm: { label: '2.0mm 6061-T6 Aluminum', ratePerSqIn: 0.25 },
  poly_3mm: { label: '3.0mm Clear Polycarbonate', ratePerSqIn: 0.18 },
  delrin_3mm: { label: '3.0mm Black Delrin', ratePerSqIn: 0.18 },
};

// ============================================================================
// CATALOG RENDERING & FILTERING
// ============================================================================
function renderCatalog(): void {
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
    grid.innerHTML = `<p style="color: var(--text-secondary); grid-column: 1/-1;">No FTC SKUs matched "${searchQuery}". Try searching "8mm", "M4", or "Bearing".</p>`;
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

  // Attach Add-to-Cart listeners
  grid.querySelectorAll<HTMLButtonElement>('[data-add-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-add-id');
      const product = FTC_CATALOG.find((p) => p.id === id);
      if (product) addProductToCart(product);
    });
  });
}

// ============================================================================
// INSTANT DXF PLATE QUOTE CALCULATOR
// ============================================================================
function calculatePlateQuote(): PlateQuoteResult {
  const matSelect = document.getElementById('plateMaterial') as HTMLSelectElement;
  const qtyInput = document.getElementById('plateQty') as HTMLInputElement;
  const widthInput = document.getElementById('plateWidth') as HTMLInputElement;
  const heightInput = document.getElementById('plateHeight') as HTMLInputElement;

  const matKey = (matSelect?.value || 'alu_2mm') as PlateMaterialKey;
  const qty = Math.max(1, parseInt(qtyInput?.value || '1', 10));
  const width = Math.max(0.5, parseFloat(widthInput?.value || '1'));
  const height = Math.max(0.5, parseFloat(heightInput?.value || '1'));

  const materialInfo = MATERIAL_RATES[matKey];
  const areaSqIn = width * height;
  const unitCutCost = areaSqIn * materialInfo.ratePerSqIn;
  const rawCutSubtotal = unitCutCost * qty;

  // Automatic 15% symmetrical pair discount when ordering 2+ plates
  const pairDiscount = qty >= 2 ? rawCutSubtotal * 0.15 : 0;
  const discountedCutTotal = rawCutSubtotal - pairDiscount;

  // $3.50 setup fee waived on custom plate jobs over $35
  const setupFee = discountedCutTotal >= 35 ? 0 : 3.5;
  const totalPrice = discountedCutTotal + setupFee;

  // Update DOM displays
  setText('quoteAreaDisplay', `${areaSqIn.toFixed(2)} sq in`);
  setText('quoteCutCostDisplay', `$${unitCutCost.toFixed(2)} / plate`);
  setText('quoteSetupDisplay', setupFee === 0 ? 'WAIVED ($0.00)' : `$${setupFee.toFixed(2)}`);
  setText('quoteDiscountDisplay', `-$${pairDiscount.toFixed(2)}`);
  setText('quoteTotalDisplay', `$${totalPrice.toFixed(2)}`);

  return {
    materialLabel: materialInfo.label,
    areaSqIn,
    unitCutCost,
    setupFee,
    pairDiscount,
    totalPrice,
  };
}

// ============================================================================
// CART & FREE SHIPPING THRESHOLD LOGIC ($40 FTC THRESHOLD)
// ============================================================================
function addProductToCart(product: FTCProduct): void {
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

function addCustomPlateJobToCart(): void {
  const quote = calculatePlateQuote();
  const qtyInput = document.getElementById('plateQty') as HTMLInputElement;
  const qty = Math.max(1, parseInt(qtyInput?.value || '1', 10));

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

function renderCart(): void {
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

    container.querySelectorAll<HTMLButtonElement>('[data-qty-delta]').forEach((btn) => {
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

  // Calculate Totals & $40 Free Shipping Threshold
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

function toggleCartDrawer(open: boolean): void {
  const drawer = document.getElementById('cartDrawer');
  const backdrop = document.getElementById('drawerBackdrop');
  if (!drawer || !backdrop) return;
  drawer.classList.toggle('open', open);
  backdrop.classList.toggle('open', open);
  drawer.setAttribute('aria-hidden', String(!open));
}

function setText(id: string, value: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// ============================================================================
// INITIALIZE EVENT LISTENERS
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  renderCatalog();
  calculatePlateQuote();
  renderCart();

  // Category filter buttons
  document.querySelectorAll<HTMLButtonElement>('.filter-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      activeCategory = (pill.getAttribute('data-category') || 'ALL') as ProductCategory | 'ALL';
      renderCatalog();
    });
  });

  // Search bar
  const searchInput = document.getElementById('searchInput') as HTMLInputElement;
  searchInput?.addEventListener('input', () => {
    searchQuery = searchInput.value;
    renderCatalog();
  });

  // Rescue Kit button
  document.getElementById('addRescueKitBtn')?.addEventListener('click', () => {
    addProductToCart(FTC_RESCUE_KIT);
  });

  // Plate calculator inputs
  ['plateMaterial', 'plateQty', 'plateWidth', 'plateHeight'].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', calculatePlateQuote);
  });

  // DXF file input placeholder
  const dxfInput = document.getElementById('dxfFileInput') as HTMLInputElement;
  dxfInput?.addEventListener('change', () => {
    if (dxfInput.files && dxfInput.files[0]) {
      uploadedFileName = dxfInput.files[0].name;
      setText('fileNameDisplay', `Loaded DXF: ${uploadedFileName} (Bounding box auto-detected)`);
    }
  });

  document.getElementById('addCustomPlateBtn')?.addEventListener('click', addCustomPlateJobToCart);

  // Cart drawer controls
  document.getElementById('openCartBtn')?.addEventListener('click', () => toggleCartDrawer(true));
  document.getElementById('closeCartBtn')?.addEventListener('click', () => toggleCartDrawer(false));
  document.getElementById('drawerBackdrop')?.addEventListener('click', () => toggleCartDrawer(false));

  // Checkout placeholder
  document.getElementById('checkoutBtn')?.addEventListener('click', () => {
    if (cart.length === 0) {
      alert('Add hardware or a custom plate job to your cart first!');
      return;
    }
    const isPO = (document.getElementById('poCheckoutToggle') as HTMLInputElement)?.checked;
    alert(
      isPO
        ? 'Placeholder: Redirecting to School Purchase Order (Net-30) & Tax-Exempt Certificate Upload Portal.'
        : 'Placeholder: Redirecting to Stripe / Shopify Checkout for instant card payment.'
    );
  });
});
