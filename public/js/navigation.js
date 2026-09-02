import { $, $all } from './utils/helpers.js';

export function setupHeaderScroll() {
  var header = $('#site-header');
  if (!header) return;
  function onScroll() {
    if (window.scrollY > 8) {
      header.classList.add('glass', 'bg-white/80', 'shadow-sm', 'border-ink-200/60');
      header.classList.remove('bg-white/0', 'border-transparent');
    } else {
      header.classList.remove('glass', 'bg-white/80', 'shadow-sm', 'border-ink-200/60');
      header.classList.add('bg-white/0', 'border-transparent');
    }
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

export function setupFeaturedCarousel() {
  var scroll = $('#featured-scroll');
  var leftBtn = $('#featured-scroll-left');
  var rightBtn = $('#featured-scroll-right');
  if (!scroll) return;
  if (leftBtn) leftBtn.addEventListener('click', function () { scroll.scrollBy({ left: -320, behavior: 'smooth' }); });
  if (rightBtn) rightBtn.addEventListener('click', function () { scroll.scrollBy({ left: 320, behavior: 'smooth' }); });
}

export function openMobileNav() {
  var backdrop = $('#mobile-nav-backdrop');
  var drawer = $('#mobile-nav-drawer');
  if (backdrop) { backdrop.classList.remove('opacity-0', 'pointer-events-none'); backdrop.classList.add('opacity-100'); }
  if (drawer) { drawer.classList.remove('-translate-x-full'); drawer.classList.add('translate-x-0'); }
}

export function closeMobileNav() {
  var backdrop = $('#mobile-nav-backdrop');
  var drawer = $('#mobile-nav-drawer');
  if (backdrop) { backdrop.classList.add('opacity-0', 'pointer-events-none'); backdrop.classList.remove('opacity-100'); }
  if (drawer) { drawer.classList.add('-translate-x-full'); drawer.classList.remove('translate-x-0'); }
}
