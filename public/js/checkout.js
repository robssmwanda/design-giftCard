import { $, escapeHtml, isValidEmail } from './utils/helpers.js';
import { formatCurrency } from './utils/currency.js';
import { getCart, cartCount, cartSubtotal, cartSavings, clearCart, removeItem, setQuantity, updateCartBadge, onCartChange } from './cart.js';

var checkoutStep = 'cart';
var checkoutEmail = '';
var selectedPaymentMethod = 'card';
var pawapayCountries = [];
var pawapayProviders = [];
var selectedCountry = '';
var selectedProvider = '';
var phoneNumber = '';
var isProcessing = false;
var currentPaymentId = null;
var pollTimer = null;
var paySuccessCallbacks = [];

export function getCheckoutEmail() { return checkoutEmail; }
export function setCheckoutEmail(v) { checkoutEmail = v; }
export function getCheckoutStep() { return checkoutStep; }
export function setCheckoutStep(v) { checkoutStep = v; }

export function onPaymentSuccess(fn) { paySuccessCallbacks.push(fn); }

export function openCart() {
  checkoutStep = 'cart';
  var backdrop = $('#cart-backdrop');
  var drawer = $('#cart-drawer');
  if (backdrop) { backdrop.classList.remove('opacity-0', 'pointer-events-none'); backdrop.classList.add('opacity-100'); }
  if (drawer) { drawer.classList.remove('translate-x-full'); drawer.classList.add('translate-x-0'); }
  document.body.style.overflow = 'hidden';
  renderCartContent();
  renderCartFooter();
}

export function closeCart() {
  var backdrop = $('#cart-backdrop');
  var drawer = $('#cart-drawer');
  if (backdrop) { backdrop.classList.add('opacity-0', 'pointer-events-none'); backdrop.classList.remove('opacity-100'); }
  if (drawer) { drawer.classList.add('translate-x-full'); drawer.classList.remove('translate-x-0'); }
  document.body.style.overflow = '';
  stopPolling();
}

function stopPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
}

function renderCartContent() {
  var content = $('#cart-content');
  var title = $('#cart-title');
  var countPill = $('#cart-count-pill');
  if (!content) return;

  if (title) {
    title.textContent = checkoutStep === 'success' ? 'Order confirmed' : 'Your cart';
  }
  if (countPill) {
    var count = cartCount();
    if (count > 0 && checkoutStep !== 'success') {
      countPill.textContent = count;
      countPill.style.display = '';
    } else {
      countPill.style.display = 'none';
    }
  }

  if (checkoutStep === 'cart') {
    renderCartList(content);
  } else if (checkoutStep === 'details') {
    renderDetails(content);
  } else if (checkoutStep === 'payment') {
    renderPayment(content);
  } else if (checkoutStep === 'processing') {
    renderProcessing(content);
  } else if (checkoutStep === 'mobile-money') {
    renderMobileMoney(content);
  } else if (checkoutStep === 'mm-processing') {
    renderMmProcessing(content);
  } else if (checkoutStep === 'success') {
    renderSuccess(content);
  } else if (checkoutStep === 'error') {
    renderError(content);
  }
}

