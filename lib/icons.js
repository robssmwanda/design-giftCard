/**
 * Lucide icon SVG strings for vanilla HTML/EJS.
 * Each icon is rendered as an inline <svg> with stroke-based paths.
 */

const ICONS = {
  sparkles: [
    { type: 'path', attrs: { d: 'M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z' } },
    { type: 'path', attrs: { d: 'M20 3v4' } },
    { type: 'path', attrs: { d: 'M22 5h-4' } },
    { type: 'path', attrs: { d: 'M4 17v2' } },
    { type: 'path', attrs: { d: 'M5 18H3' } },
  ],
  search: [
    { type: 'circle', attrs: { cx: '11', cy: '11', r: '8' } },
    { type: 'path', attrs: { d: 'm21 21-4.3-4.3' } },
  ],
  'shopping-bag': [
    { type: 'path', attrs: { d: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z' } },
    { type: 'path', attrs: { d: 'M3 6h18' } },
    { type: 'path', attrs: { d: 'M16 10a4 4 0 0 1-8 0' } },
  ],
  menu: [
    { type: 'line', attrs: { x1: '4', x2: '20', y1: '12', y2: '12' } },
    { type: 'line', attrs: { x1: '4', x2: '20', y1: '6', y2: '6' } },
    { type: 'line', attrs: { x1: '4', x2: '20', y1: '18', y2: '18' } },
  ],
  x: [
    { type: 'path', attrs: { d: 'M18 6 6 18' } },
    { type: 'path', attrs: { d: 'm6 6 12 12' } },
  ],
  zap: [
    { type: 'path', attrs: { d: 'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z' } },
  ],
  'shield-check': [
    { type: 'path', attrs: { d: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z' } },
    { type: 'path', attrs: { d: 'm9 12 2 2 4-4' } },
  ],
  gift: [
    { type: 'rect', attrs: { x: '3', y: '8', width: '18', height: '4', rx: '1' } },
    { type: 'path', attrs: { d: 'M12 8v13' } },
    { type: 'path', attrs: { d: 'M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7' } },
    { type: 'path', attrs: { d: 'M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5' } },
  ],
  clapperboard: [
    { type: 'path', attrs: { d: 'M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z' } },
    { type: 'path', attrs: { d: 'm6.2 5.3 3.1 3.9' } },
    { type: 'path', attrs: { d: 'm12.4 3.4 3.1 4' } },
    { type: 'path', attrs: { d: 'M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z' } },
  ],
  coffee: [
    { type: 'path', attrs: { d: 'M10 2v2' } },
    { type: 'path', attrs: { d: 'M14 2v2' } },
    { type: 'path', attrs: { d: 'M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1' } },
    { type: 'path', attrs: { d: 'M6 2v2' } },
  ],
  'gamepad-2': [
    { type: 'path', attrs: { d: 'M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z' } },
    { type: 'line', attrs: { x1: '6', x2: '10', y1: '11', y2: '11' } },
    { type: 'line', attrs: { x1: '8', x2: '8', y1: '9', y2: '13' } },
    { type: 'line', attrs: { x1: '15', x2: '15.01', y1: '12', y2: '12' } },
    { type: 'line', attrs: { x1: '18', x2: '18.01', y1: '10', y2: '10' } },
  ],
  plane: [
    { type: 'path', attrs: { d: 'M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z' } },
  ],
  shirt: [
    { type: 'path', attrs: { d: 'M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z' } },
  ],
  plus: [
    { type: 'path', attrs: { d: 'M5 12h14' } },
    { type: 'path', attrs: { d: 'M12 5v14' } },
  ],
  check: [
    { type: 'path', attrs: { d: 'M20 6 9 17l-5-5' } },
  ],
  'trending-down': [
    { type: 'polyline', attrs: { points: '22 17 13.5 8.5 8.5 13.5 2 7' } },
    { type: 'polyline', attrs: { points: '16 17 22 17 22 11' } },
  ],
  'sliders-horizontal': [
    { type: 'line', attrs: { x1: '21', x2: '14', y1: '4', y2: '4' } },
    { type: 'line', attrs: { x1: '10', x2: '3', y1: '4', y2: '4' } },
    { type: 'line', attrs: { x1: '21', x2: '12', y1: '12', y2: '12' } },
    { type: 'line', attrs: { x1: '8', x2: '3', y1: '12', y2: '12' } },
    { type: 'line', attrs: { x1: '21', x2: '16', y1: '20', y2: '20' } },
    { type: 'line', attrs: { x1: '12', x2: '3', y1: '20', y2: '20' } },
    { type: 'line', attrs: { x1: '14', x2: '14', y1: '2', y2: '6' } },
    { type: 'line', attrs: { x1: '8', x2: '8', y1: '10', y2: '14' } },
    { type: 'line', attrs: { x1: '16', x2: '16', y1: '18', y2: '22' } },
  ],
  'arrow-down-wide-narrow': [
    { type: 'path', attrs: { d: 'm3 16 4 4 4-4' } },
    { type: 'path', attrs: { d: 'M7 20V4' } },
    { type: 'path', attrs: { d: 'M11 4h10' } },
    { type: 'path', attrs: { d: 'M11 8h7' } },
    { type: 'path', attrs: { d: 'M11 12h4' } },
  ],
  'chevron-left': [
    { type: 'path', attrs: { d: 'm15 18-6-6 6-6' } },
  ],
  'chevron-right': [
    { type: 'path', attrs: { d: 'm9 18 6-6-6-6' } },
  ],
  star: [
    { type: 'polygon', attrs: { points: '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2' } },
  ],
  minus: [
    { type: 'path', attrs: { d: 'M5 12h14' } },
  ],
  'trash-2': [
    { type: 'path', attrs: { d: 'M3 6h18' } },
    { type: 'path', attrs: { d: 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6' } },
    { type: 'path', attrs: { d: 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2' } },
    { type: 'line', attrs: { x1: '10', x2: '10', y1: '11', y2: '17' } },
    { type: 'line', attrs: { x1: '14', x2: '14', y1: '11', y2: '17' } },
  ],
  'credit-card': [
    { type: 'rect', attrs: { width: '20', height: '14', x: '2', y: '5', rx: '2' } },
    { type: 'line', attrs: { x1: '2', x2: '22', y1: '10', y2: '10' } },
  ],
  lock: [
    { type: 'rect', attrs: { width: '18', height: '11', x: '3', y: '11', rx: '2', ry: '2' } },
    { type: 'path', attrs: { d: 'M7 11V7a5 5 0 0 1 10 0v4' } },
  ],
  'check-circle-2': [
    { type: 'circle', attrs: { cx: '12', cy: '12', r: '10' } },
    { type: 'path', attrs: { d: 'm9 12 2 2 4-4' } },
  ],
  'arrow-right': [
    { type: 'path', attrs: { d: 'M5 12h14' } },
    { type: 'path', attrs: { d: 'm12 5 7 7-7 7' } },
  ],
  home: [
    { type: 'path', attrs: { d: 'M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8' } },
    { type: 'path', attrs: { d: 'M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' } },
  ],
  mail: [
    { type: 'rect', attrs: { width: '20', height: '16', x: '2', y: '4', rx: '2' } },
    { type: 'path', attrs: { d: 'm22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7' } },
  ],
  twitter: [
    { type: 'path', attrs: { d: 'M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z' } },
  ],
  instagram: [
    { type: 'rect', attrs: { width: '20', height: '20', x: '2', y: '2', rx: '5', ry: '5' } },
    { type: 'path', attrs: { d: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z' } },
    { type: 'line', attrs: { x1: '17.5', x2: '17.51', y1: '6.5', y2: '6.5' } },
  ],
  facebook: [
    { type: 'path', attrs: { d: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' } },
  ],
  'mouse-pointer-click': [
    { type: 'path', attrs: { d: 'M14 4.1 12 6' } },
    { type: 'path', attrs: { d: 'm5.1 8-2.9-.8' } },
    { type: 'path', attrs: { d: 'm6 12-1.9 2' } },
    { type: 'path', attrs: { d: 'M7.2 2.2 8 5.1' } },
    { type: 'path', attrs: { d: 'M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z' } },
  ],
  user: [
    { type: 'path', attrs: { d: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' } },
    { type: 'circle', attrs: { cx: '12', cy: '7', r: '4' } },
  ],
  'user-plus': [
    { type: 'path', attrs: { d: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' } },
    { type: 'circle', attrs: { cx: '9', cy: '7', r: '4' } },
    { type: 'line', attrs: { x1: '19', x2: '19', y1: '8', y2: '14' } },
    { type: 'line', attrs: { x1: '22', x2: '16', y1: '11', y2: '11' } },
  ],
  'log-out': [
    { type: 'path', attrs: { d: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' } },
    { type: 'polyline', attrs: { points: '16 17 21 12 16 7' } },
    { type: 'line', attrs: { x1: '21', x2: '9', y1: '12', y2: '12' } },
  ],
  package: [
    { type: 'path', attrs: { d: 'm7.5 4.27 9 5.15' } },
    { type: 'path', attrs: { d: 'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z' } },
    { type: 'path', attrs: { d: 'm3.3 7 8.7 5 8.7-5' } },
    { type: 'path', attrs: { d: 'M12 22V12' } },
  ],
  'user-circle': [
    { type: 'circle', attrs: { cx: '12', cy: '12', r: '10' } },
    { type: 'circle', attrs: { cx: '12', cy: '10', r: '3' } },
    { type: 'path', attrs: { d: 'M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662' } },
  ],
  'key-round': [
    { type: 'path', attrs: { d: 'M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z' } },
    { type: 'circle', attrs: { cx: '16.5', cy: '7.5', r: '.5', fill: 'currentColor' } },
  ],
  phone: [
    { type: 'path', attrs: { d: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z' } },
  ],
  'chevron-down': [
    { type: 'path', attrs: { d: 'm6 9 6 6 6-6' } },
  ],
  'arrow-left': [
    { type: 'path', attrs: { d: 'm12 19-7-7 7-7' } },
    { type: 'path', attrs: { d: 'M19 12H5' } },
  ],
  'eye-off': [
    { type: 'path', attrs: { d: 'M9.88 9.88a3 3 0 1 0 4.24 4.24' } },
    { type: 'path', attrs: { d: 'M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68' } },
    { type: 'path', attrs: { d: 'M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61' } },
    { type: 'line', attrs: { x1: '2', x2: '22', y1: '2', y2: '22' } },
  ],
  eye: [
    { type: 'path', attrs: { d: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z' } },
    { type: 'circle', attrs: { cx: '12', cy: '12', r: '3' } },
  ],
  'check-check': [
    { type: 'path', attrs: { d: 'M18 6 7 17l-5-5' } },
    { type: 'path', attrs: { d: 'm22 10-7.5 7.5L13 16' } },
  ],
  globe: [
    { type: 'circle', attrs: { cx: '12', cy: '12', r: '10' } },
    { type: 'path', attrs: { d: 'M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20' } },
    { type: 'path', attrs: { d: 'M2 12h20' } },
  ],
  'shield-question': [
    { type: 'path', attrs: { d: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z' } },
    { type: 'path', attrs: { d: 'M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3' } },
    { type: 'path', attrs: { d: 'M12 17h.01' } },
  ],
};

function renderElement(el) {
  const tag = el.type;
  const attrs = Object.entries(el.attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');
  return `<${tag} ${attrs} />`;
}

export function iconSvg(name, options = {}) {
  const elements = ICONS[name];
  if (!elements) return '';
  const size = options.size || 24;
  const strokeWidth = options.strokeWidth || 2;
  const className = options.className || '';
  const fill = options.fill || 'none';

  const inner = elements.map(renderElement).join('');
  const cls = className ? ` class="${className}"` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${cls}>${inner}</svg>`;
}
