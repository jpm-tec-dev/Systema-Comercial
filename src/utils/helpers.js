export function makeId() {
  return Date.now() + '' + Math.floor(Math.random() * 99999);
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function esc(v) {
  return String(v ?? '').replace(/[&<>"]/g, s => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  }[s]));
}

export function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

export function first(obj, names) {
  const keys = Object.keys(obj || {});
  for (const n of names) {
    const nk = norm(n);
    const k = keys.find(x => norm(x) === nk);
    if (k !== undefined) return obj[k] ?? '';
  }
  return '';
}

export function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