function renderCartList(container) {
  var cart = getCart();
  if (cart.length === 0) {
    container.innerHTML =
      '<div class="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">' +
        '<div class="flex h-16 w-16 items-center justify-center rounded-full bg-ink-100">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ink-400"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>' +
        '</div>' +
        '<div><h3 class="font-display text-lg font-bold text-ink-900">Your cart is empty</h3>' +
        '<p class="mt-1 text-sm text-ink-500">Browse our marketplace and find the perfect gift card.</p></div>' +
        '<button id="empty-cart-browse" class="rounded-full bg-ink-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink-800 active:scale-95">Browse gift cards</button>' +
      '</div>';
    var browseBtn = $('#empty-cart-browse');
    if (browseBtn) browseBtn.addEventListener('click', closeCart);
    return;
  }

  var template = $('#cart-item-template');
  container.innerHTML = '';
  var wrapper = document.createElement('div');
  wrapper.className = 'flex flex-col gap-3 p-5';
  cart.forEach(function (item) {
    var clone = template.content.cloneNode(true);
    var visual = clone.querySelector('.cart-card-visual');
    visual.style.background = 'linear-gradient(135deg, ' + item.accentColor + ' 0%, ' + item.accentColor2 + ' 100%)';
    clone.querySelector('.cart-brand-name').textContent = item.brandName;
    clone.querySelector('.cart-denom').textContent = formatCurrency(item.denomination);
    clone.querySelector('.cart-brand-title').textContent = item.brandName;
    clone.querySelector('.cart-denom-label').textContent = formatCurrency(item.denomination) + ' gift card';
    clone.querySelector('.cart-qty').textContent = item.quantity;
    clone.querySelector('.cart-line-total').textContent = formatCurrency(item.price * item.quantity);

    var titleEl = clone.querySelector('.cart-brand-title');
    if (item.deliveryEmail) {
      var emailP = document.createElement('p');
      emailP.className = 'text-xs text-ink-400 truncate';
      emailP.textContent = item.deliveryEmail;
      titleEl.insertAdjacentElement('afterend', emailP);
    }

    (function (id, email, qty) {
      clone.querySelector('.cart-remove').addEventListener('click', function () { removeItem(id, email); });
      clone.querySelector('.cart-dec').addEventListener('click', function () { setQuantity(id, email, qty - 1); });
      clone.querySelector('.cart-inc').addEventListener('click', function () { setQuantity(id, email, qty + 1); });
    })(item.giftCardId, item.deliveryEmail, item.quantity);

    wrapper.appendChild(clone);
  });
  container.appendChild(wrapper);
}

function renderOrderSummary() {
  var cart = getCart();
  var subtotal = cartSubtotal();
  var savings = cartSavings();
  var total = subtotal;
  var rows = cart.map(function (item) {
    return '<div class="flex justify-between text-sm">' +
      '<span class="text-ink-600">' + escapeHtml(item.brandName) + ' × ' + item.quantity + '</span>' +
      '<span class="font-medium text-ink-800">' + formatCurrency(item.price * item.quantity) + '</span>' +
    '</div>';
  }).join('');

  var savingsHtml = savings > 0 ?
    '<div class="flex justify-between text-sm"><span class="text-brand-600">Total savings</span><span class="font-semibold text-brand-600">-' + formatCurrency(savings) + '</span></div>' : '';

  return '<div class="mt-6 rounded-xl bg-ink-50 p-4">' +
    '<h4 class="mb-3 text-sm font-semibold text-ink-700">Order summary</h4>' +
    '<div class="space-y-2">' + rows + '</div>' +
    '<div class="mt-3 space-y-1.5 border-t border-ink-200 pt-3">' + savingsHtml +
    '<div class="flex justify-between"><span class="text-sm font-medium text-ink-600">Total</span><span class="font-display text-lg font-bold text-ink-900">' + formatCurrency(total) + '</span></div>' +
    '</div></div>';
}

function renderDetails(container) {
  var total = cartSubtotal();
  container.innerHTML =
    '<div class="p-5 animate-fade-in">' +
      '<h3 class="font-display text-base font-bold text-ink-900">Delivery details</h3>' +
      '<p class="mt-1 text-sm text-ink-500">Your gift cards will be emailed here instantly.</p>' +
      '<div class="mt-5">' +
        '<label class="mb-1.5 block text-sm font-medium text-ink-700">Email address</label>' +
        '<input type="email" id="checkout-email" value="' + escapeHtml(checkoutEmail) + '" placeholder="you@example.com" class="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-800 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10" />' +
      '</div>' +
      renderOrderSummary() +
    '</div>';

  var emailInput = $('#checkout-email');
  if (emailInput) {
    emailInput.addEventListener('input', function () {
      checkoutEmail = emailInput.value;
      updateDetailsContinue();
    });
  }
}

