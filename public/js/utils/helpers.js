export function $(sel, root) {
  return (root || document).querySelector(sel);
}

export function $all(sel, root) {
  return Array.prototype.slice.call((root || document).querySelectorAll(sel));
}

export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}
