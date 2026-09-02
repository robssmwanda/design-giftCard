var CATALOG = [];

export function setCatalog(c) { CATALOG = c; }

export function getCatalog() { return CATALOG; }

export function findBrandById(id) {
  for (var i = 0; i < CATALOG.length; i++) {
    if (String(CATALOG[i].id) === String(id)) return CATALOG[i];
  }
  return null;
}