function renderPayment(container) {
  container.innerHTML =
    '<div class="p-5 animate-fade-in">' +
      '<h3 class="font-display text-base font-bold text-ink-900">Payment method</h3>' +
      '<p class="mt-1 text-sm text-ink-500">Choose how you want to pay.</p>' +
      '<div class="mt-5 space-y-3">' +
        '<button id="pay-method-card" class="pay-method-option flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ' + (selectedPaymentMethod === 'card' ? 'border-brand-500 bg-brand-50' : 'border-ink-200 bg-white hover:border-ink-300') + '">' +
          '<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-900 text-white">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>' +
          '</div>' +
          '<div class="flex-1">' +
            '<p class="text-sm font-semibold text-ink-900">Card</p>' +
            '<p class="text-xs text-ink-500">Pay securely with Visa, Mastercard via Stripe</p>' +
          '</div>' +
          '<div class="pay-method-radio ' + (selectedPaymentMethod === 'card' ? 'pay-method-radio-active' : '') + '"></div>' +
        '</button>' +
        '<button id="pay-method-mm" class="pay-method-option flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ' + (selectedPaymentMethod === 'mobile_money' ? 'border-brand-500 bg-brand-50' : 'border-ink-200 bg-white hover:border-ink-300') + '">' +
          '<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-white">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>' +
          '</div>' +
          '<div class="flex-1">' +
            '<p class="text-sm font-semibold text-ink-900">Mobile Money</p>' +
            '<p class="text-xs text-ink-500">Pay with MTN, Airtel, Orange Money and more</p>' +
          '</div>' +
          '<div class="pay-method-radio ' + (selectedPaymentMethod === 'mobile_money' ? 'pay-method-radio-active' : '') + '"></div>' +
        '</button>' +
      '</div>' +
      renderOrderSummary() +
    '</div>';

  var cardBtn = $('#pay-method-card');
  var mmBtn = $('#pay-method-mm');
  if (cardBtn) cardBtn.addEventListener('click', function () {
    selectedPaymentMethod = 'card';
    renderCartContent();
    renderCartFooter();
  });
  if (mmBtn) mmBtn.addEventListener('click', function () {
    selectedPaymentMethod = 'mobile_money';
    renderCartContent();
    renderCartFooter();
  });
}

function renderMobileMoney(container) {
  var countryOptions = pawapayCountries.map(function (c) {
    return '<option value="' + escapeHtml(c.code) + '"' + (c.code === selectedCountry ? ' selected' : '') + '>' + escapeHtml(c.name) + (c.flag ? ' ' + c.flag : '') + '</option>';
  }).join('');

  var providerHtml = '';
  if (selectedCountry && pawapayProviders.length > 0) {
    providerHtml = pawapayProviders.map(function (p) {
      return '<button class="mm-provider-btn rounded-xl border-2 p-3 text-left transition-all ' + (p.code === selectedProvider ? 'border-brand-500 bg-brand-50' : 'border-ink-200 bg-white hover:border-ink-300') + '" data-provider="' + escapeHtml(p.code) + '">' +
        '<p class="text-sm font-semibold text-ink-900">' + escapeHtml(p.name) + '</p>' +
      '</button>';
    }).join('');
  } else if (selectedCountry) {
    providerHtml = '<p class="text-sm text-ink-400">Loading providers...</p>';
  } else {
    providerHtml = '<p class="text-sm text-ink-400">Select a country first</p>';
  }

  container.innerHTML =
    '<div class="p-5 animate-fade-in">' +
      '<h3 class="font-display text-base font-bold text-ink-900">Mobile Money Payment</h3>' +
      '<p class="mt-1 text-sm text-ink-500">Select your country, provider, and enter your phone number.</p>' +
      '<div class="mt-5 space-y-4">' +
        '<div>' +
          '<label class="mb-1.5 block text-sm font-medium text-ink-700">Country</label>' +
          '<select id="mm-country" class="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-800 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10">' +
            '<option value="">Select country...</option>' + countryOptions +
          '</select>' +
        '</div>' +
        '<div>' +
          '<label class="mb-1.5 block text-sm font-medium text-ink-700">Mobile Money Provider</label>' +
          '<div class="grid grid-cols-1 gap-2">' + providerHtml + '</div>' +
        '</div>' +
        '<div>' +
          '<label class="mb-1.5 block text-sm font-medium text-ink-700">Phone Number</label>' +
          '<input type="tel" id="mm-phone" value="' + escapeHtml(phoneNumber) + '" placeholder="e.g. 260763456789" class="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-800 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10" />' +
          '<p class="mt-1 text-xs text-ink-400">Enter your number with country code, no spaces or +.</p>' +
        '</div>' +
      '</div>' +
      renderOrderSummary() +
    '</div>';

  var countrySelect = $('#mm-country');
  if (countrySelect) countrySelect.addEventListener('change', async function () {
    selectedCountry = countrySelect.value;
    selectedProvider = '';
    pawapayProviders = [];
    renderCartContent();
    renderCartFooter();
    if (selectedCountry) {
      try {
        var res = await fetch('/api/payments/pawapay/providers?countryCode=' + encodeURIComponent(selectedCountry));
        var data = await res.json();
        pawapayProviders = data.providers || [];
        renderCartContent();
        renderCartFooter();
      } catch (e) {
        console.error('Failed to load providers:', e);
      }
    }
  });

  var phoneInput = $('#mm-phone');
  if (phoneInput) phoneInput.addEventListener('input', function () {
    phoneNumber = phoneInput.value;
    updateMmPay();
  });

  $all('.mm-provider-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      selectedProvider = btn.getAttribute('data-provider');
      renderCartContent();
      renderCartFooter();
    });
  });
}

