import { $ } from './utils/helpers.js';

var STORAGE_KEY = 'kadopay-cart';
var cart = [];
var changeCallbacks = [];

export function getCart() { return cart; }

export function loadCart() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (raw) cart = JSON.parse(raw);
  } catch (e) {
    cart = [];
  }
}

export function saveCart() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch (e) {}
}

export function cartCount() {
  return cart.reduce(function (s, i) { return s + i.quantity; }, 0);
}

export function cartSubtotal() {
  return cart.reduce(function (s, i) { return s + i.price * i.quantity; }, 0);
}

export function cartSavings() {
  return cart.reduce(function (s, i) { return s + (i.denomination - i.price) * i.quantity; }, 0);
}

export function addItem(item) {
  var existing = null;
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].giftCardId === item.giftCardId && cart[i].deliveryEmail === item.deliveryEmail) {
      existing = cart[i];
      break;
    }
  }
  if (existing) {
    existing.quantity += (item.quantity || 1);
  } else {
    cart.push({
      giftCardId: item.giftCardId,
      brandId: item.brandId,
      brandName: item.brandName,
      brandSlug: item.brandSlug,
      denomination: item.denomination,
      price: item.price,
      accentColor: item.accentColor,
      accentColor2: item.accentColor2,
      quantity: item.quantity || 1,
      deliveryEmail: item.deliveryEmail || '',
    });
  }
  saveCart();
  updateCartBadge();
}

export function removeItem(giftCardId, deliveryEmail) {
  cart = cart.filter(function (i) {
    return !(i.giftCardId === giftCardId && i.deliveryEmail === deliveryEmail);
  });
  saveCart();
  updateCartBadge();
  notifyChange();
}

export function setQuantity(giftCardId, deliveryEmail, qty) {
  if (qty <= 0) {
    removeItem(giftCardId, deliveryEmail);
    return;
  }
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].giftCardId === giftCardId && cart[i].deliveryEmail === deliveryEmail) {
      cart[i].quantity = qty;
      break;
    }
  }
  saveCart();
  updateCartBadge();
  notifyChange();
}

export function clearCart() {
  cart = [];
  saveCart();
  updateCartBadge();
}

export function updateCartBadge() {
  var count = cartCount();
  var badge = $('#cart-badge');
  var badgeMobile = $('#cart-badge-mobile');
  if (badge) {
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = '';
    } else {
      badge.style.display = 'none';
    }
  }
  if (badgeMobile) {
    if (count > 0) {
      badgeMobile.textContent = count;
      badgeMobile.style.display = '';
    } else {
      badgeMobile.style.display = 'none';
    }
  }
}

export function onCartChange(fn) {
  changeCallbacks.push(fn);
}

function notifyChange() {
  changeCallbacks.forEach(function (fn) { fn(); });
}
