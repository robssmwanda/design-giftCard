import { $, $all } from './utils/helpers.js';
import { formatCurrency } from './utils/currency.js';
import { discountPercent } from './utils/denomination.js';

var onCardClick = null;

export function setCardClickHandler(fn) { onCardClick = fn; }

export function renderGrid(brands) {
  var grid = $('#gift-card-grid');
  var empty = $('#empty-state');
  var countEl = $('#filter-result-count');
  var catalogCount = $('#catalog-count');

  if (!grid) return;

  var totalCards = brands.reduce(function (s, b) { return s + b.gift_cards.length; }, 0);
  if (countEl) countEl.textContent = totalCards + ' cards';
  if (catalogCount) catalogCount.textContent = brands.length + ' brands · ' + totalCards + ' gift cards available';

  if (brands.length === 0) {
    grid.style.display = 'none';
    if (empty) empty.style.display = '';
    return;
  }

  grid.style.display = '';
  if (empty) empty.style.display = 'none';

  var template = $('#gift-card-template');
  grid.innerHTML = '';

  var MAX_DISPLAY = 16;
  brands.slice(0, MAX_DISPLAY).forEach(function (brand) {
    var clone = template.content.cloneNode(true);
    var card = clone.querySelector('.gift-card-item');
    var accent = brand.accent_color || '#0F172A';
    var accent2 = brand.accent_color_2 || '#334155';
    var cards = brand.gift_cards || [];
    var firstCard = cards[0] || null;
    var discount = firstCard ? discountPercent(firstCard.denomination, firstCard.price) : 0;

    card.setAttribute('data-brand-id', brand.id);
    card.setAttribute('data-brand-name', brand.name);
    card.setAttribute('data-accent', accent);
    card.setAttribute('data-accent2', accent2);

    var visual = clone.querySelector('.card-visual');
    visual.style.background = 'linear-gradient(135deg, ' + accent + ' 0%, ' + accent2 + ' 100%)';

    clone.querySelector('.card-name').textContent = brand.name;
    clone.querySelector('.card-category').textContent = brand.category;
    clone.querySelector('.card-denom-display').textContent = firstCard ? formatCurrency(firstCard.denomination) : '—';
    clone.querySelector('.card-desc').textContent = brand.description || 'Premium digital gift card.';

    // Denominations (max 15 displayed)
    var denomsContainer = clone.querySelector('.card-denoms');
    cards.slice(0, 15).forEach(function (c, idx) {
      var btn = document.createElement('button');
      var cardDiscount = discountPercent(c.denomination, c.price);
      btn.className = 'denom-btn relative rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all active:scale-95 ' +
        (idx === 0 ? 'bg-ink-900 text-white shadow-sm' : 'bg-ink-100 text-ink-600 hover:bg-ink-200');
      btn.setAttribute('data-card-id', c.id);
      btn.setAttribute('data-denomination', c.denomination);
      btn.setAttribute('data-price', c.price);
      btn.innerHTML = formatCurrency(c.denomination);
      if (cardDiscount > 0) {
        var span = document.createElement('span');
        span.className = 'ml-1 text-[10px] font-bold ' + (idx === 0 ? 'text-brand-400' : 'text-brand-600');
        span.textContent = '-' + cardDiscount + '%';
        btn.appendChild(span);
      }
      denomsContainer.appendChild(btn);
    });

    // Price display
    var priceStrike = clone.querySelector('.card-price-strike');
    var priceDisplay = clone.querySelector('.card-price-display');
    if (firstCard) {
      priceDisplay.textContent = formatCurrency(firstCard.price);
      if (discount > 0) {
        priceStrike.textContent = formatCurrency(firstCard.denomination);
        priceStrike.style.display = '';
      } else {
        priceStrike.style.display = 'none';
      }
    } else {
      priceDisplay.textContent = '—';
      priceStrike.style.display = 'none';
    }

    // Savings badge
    var savingsBadge = clone.querySelector('.card-savings');
    var savingsText = clone.querySelector('.card-savings-text');
    if (discount > 0 && firstCard) {
      savingsBadge.style.display = '';
      savingsText.textContent = 'You save ' + formatCurrency(firstCard.denomination - firstCard.price) + ' (' + discount + '%)';
    } else {
      savingsBadge.style.display = 'none';
    }

    // Add to cart button
    var addBtn = clone.querySelector('.card-add-btn');
    if (firstCard) {
      addBtn.setAttribute('data-card-id', firstCard.id);
      addBtn.setAttribute('data-denomination', firstCard.denomination);
      addBtn.setAttribute('data-price', firstCard.price);
    }

    grid.appendChild(clone);
  });

  attachGiftCardEvents();
}

export function attachGiftCardEvents() {
  $all('.gift-card-item').forEach(function (card) {
    var brandId = card.getAttribute('data-brand-id');
    var brandName = card.getAttribute('data-brand-name');
    var accent = card.getAttribute('data-accent');
    var accent2 = card.getAttribute('data-accent2');

    // Denomination buttons
    var denomBtns = $all('.denom-btn', card);
    denomBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        denomBtns.forEach(function (b) {
          b.className = b.className.replace('bg-ink-900 text-white shadow-sm', 'bg-ink-100 text-ink-600 hover:bg-ink-200');
          var disc = b.querySelector('span');
          if (disc) disc.className = 'ml-1 text-[10px] font-bold text-brand-600';
        });
        btn.className = btn.className.replace('bg-ink-100 text-ink-600 hover:bg-ink-200', 'bg-ink-900 text-white shadow-sm');
        var disc = btn.querySelector('span');
        if (disc) disc.className = 'ml-1 text-[10px] font-bold text-brand-400';

        var denom = parseFloat(btn.getAttribute('data-denomination'));
        var price = parseFloat(btn.getAttribute('data-price'));
        var cardId = btn.getAttribute('data-card-id');
        var discount = discountPercent(denom, price);

        // Update display
        card.querySelector('.card-denom-display').textContent = formatCurrency(denom);
        card.querySelector('.card-price-display').textContent = formatCurrency(price);
        var strike = card.querySelector('.card-price-strike');
        if (discount > 0) {
          strike.textContent = formatCurrency(denom);
          strike.style.display = '';
        } else {
          strike.style.display = 'none';
        }

        var savingsBadge = card.querySelector('.card-savings');
        var savingsText = card.querySelector('.card-savings-text');
        if (discount > 0) {
          savingsBadge.style.display = '';
          savingsText.textContent = 'You save ' + formatCurrency(denom - price) + ' (' + discount + '%)';
        } else {
          savingsBadge.style.display = 'none';
        }

        // Update add button
        var addBtn = card.querySelector('.card-add-btn');
        addBtn.setAttribute('data-card-id', cardId);
        addBtn.setAttribute('data-denomination', denom);
        addBtn.setAttribute('data-price', price);
      });
    });

    // Click anywhere on the card opens the modal
    card.addEventListener('click', function (e) {
      if (e.target.closest('.denom-btn') || e.target.closest('.card-add-btn')) return;
      if (onCardClick) onCardClick(brandId);
    });

    // Add to cart — opens modal instead of direct add
    var addBtn = card.querySelector('.card-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (onCardClick) onCardClick(brandId);
      });
    }
  });
}