function renderProcessing(container) {
  container.innerHTML =
    '<div class="flex h-full flex-col items-center justify-center gap-4 p-8 text-center animate-fade-in">' +
      '<div class="h-12 w-12 animate-spin rounded-full border-4 border-ink-200 border-t-brand-500"></div>' +
      '<p class="font-display text-lg font-bold text-ink-900">Redirecting to Stripe...</p>' +
      '<p class="text-sm text-ink-500">You will be redirected to complete your payment securely.</p>' +
    '</div>';
}

function renderMmProcessing(container) {
  container.innerHTML =
    '<div class="flex h-full flex-col items-center justify-center gap-4 p-8 text-center animate-fade-in">' +
      '<div class="h-12 w-12 animate-spin rounded-full border-4 border-ink-200 border-t-brand-500"></div>' +
      '<p class="font-display text-lg font-bold text-ink-900">Waiting for confirmation...</p>' +
      '<p class="text-sm text-ink-500">Check your phone and enter your Mobile Money PIN to confirm the payment.</p>' +
      '<div id="mm-poll-status" class="mt-2 text-xs text-ink-400">Status: processing...</div>' +
    '</div>';
}

function renderSuccess(container) {
  container.innerHTML =
    '<div class="flex h-full flex-col items-center justify-center gap-4 p-8 text-center animate-fade-in">' +
      '<div class="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-brand-500"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>' +
      '</div>' +
      '<h3 class="font-display text-xl font-bold text-ink-900">Payment successful!</h3>' +
      '<p class="max-w-xs text-sm text-ink-500">Your gift cards have been emailed to ' + escapeHtml(checkoutEmail || 'your inbox') + '. Enjoy!</p>' +
      '<button id="success-continue" class="mt-2 rounded-full bg-ink-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink-800 active:scale-95">Continue shopping</button>' +
    '</div>';
  var btn = $('#success-continue');
  if (btn) btn.addEventListener('click', closeCart);
}

function renderError(container) {
  container.innerHTML =
    '<div class="flex h-full flex-col items-center justify-center gap-4 p-8 text-center animate-fade-in">' +
      '<div class="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>' +
      '</div>' +
      '<h3 class="font-display text-xl font-bold text-ink-900">Payment failed</h3>' +
      '<p class="max-w-xs text-sm text-ink-500" id="error-message">Something went wrong with your payment. Please try again.</p>' +
      '<button id="error-retry" class="mt-2 rounded-full bg-ink-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink-800 active:scale-95">Try again</button>' +
    '</div>';
  var btn = $('#error-retry');
  if (btn) btn.addEventListener('click', function () {
    checkoutStep = 'payment';
    renderCartContent();
    renderCartFooter();
  });
}

