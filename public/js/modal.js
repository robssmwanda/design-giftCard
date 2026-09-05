import { $, $all, escapeHtml, isValidEmail } from './utils/helpers.js';
import { formatCurrency } from './utils/currency.js';
import { discountPercent } from './utils/denomination.js';
import { addItem } from './cart.js';
import { findBrandById } from './catalog.js';

var modalState = { brand: null, selectedDenom: null, selectedPrice: null, selectedCardId: null, quantity: 1 };
var onBuyNow = null;

export function setBuyNowHandler(fn) { onBuyNow = fn; }

export function openCardModal(brandId) {
  var brand = findBrandById(brandId);
  if (!brand) return;
  var cards = brand.gift_cards || [];
  if (!cards.length) return;
  var firstCard = cards[0];
  modalState = { brand: brand, selectedDenom: firstCard.denomination, selectedPrice: firstCard.price, selectedCardId: firstCard.id, quantity: 1 };

  var body = $('#card-modal-body');
  if (!body) return;
  var accent = brand.accent_color || '#0F172A';
  var accent2 = brand.accent_color_2 || '#334155';
  var discount = discountPercent(firstCard.denomination, firstCard.price);

  var denomsHtml = cards.slice(0, 15).map(function (c, idx) {
    var d = discountPercent(c.denomination, c.price);
    return '<button class="modal-denom-btn ' + (idx === 0 ? 'selected' : '') + ' rounded-lg px-3 py-2 text-sm font-semibold" data-card-id="' + c.id + '" data-denomination="' + c.denomination + '" data-price="' + c.price + '">' +
      formatCurrency(c.denomination) +
      (d > 0 ? ' <span class="ml-1 text-[10px] font-bold ' + (idx === 0 ? 'text-brand-400' : 'text-brand-600') + '">-' + d + '%</span>' : '') +
      '</button>';
  }).join('');

  var regionLabel = brand.region ? brand.name + ' (' + brand.region + ')' : brand.name;
  var cardLabel = brand.region ? brand.region : brand.category;
  body.innerHTML =
    '<div class="kadopay-modal-layout">' +
      '<section class="kadopay-modal-preview" style="--card-accent:' + accent + ';--card-accent-2:' + accent2 + ';">' +
        '<div class="kadopay-preview-orb kadopay-preview-orb-one"></div>' +
        '<div class="kadopay-preview-orb kadopay-preview-orb-two"></div>' +
        '<div class="relative z-10">' +
          '<p class="kadopay-eyebrow">Gift card</p>' +
          '<h2 class="kadopay-preview-title">' + escapeHtml(brand.name) + (brand.region ? ' <span>(' + escapeHtml(brand.region) + ')</span>' : '') + '</h2>' +
          '<p class="kadopay-preview-description">' + escapeHtml(brand.description || 'Premium digital gift card.') + '</p>' +
        '</div>' +
        '<div class="kadopay-card-art relative z-10" style="background: linear-gradient(135deg, ' + accent + ' 0%, ' + accent2 + ' 100%);">' +
          '<div class="kadopay-card-wave kadopay-card-wave-one"></div><div class="kadopay-card-wave kadopay-card-wave-two"></div>' +
          '<div class="relative flex h-full flex-col justify-between">' +
            '<div class="flex items-start justify-between gap-3"><span class="kadopay-card-brand">' + escapeHtml(brand.name) + '</span><span class="kadopay-card-region">' + escapeHtml(cardLabel) + '</span></div>' +
            '<div class="flex items-end justify-between gap-4"><span class="kadopay-card-mark">Gift card</span><span id="modal-card-denom" class="kadopay-card-denom">' + formatCurrency(firstCard.denomination) + '</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="kadopay-trust-list">' +
          '<div><span class="kadopay-trust-icon">✓</span><span>Instant delivery</span></div>' +
          '<div><span class="kadopay-trust-icon">✓</span><span>Official gift card</span></div>' +
          '<div><span class="kadopay-trust-icon">✓</span><span>Usable in ' + escapeHtml(cardLabel) + '</span></div>' +
        '</div>' +
      '</section>' +
      '<section class="kadopay-modal-form">' +
        '<div class="kadopay-modal-scroll">' +
        '<div class="kadopay-modal-heading"><div><p class="kadopay-eyebrow kadopay-eyebrow-dark">Purchase details</p><h3>Choose your gift card</h3></div><span class="kadopay-modal-brand-dot" style="background: linear-gradient(135deg, ' + accent + ', ' + accent2 + ')"></span></div>' +
        '<div class="kadopay-form-section">' +
          '<label class="kadopay-form-label" for="modal-region">Country / Region</label>' +
          '<div class="kadopay-select-wrap"><span class="kadopay-flag-mark">◎</span><select id="modal-region" class="kadopay-region-select" aria-label="Country or region"><option value="' + escapeHtml(brand.id) + '">' + escapeHtml(regionLabel) + '</option></select><span class="kadopay-select-chevron">⌄</span></div>' +
        '</div>' +
        '<div class="kadopay-form-section"><div class="kadopay-section-heading"><label class="kadopay-form-label">Select amount</label><span class="kadopay-section-note">Choose a denomination</span></div><div class="kadopay-denoms" id="modal-denoms">' + denomsHtml + '</div></div>' +
        '<div class="kadopay-delivery-note"><span class="kadopay-info-icon">i</span><span>This gift card code will be delivered to your email instantly after payment.</span></div>' +
        '<div class="kadopay-form-section"><label class="kadopay-form-label" for="modal-email">Delivery email</label><div class="kadopay-input-wrap"><svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg><input type="email" id="modal-email" placeholder="you@example.com" /></div><p id="modal-email-error" class="kadopay-error" style="display:none;"></p><p class="kadopay-help-text">The gift card code will be delivered to this email instantly.</p></div>' +
        '<div class="kadopay-purchase-footer"><div class="kadopay-quantity"><span class="kadopay-form-label">Qty</span><div class="kadopay-quantity-control"><button id="modal-qty-dec" aria-label="Decrease quantity">−</button><span id="modal-qty">1</span><button id="modal-qty-inc" aria-label="Increase quantity">+</button></div></div><div class="kadopay-price"><span>You pay</span><div><span id="modal-price-strike" class="kadopay-price-strike" style="' + (discount > 0 ? '' : 'display:none;') + '">' + formatCurrency(firstCard.denomination) + '</span><strong id="modal-price-display">' + formatCurrency(firstCard.price) + '</strong></div></div></div>' +
        '<div id="modal-savings" class="kadopay-savings" style="' + (discount > 0 ? '' : 'display:none;') + '"><span id="modal-savings-text">You save ' + formatCurrency(firstCard.denomination - firstCard.price) + ' (' + discount + '%)</span></div>' +
        '</div>' +
        '<div class="kadopay-modal-footer">' +
        '<div class="kadopay-action-row"><button id="modal-add-cart" class="kadopay-action-button kadopay-cart-button"><svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg> Add to cart</button><button id="modal-buy-now" class="kadopay-action-button kadopay-buy-button"><svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/></svg> Buy now</button></div>' +
        '<div class="kadopay-secure-note"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg> Secure and encrypted payment</div>' +
        '</div>' +
      '</section>' +
    '</div>';

  attachModalEvents();
  showModal();
}

