import { $, escapeHtml } from './utils/helpers.js';
import { formatCurrency } from './utils/currency.js';
import { loadCart, saveCart, getCart, cartCount, cartSubtotal, cartSavings, removeItem, setQuantity, clearCart, updateCartBadge, onCartChange } from './cart.js';
import { openCart, closeCart, setCheckoutEmail, getCheckoutStep, setCheckoutStep, onPaymentSuccess } from './checkout.js';
import { openMobileNav, closeMobileNav } from './navigation.js';

function renderCartPage() {
  var itemsContainer = $('#cart-page-items');
  var emptyEl = $('#cart-page-empty');
  var countEl = $('#cart-page-count');
  var summaryEl = $('#cart-page-summary');
  var totalEl = $('#cart-page-total');
  var checkoutBtn = $('#cart-page-checkout');

  if (!itemsContainer) return;
  var cart = getCart();

  if (cart.length === 0) {
    itemsContainer.style.display = 'none';
    if (emptyEl) emptyEl.style.display = '';
    if (countEl) countEl.textContent = '0 items';
    if (summaryEl) summaryEl.innerHTML = '<p class="text-sm text-ink-400">Your cart is empty.</p>';
    if (totalEl) totalEl.textContent = formatCurrency(0);
    if (checkoutBtn) checkoutBtn.style.display = 'none';
    return;
  }

  itemsContainer.style.display = '';
  if (emptyEl) emptyEl.style.display = 'none';
  if (checkoutBtn) checkoutBtn.style.display = '';

  var count = cartCount();
  if (countEl) countEl.textContent = count + (count === 1 ? ' item' : ' items');

  itemsContainer.innerHTML = '';
  cart.forEach(function (item) {
    var row = document.createElement('div');
    row.className = 'cart-page-item flex gap-4 rounded-2xl bg-white p-4 shadow-card ring-1 ring-ink-200/60';
    var accent = item.accentColor || '#0F172A';
    var accent2 = item.accentColor2 || '#334155';

    row.innerHTML =
      '<div class="relative flex h-24 w-36 shrink-0 flex-col justify-between overflow-hidden rounded-xl p-3" style="background: linear-gradient(135deg, ' + accent + ' 0%, ' + accent2 + ' 100%);">' +
        '<div class="absolute -right-4 -top-4 h-12 w-12 rounded-full bg-white/10"></div>' +
        '<p class="relative text-[10px] font-medium uppercase tracking-wider text-white/60">Gift Card</p>' +
        '<p class="relative font-display text-sm font-bold leading-tight text-white">' + escapeHtml(item.brandName) + '</p>' +
        '<p class="relative font-display text-lg font-bold text-white">' + formatCurrency(item.denomination) + '</p>' +
      '</div>' +
      '<div class="flex flex-1 flex-col">' +
        '<div class="flex items-start justify-between">' +
          '<div class="min-w-0">' +
            '<h3 class="font-display text-base font-bold text-ink-900">' + escapeHtml(item.brandName) + '</h3>' +
            '<p class="text-xs text-ink-500">' + formatCurrency(item.denomination) + ' gift card</p>' +
            '<p class="mt-0.5 truncate text-xs text-ink-400" title="' + escapeHtml(item.deliveryEmail) + '">' + escapeHtml(item.deliveryEmail) + '</p>' +
          '</div>' +
          '<button class="cart-remove-' + item.giftCardId + ' flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-red-50 hover:text-red-500">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="mt-auto flex items-end justify-between">' +
          '<div class="flex items-center gap-1 rounded-full bg-ink-100 p-0.5">' +
            '<button class="cart-dec-' + item.giftCardId + ' flex h-7 w-7 items-center justify-center rounded-full text-ink-600 cart-qty-btn"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg></button>' +
            '<span class="cart-qty-' + item.giftCardId + ' w-7 text-center text-sm font-semibold text-ink-800">' + item.quantity + '</span>' +
            '<button class="cart-inc-' + item.giftCardId + ' flex h-7 w-7 items-center justify-center rounded-full text-ink-600 cart-qty-btn"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg></button>' +
          '</div>' +
          '<div class="text-right">' +
            '<p class="text-xs text-ink-400">' + formatCurrency(item.price) + ' each</p>' +
            '<p class="font-display text-base font-bold text-ink-900">' + formatCurrency(item.price * item.quantity) + '</p>' +
          '</div>' +
        '</div>' +
      '</div>';

    itemsContainer.appendChild(row);

    (function (id, email, qty) {
      var removeBtn = $('.cart-remove-' + id, row);
      var decBtn = $('.cart-dec-' + id, row);
      var incBtn = $('.cart-inc-' + id, row);
      if (removeBtn) removeBtn.addEventListener('click', function () { removeItem(id, email); });
      if (decBtn) decBtn.addEventListener('click', function () { setQuantity(id, email, qty - 1); });
      if (incBtn) incBtn.addEventListener('click', function () { setQuantity(id, email, qty + 1); });
    })(item.giftCardId, item.deliveryEmail, item.quantity);
  });

  // Summary
  var subtotal = cartSubtotal();
  var savings = cartSavings();

  if (summaryEl) {
    var rows = getCart().map(function (item) {
      return '<div class="flex justify-between text-sm"><span class="text-ink-600">' + escapeHtml(item.brandName) + ' × ' + item.quantity + '</span><span class="font-medium text-ink-800">' + formatCurrency(item.price * item.quantity) + '</span></div>';
    }).join('');
    var savingsHtml = savings > 0 ? '<div class="flex justify-between text-sm"><span class="text-brand-600">Total savings</span><span class="font-semibold text-brand-600">-' + formatCurrency(savings) + '</span></div>' : '';
    summaryEl.innerHTML = rows + '<div class="mt-3 space-y-1.5 border-t border-ink-100 pt-3">' + savingsHtml + '</div>';
  }
  if (totalEl) totalEl.textContent = formatCurrency(subtotal);
}

function init() {
  loadCart();
  updateCartBadge();
  renderCartPage();

  var checkoutBtn = $('#cart-page-checkout');
  if (checkoutBtn) checkoutBtn.addEventListener('click', function () {
    if (getCart().length === 0) return;
    setCheckoutEmail(getCart()[0].deliveryEmail || '');
    openCart();
  });

  var closeCartBtn = $('#close-cart-btn');
  var cartBackdrop = $('#cart-backdrop');
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
  if (cartBackdrop) cartBackdrop.addEventListener('click', closeCart);

  var openCartBtn = $('#open-cart-btn');
  if (openCartBtn) openCartBtn.addEventListener('click', function (e) {
    e.preventDefault();
    if (getCart().length === 0) { window.location.href = '/'; return; }
    setCheckoutEmail(getCart()[0].deliveryEmail || '');
    openCart();
  });

  // Re-render cart page when cart changes (remove/qty from drawer or page)
  onCartChange(function () {
    renderCartPage();
  });

  // Re-render cart page after payment success
  onPaymentSuccess(function () {
    renderCartPage();
  });

  // Mobile nav
  var openNavBtn = $('#open-mobile-nav-btn');
  var closeNavBtn = $('#close-mobile-nav-btn');
  var navBackdrop = $('#mobile-nav-backdrop');
  if (openNavBtn) openNavBtn.addEventListener('click', openMobileNav);
  if (closeNavBtn) closeNavBtn.addEventListener('click', closeMobileNav);
  if (navBackdrop) navBackdrop.addEventListener('click', closeMobileNav);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