function renderCartFooter() {
  var footer = $('#cart-footer');
  if (!footer) return;
  var subtotal = cartSubtotal();
  var savings = cartSavings();
  var total = subtotal;

  if (checkoutStep === 'cart' && getCart().length > 0) {
    var savingsHtml = savings > 0 ?
      '<div class="mb-3 flex items-center justify-between text-sm"><span class="text-brand-600">You\'re saving</span><span class="font-semibold text-brand-600">' + formatCurrency(savings) + '</span></div>' : '';
    footer.innerHTML =
      '<div class="mb-3 flex items-center justify-between"><span class="text-sm text-ink-500">Subtotal</span><span class="font-display text-lg font-bold text-ink-900">' + formatCurrency(subtotal) + '</span></div>' +
      savingsHtml +
      '<button id="checkout-btn" class="flex w-full items-center justify-center gap-2 rounded-full bg-ink-900 py-3.5 text-sm font-semibold text-white transition-all hover:bg-ink-800 active:scale-95">Checkout <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></button>';
    footer.style.display = '';
    var btn = $('#checkout-btn');
    if (btn) btn.addEventListener('click', function () { checkoutStep = 'details'; renderCartContent(); renderCartFooter(); });
  } else if (checkoutStep === 'details') {
    footer.innerHTML =
      '<div class="mb-3 flex items-center justify-between"><span class="text-sm text-ink-500">Total</span><span class="font-display text-lg font-bold text-ink-900">' + formatCurrency(total) + '</span></div>' +
      '<div class="flex gap-2">' +
        '<button id="details-back" class="rounded-full bg-ink-100 px-5 py-3.5 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-200 active:scale-95">Back</button>' +
        '<button id="details-continue" class="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink-900 py-3.5 text-sm font-semibold text-white transition-all hover:bg-ink-800 active:scale-95 disabled:opacity-40">Continue <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></button>' +
      '</div>';
    footer.style.display = '';
    $('#details-back').addEventListener('click', function () { checkoutStep = 'cart'; renderCartContent(); renderCartFooter(); });
    $('#details-continue').addEventListener('click', async function () {
      checkoutStep = 'payment';
      renderCartContent();
      renderCartFooter();
      await loadPawapayConfig();
    });
    updateDetailsContinue();
  } else if (checkoutStep === 'payment') {
    footer.innerHTML =
      '<div class="mb-3 flex items-center justify-between"><span class="text-sm text-ink-500">Total</span><span class="font-display text-lg font-bold text-ink-900">' + formatCurrency(total) + '</span></div>' +
      '<div class="flex gap-2">' +
        '<button id="payment-back" class="rounded-full bg-ink-100 px-5 py-3.5 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-200 active:scale-95">Back</button>' +
        '<button id="payment-pay" class="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition-all hover:bg-brand-400 active:scale-95 disabled:opacity-40"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Pay ' + formatCurrency(total) + '</button>' +
      '</div>' +
      '<div class="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-400"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg> 256-bit SSL encrypted</div>';
    footer.style.display = '';
    $('#payment-back').addEventListener('click', function () { checkoutStep = 'details'; renderCartContent(); renderCartFooter(); });
    $('#payment-pay').addEventListener('click', handlePay);
  } else if (checkoutStep === 'mobile-money') {
    footer.innerHTML =
      '<div class="mb-3 flex items-center justify-between"><span class="text-sm text-ink-500">Total</span><span class="font-display text-lg font-bold text-ink-900">' + formatCurrency(total) + '</span></div>' +
      '<div class="flex gap-2">' +
        '<button id="mm-back" class="rounded-full bg-ink-100 px-5 py-3.5 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-200 active:scale-95">Back</button>' +
        '<button id="mm-pay" class="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition-all hover:bg-brand-400 active:scale-95 disabled:opacity-40"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg> Confirm ' + formatCurrency(total) + '</button>' +
      '</div>';
    footer.style.display = '';
    $('#mm-back').addEventListener('click', function () { checkoutStep = 'payment'; renderCartContent(); renderCartFooter(); });
    $('#mm-pay').addEventListener('click', handleMmPay);
    updateMmPay();
  } else if (checkoutStep === 'processing' || checkoutStep === 'mm-processing' || checkoutStep === 'success' || checkoutStep === 'error') {
    footer.style.display = 'none';
  } else {
    footer.style.display = 'none';
  }
}

function updateDetailsContinue() {
  var btn = $('#details-continue');
  if (!btn) return;
  var valid = checkoutEmail.includes('@') && checkoutEmail.includes('.');
  btn.disabled = !valid;
  if (valid) btn.classList.remove('disabled:opacity-40', 'opacity-40');
  else btn.classList.add('opacity-40');
}

function updateMmPay() {
  var btn = $('#mm-pay');
  if (!btn) return;
  var valid = selectedCountry && selectedProvider && phoneNumber.replace(/\s/g, '').length >= 8;
  btn.disabled = !valid || isProcessing;
  if (valid && !isProcessing) btn.classList.remove('opacity-40');
  else btn.classList.add('opacity-40');
}

async function loadPawapayConfig() {
  if (pawapayCountries.length > 0) return;
  try {
    var res = await fetch('/api/payments/pawapay/config');
    var data = await res.json();
    pawapayCountries = data.countries || [];
  } catch (e) {
    console.error('Failed to load PawaPay config:', e);
  }
}