function attachModalEvents() {
  var denomBtns = $all('#modal-denoms .modal-denom-btn');
  denomBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      denomBtns.forEach(function (b) {
        b.classList.remove('selected');
        var disc = b.querySelector('span');
        if (disc) disc.className = 'ml-1 text-[10px] font-bold text-brand-600';
      });
      btn.classList.add('selected');
      var disc = btn.querySelector('span');
      if (disc) disc.className = 'ml-1 text-[10px] font-bold text-brand-400';
      var denom = parseFloat(btn.getAttribute('data-denomination'));
      var price = parseFloat(btn.getAttribute('data-price'));
      var cardId = btn.getAttribute('data-card-id');
      modalState.selectedDenom = denom;
      modalState.selectedPrice = price;
      modalState.selectedCardId = cardId;
      var discount = discountPercent(denom, price);
      $('#modal-price-display').textContent = formatCurrency(price);
      var cardDenom = $('#modal-card-denom');
      if (cardDenom) cardDenom.textContent = formatCurrency(denom);
      var strike = $('#modal-price-strike');
      if (discount > 0) { strike.textContent = formatCurrency(denom); strike.style.display = ''; }
      else { strike.style.display = 'none'; }
      var savings = $('#modal-savings');
      var savingsText = $('#modal-savings-text');
      if (discount > 0) { savings.style.display = ''; savingsText.textContent = 'You save ' + formatCurrency(denom - price) + ' (' + discount + '%)'; }
      else { savings.style.display = 'none'; }
    });
  });

  var qtyDec = $('#modal-qty-dec');
  var qtyInc = $('#modal-qty-inc');
  var qtyDisplay = $('#modal-qty');
  if (qtyDec) qtyDec.addEventListener('click', function () {
    if (modalState.quantity > 1) { modalState.quantity--; qtyDisplay.textContent = modalState.quantity; }
  });
  if (qtyInc) qtyInc.addEventListener('click', function () {
    if (modalState.quantity < 99) { modalState.quantity++; qtyDisplay.textContent = modalState.quantity; }
  });

  var emailInput = $('#modal-email');
  if (emailInput) emailInput.addEventListener('input', function () {
    var err = $('#modal-email-error');
    if (err) err.style.display = 'none';
  });

  var addBtn = $('#modal-add-cart');
  var buyBtn = $('#modal-buy-now');
  if (addBtn) addBtn.addEventListener('click', function () { handleModalAddToCart(false); });
  if (buyBtn) buyBtn.addEventListener('click', function () { handleModalAddToCart(true); });
}

