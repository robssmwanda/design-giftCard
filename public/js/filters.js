import { getCatalog } from './catalog.js';
import { discountPercent } from './utils/denomination.js';

var activeCategory = '';
var searchQuery = '';
var sortBy = 'popular';
var maxPrice = 500;
var onlyDiscounted = false;
var renderFn = null;

export function getFilterState() {
  return { activeCategory: activeCategory, searchQuery: searchQuery, sortBy: sortBy, maxPrice: maxPrice, onlyDiscounted: onlyDiscounted };
}

export function setActiveCategory(v) { activeCategory = v; }
export function setSearchQuery(v) { searchQuery = v; }
export function setSortBy(v) { sortBy = v; }
export function setMaxPrice(v) { maxPrice = v; }
export function setOnlyDiscounted(v) { onlyDiscounted = v; }

export function setRenderFn(fn) { renderFn = fn; }

export function resetFilters() {
  searchQuery = '';
  activeCategory = '';
  maxPrice = 500;
  onlyDiscounted = false;
  sortBy = 'popular';
}

export function applyFilters() {
  var CATALOG = getCatalog();
  var result = CATALOG.filter(function (b) { return b.gift_cards && b.gift_cards.length > 0; });

  if (activeCategory) {
    result = result.filter(function (b) { return b.category === activeCategory; });
  }

  if (searchQuery.trim()) {
    var q = searchQuery.toLowerCase();
    result = result.filter(function (b) {
      return (b.name && b.name.toLowerCase().indexOf(q) !== -1) ||
             (b.category && b.category.toLowerCase().indexOf(q) !== -1) ||
             (b.description && b.description.toLowerCase().indexOf(q) !== -1);
    });
  }

  result = result.map(function (b) {
    return {
      ...b,
      gift_cards: b.gift_cards.filter(function (c) { return c.price <= maxPrice; })
    };
  }).filter(function (b) { return b.gift_cards.length > 0; });

  if (onlyDiscounted) {
    result = result.map(function (b) {
      return {
        ...b,
        gift_cards: b.gift_cards.filter(function (c) { return discountPercent(c.denomination, c.price) > 0; })
      };
    }).filter(function (b) { return b.gift_cards.length > 0; });
  }

  result = result.slice();
  if (sortBy === 'price-low') {
    result.sort(function (a, b) {
      return Math.min.apply(null, a.gift_cards.map(function (c) { return c.price; })) -
             Math.min.apply(null, b.gift_cards.map(function (c) { return c.price; }));
    });
  } else if (sortBy === 'price-high') {
    result.sort(function (a, b) {
      return Math.max.apply(null, b.gift_cards.map(function (c) { return c.price; })) -
             Math.max.apply(null, a.gift_cards.map(function (c) { return c.price; }));
    });
  } else if (sortBy === 'discount') {
    result.sort(function (a, b) {
      return Math.max.apply(null, b.gift_cards.map(function (c) { return discountPercent(c.denomination, c.price); })) -
             Math.max.apply(null, a.gift_cards.map(function (c) { return discountPercent(c.denomination, c.price); }));
    });
  } else {
    result.sort(function (a, b) { return (b.popularity || 0) - (a.popularity || 0); });
  }

  if (renderFn) renderFn(result);
}