async function handlePay() {
  if (isProcessing) return;
  isProcessing = true;

  var cart = getCart();
  if (cart.length === 0) { isProcessing = false; return; }

  var payBtn = $('#payment-pay');
  if (payBtn) { payBtn.disabled = true; payBtn.classList.add('opacity-60'); }

  try {
    var orderRes = await fetch('/api/payments/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart, customerEmail: checkoutEmail }),
    });
    var orderData = await orderRes.json();
    if (!orderRes.ok) throw new Error(orderData.error || 'Failed to create order');

    if (selectedPaymentMethod === 'card') {
      checkoutStep = 'processing';
      renderCartContent();
      renderCartFooter();

      var stripeRes = await fetch('/api/payments/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderData.orderId }),
      });
      var stripeData = await stripeRes.json();
      if (!stripeRes.ok) throw new Error(stripeData.error || 'Failed to start payment');
      currentPaymentId = stripeData.paymentId;
      window.location.href = stripeData.url;
    } else if (selectedPaymentMethod === 'mobile_money') {
      checkoutStep = 'mobile-money';
      renderCartContent();
      renderCartFooter();
      await loadPawapayConfig();
      renderCartContent();
      renderCartFooter();
    }
  } catch (err) {
    console.error('Payment error:', err);
    checkoutStep = 'error';
    renderCartContent();
    renderCartFooter();
    var errEl = $('#error-message');
    if (errEl) errEl.textContent = err.message || 'Something went wrong. Please try again.';
  } finally {
    isProcessing = false;
    if (payBtn) { payBtn.disabled = false; payBtn.classList.remove('opacity-60'); }
  }
}

async function handleMmPay() {
  if (isProcessing) return;
  isProcessing = true;

  var mmPayBtn = $('#mm-pay');
  if (mmPayBtn) { mmPayBtn.disabled = true; mmPayBtn.classList.add('opacity-60'); }

  var cart = getCart();
  if (cart.length === 0) { isProcessing = false; return; }

  try {
    var orderRes = await fetch('/api/payments/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart, customerEmail: checkoutEmail }),
    });
    var orderData = await orderRes.json();
    if (!orderRes.ok) throw new Error(orderData.error || 'Failed to create order');

    var depositRes = await fetch('/api/payments/pawapay/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: orderData.orderId,
        country: selectedCountry,
        provider: selectedProvider,
        phoneNumber: phoneNumber.replace(/\s/g, ''),
      }),
    });
    var depositData = await depositRes.json();
    if (!depositRes.ok) throw new Error(depositData.error || 'Failed to initiate mobile money payment');

    currentPaymentId = depositData.paymentId;
    checkoutStep = 'mm-processing';
    renderCartContent();
    renderCartFooter();
    startPolling(depositData.paymentId);
  } catch (err) {
    console.error('Mobile money payment error:', err);
    checkoutStep = 'error';
    renderCartContent();
    renderCartFooter();
    var errEl = $('#error-message');
    if (errEl) errEl.textContent = err.message || 'Something went wrong. Please try again.';
  } finally {
    isProcessing = false;
    if (mmPayBtn) { mmPayBtn.disabled = false; mmPayBtn.classList.remove('opacity-60'); }
  }
}

function startPolling(paymentId) {
  stopPolling();
  var attempts = 0;
  var maxAttempts = 60;
  pollTimer = setInterval(async function () {
    attempts++;
    if (attempts > maxAttempts) {
      stopPolling();
      checkoutStep = 'error';
      var errEl = $('#error-message');
      if (errEl) errEl.textContent = 'Payment confirmation timed out. Please check your phone and try again.';
      renderCartContent();
      renderCartFooter();
      return;
    }

    try {
      var res = await fetch('/api/payments/status/' + paymentId);
      var data = await res.json();

      if (data.status === 'paid') {
        stopPolling();
        clearCart();
        checkoutStep = 'success';
        renderCartContent();
        renderCartFooter();
        paySuccessCallbacks.forEach(function (fn) { fn(); });
      } else if (data.status === 'failed' || data.status === 'cancelled' || data.status === 'expired') {
        stopPolling();
        checkoutStep = 'error';
        renderCartContent();
        renderCartFooter();
        var errEl2 = $('#error-message');
        if (errEl2) errEl2.textContent = data.failureReason || 'Payment ' + data.status + '. Please try again.';
      } else {
        var pollStatus = $('#mm-poll-status');
        if (pollStatus) pollStatus.textContent = 'Status: ' + data.status + '...';
      }
    } catch (e) {
      console.error('Polling error:', e);
    }
  }, 5000);
}

// Re-render cart drawer when cart changes (remove/qty from inside the drawer)
onCartChange(function () {
  renderCartContent();
  renderCartFooter();
});
