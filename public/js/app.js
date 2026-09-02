import { $, $all } from './utils/helpers.js';
import { loadCart, updateCartBadge } from './cart.js';
import { setCatalog } from './catalog.js';
import { setRenderFn, applyFilters, setSearchQuery, setActiveCategory, setSortBy, setMaxPrice, setOnlyDiscounted, resetFilters, getFilterState } from './filters.js';
import { renderGrid, attachGiftCardEvents, setCardClickHandler } from './giftCards.js';
import { openCardModal, closeCardModal, setBuyNowHandler } from './modal.js';
import { openCart, closeCart, setCheckoutEmail, setCheckoutStep, onPaymentSuccess } from './checkout.js';
import { setupHeaderScroll, setupFeaturedCarousel, openMobileNav, closeMobileNav } from './navigation.js';

function init() {
  var CATALOG = window.__CATALOG__ || [];
  setCatalog(CATALOG);
  setRenderFn(renderGrid);

  loadCart();
  updateCartBadge();

  // Wire card click → modal
  setCardClickHandler(function (brandId) { openCardModal(brandId); });

  // Wire buy now → open checkout drawer at details step
  setBuyNowHandler(function (email) {
    setCheckoutEmail(email);
    openCart();
    setCheckoutStep('details');
  });

  // Re-render grid after payment success (badge update)
  onPaymentSuccess(function () { updateCartBadge(); });

  // Cart drawer
  var closeCartBtn = $('#close-cart-btn');
  var cartBackdrop = $('#cart-backdrop');
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
  if (cartBackdrop) cartBackdrop.addEventListener('click', closeCart);

  // Card modal
  var modalClose = $('#card-modal-close');
  var modalBackdrop = $('#card-modal-backdrop');
  if (modalClose) modalClose.addEventListener('click', closeCardModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', function (e) { if (e.target === modalBackdrop) closeCardModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCardModal(); });

  // Mobile nav
  var openNavBtn = $('#open-mobile-nav-btn');
  var closeNavBtn = $('#close-mobile-nav-btn');
  var navBackdrop = $('#mobile-nav-backdrop');
  if (openNavBtn) openNavBtn.addEventListener('click', openMobileNav);
  if (closeNavBtn) closeNavBtn.addEventListener('click', closeMobileNav);
  if (navBackdrop) navBackdrop.addEventListener('click', closeMobileNav);
  $all('.mobile-nav-link').forEach(function (link) { link.addEventListener('click', closeMobileNav); });

  // Mobile bottom nav
  var navHome = $('#nav-home-btn');
  var navBrowse = $('#nav-browse-btn');
  if (navHome) navHome.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  if (navBrowse) navBrowse.addEventListener('click', function () {
    var el = document.getElementById('catalog');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  });

  // Search
  var searchInput = $('#search-input');
  var searchInputMobile = $('#search-input-mobile');
  var searchClearMobile = $('#search-clear-mobile');
  if (searchInput) searchInput.addEventListener('input', function () {
    setSearchQuery(searchInput.value);
    if (searchInputMobile) searchInputMobile.value = searchInput.value;
    applyFilters();
  });
  if (searchInputMobile) searchInputMobile.addEventListener('input', function () {
    setSearchQuery(searchInputMobile.value);
    if (searchInput) searchInput.value = searchInputMobile.value;
    if (searchClearMobile) searchClearMobile.style.display = searchInputMobile.value ? '' : 'none';
    applyFilters();
  });
  if (searchClearMobile) searchClearMobile.addEventListener('click', function () {
    setSearchQuery('');
    if (searchInput) searchInput.value = '';
    if (searchInputMobile) searchInputMobile.value = '';
    searchClearMobile.style.display = 'none';
    applyFilters();
  });

  // Category pills
  $all('.category-pill').forEach(function (pill) {
    pill.addEventListener('click', function () {
      setActiveCategory(pill.getAttribute('data-category'));
      $all('.category-pill').forEach(function (p) {
        p.className = p.className.replace('bg-ink-900 text-white shadow-md', 'bg-white text-ink-600 ring-1 ring-ink-200 hover:ring-ink-300');
      });
      pill.className = pill.className.replace('bg-white text-ink-600 ring-1 ring-ink-200 hover:ring-ink-300', 'bg-ink-900 text-white shadow-md');
      applyFilters();
    });
  });

  // Sale toggle
  var saleToggle = $('#sale-toggle');
  var saleCheckbox = $('#sale-checkbox');
  if (saleToggle) saleToggle.addEventListener('click', function () {
    var state = getFilterState();
    var newVal = !state.onlyDiscounted;
    setOnlyDiscounted(newVal);
    if (newVal) {
      saleToggle.classList.remove('bg-ink-50', 'text-ink-500', 'ring-ink-200');
      saleToggle.classList.add('bg-brand-50', 'text-brand-700', 'ring-brand-200');
      saleCheckbox.classList.remove('bg-ink-300');
      saleCheckbox.classList.add('bg-brand-500');
      saleCheckbox.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
    } else {
      saleToggle.classList.add('bg-ink-50', 'text-ink-500', 'ring-ink-200');
      saleToggle.classList.remove('bg-brand-50', 'text-brand-700', 'ring-brand-200');
      saleCheckbox.classList.add('bg-ink-300');
      saleCheckbox.classList.remove('bg-brand-500');
      saleCheckbox.innerHTML = '';
    }
    applyFilters();
  });

  // Max price slider
  var slider = $('#max-price-slider');
  var sliderLabel = $('#max-price-label');
  if (slider) slider.addEventListener('input', function () {
    var newMax = parseInt(slider.value, 10);
    setMaxPrice(newMax);
    if (sliderLabel) sliderLabel.textContent = '$' + newMax;
    applyFilters();
  });

  // Sort dropdown
  var sortSelect = $('#sort-select');
  if (sortSelect) sortSelect.addEventListener('change', function () {
    setSortBy(sortSelect.value);
    applyFilters();
  });

  // Reset filters
  var resetBtn = $('#reset-filters-btn');
  if (resetBtn) resetBtn.addEventListener('click', function () {
    resetFilters();
    if (searchInput) searchInput.value = '';
    if (searchInputMobile) searchInputMobile.value = '';
    if (slider) slider.value = '500';
    if (sliderLabel) sliderLabel.textContent = '$500';
    if (sortSelect) sortSelect.value = 'popular';
    $all('.category-pill').forEach(function (p) {
      p.className = p.className.replace('bg-white text-ink-600 ring-1 ring-ink-200 hover:ring-ink-300', 'bg-ink-900 text-white shadow-md');
      if (p.getAttribute('data-category') !== '') {
        p.className = p.className.replace('bg-ink-900 text-white shadow-md', 'bg-white text-ink-600 ring-1 ring-ink-200 hover:ring-ink-300');
      }
    });
    if (saleToggle) {
      saleToggle.classList.add('bg-ink-50', 'text-ink-500', 'ring-ink-200');
      saleToggle.classList.remove('bg-brand-50', 'text-brand-700', 'ring-brand-200');
      saleCheckbox.classList.add('bg-ink-300');
      saleCheckbox.classList.remove('bg-brand-500');
      saleCheckbox.innerHTML = '';
    }
    applyFilters();
  });

  // Attach events to server-rendered gift cards
  attachGiftCardEvents();

  // Header scroll
  setupHeaderScroll();

  // Featured carousel
  setupFeaturedCarousel();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