function handleModalAddToCart(buyNow) {
  var emailInput = $('#modal-email');
  var errEl = $('#modal-email-error');
  var email = emailInput ? emailInput.value.trim() : '';
  if (!email) {
    if (errEl) { errEl.textContent = 'Please enter a delivery email address.'; errEl.style.display = ''; }
    emailInput.focus();
    return;
  }
  if (!isValidEmail(email)) {
    if (errEl) { errEl.textContent = 'Please enter a valid email address.'; errEl.style.display = ''; }
    emailInput.focus();
    return;
  }

  var item = {
    giftCardId: modalState.selectedCardId,
    brandId: modalState.brand.id,
    brandName: modalState.brand.name,
    brandSlug: modalState.brand.slug || '',
    denomination: modalState.selectedDenom,
    price: modalState.selectedPrice,
    accentColor: modalState.brand.accent_color || '#0F172A',
    accentColor2: modalState.brand.accent_color_2 || '#334155',
    quantity: modalState.quantity,
    deliveryEmail: email
  };
  addItem(item);

  if (buyNow) {
    closeCardModal();
    if (onBuyNow) onBuyNow(email);
  } else {
    closeCardModal();
  }
}

export function showModal() {
  var backdrop = $('#card-modal-backdrop');
  var modal = $('#card-modal');
  if (backdrop) { backdrop.classList.remove('opacity-0', 'pointer-events-none'); }
  if (modal) { modal.classList.remove('scale-95', 'opacity-0'); modal.classList.add('scale-100', 'opacity-100'); }
  document.body.style.overflow = 'hidden';
}

export function closeCardModal() {
  var backdrop = $('#card-modal-backdrop');
  var modal = $('#card-modal');
  if (backdrop) { backdrop.classList.add('opacity-0', 'pointer-events-none'); }
  if (modal) { modal.classList.add('scale-95', 'opacity-0'); modal.classList.remove('scale-100', 'opacity-100'); }
  document.body.style.overflow = '';
}
