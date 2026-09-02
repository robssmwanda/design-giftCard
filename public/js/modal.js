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

  body.innerHTML =
    '<div class="relative h-44 p-6" style="background: linear-gradient(135deg, ' + accent + ' 0%, ' + accent2 + ' 100%);">' +
      '<div class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10"></div>' +
      '<div class="absolute -bottom-16 right-4 h-32 w-32 rounded-full bg-white/5"></div>' +
      '<div class="absolute right-6 top-6 h-14 w-14 rounded-full border border-white/10"></div>' +
      '<div class="relative flex h-full flex-col justify-end">' +
        '<p class="text-xs font-medium uppercase tracking-widest text-white/60">Gift Card</p>' +
        '<h2 class="font-display text-3xl font-bold text-white drop-shadow-sm">' + escapeHtml(brand.name) + '</h2>' +
        '<div class="mt-2 flex items-center gap-2 text-sm text-white/80">' +
          '<span class="rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium">' + escapeHtml(brand.category) + '</span>' +
          (brand.region ? '<span class="rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium">' + escapeHtml(brand.region) + '</span>' : '') +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="p-6">' +
      (brand.description ? '<p class="text-sm leading-relaxed text-ink-500">' + escapeHtml(brand.description) + '</p>' : '') +
      '<div class="mt-5">' +
        '<p class="mb-2 text-sm font-semibold text-ink-700">Select amount</p>' +
        '<div class="flex flex-wrap gap-2" id="modal-denoms">' + denomsHtml + '</div>' +
      '</div>' +
      '<div class="mt-4 flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3">' +
        '<span class="text-sm text-ink-500">You pay</span>' +
        '<div class="text-right flex items-baseline gap-2 justify-end">' +
          '<span id="modal-price-strike" class="text-sm text-ink-400 line-through" style="' + (discount > 0 ? '' : 'display:none;') + '">' + formatCurrency(firstCard.denomination) + '</span>' +
          '<span id="modal-price-display" class="font-display text-xl font-bold text-ink-900">' + formatCurrency(firstCard.price) + '</span>' +
        '</div>' +
      '</div>' +
      '<div id="modal-savings" class="mt-2 flex items-center gap-1.5 text-xs font-medium text-brand-700" style="' + (discount > 0 ? '' : 'display:none;') + '">' +
        '<span id="modal-savings-text">You save ' + formatCurrency(firstCard.denomination - firstCard.price) + ' (' + discount + '%)</span>' +
      '</div>' +
      '<div class="mt-5">' +
        '<label class="mb-1.5 block text-sm font-semibold text-ink-700">Delivery email</label>' +
        '<input type="email" id="modal-email" placeholder="you@example.com" class="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-800 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10" />' +
        '<p id="modal-email-error" class="mt-1 text-xs text-red-500" style="display:none;"></p>' +
        '<p class="mt-1 text-xs text-ink-400">The gift card code will be delivered to this email instantly.</p>' +
      '</div>' +
      '<div class="mt-5 flex items-center gap-3">' +
        '<span class="text-sm font-semibold text-ink-700">Qty</span>' +
        '<div class="flex items-center gap-1 rounded-full bg-ink-100 p-0.5">' +
          '<button id="modal-qty-dec" class="flex h-7 w-7 items-center justify-center rounded-full text-ink-600 hover:bg-white"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg></button>' +
          '<span id="modal-qty" class="w-7 text-center text-sm font-semibold text-ink-800">1</span>' +
          '<button id="modal-qty-inc" class="flex h-7 w-7 items-center justify-center rounded-full text-ink-600 hover:bg-white"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg></button>' +
        '</div>' +
      '</div>' +
      '<div class="mt-6 flex gap-3">' +
        '<button id="modal-add-cart" class="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink-900 py-3.5 text-sm font-semibold text-white transition-all hover:bg-ink-800 active:scale-95"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg> Add to cart</button>' +
        '<button id="modal-buy-now" class="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition-all hover:bg-brand-400 active:scale-95"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> Buy now</button>' +
      '</div>' +
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
