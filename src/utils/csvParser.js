import { first, makeId } from './helpers.js';

export function serviceFromSource(src, fallback) {
  const s = String(src || '').toUpperCase();
  if (s.includes('SF-R73') || s.includes('SFR73')) return 'SF-R73';
  if (s.includes('FIN-M40') || s.includes('FINM40') || s.includes('M40')) return 'FIN-M40';
  if (s.includes('RVD')) return 'RVD';
  return fallback || 'Otro';
}

export function parseCSV(text) {
  text = text.replace(/^\uFEFF/, '');
  const firstLine = (text.split(/\r?\n/).find(l => l.trim()) || '');
  const semi = (firstLine.match(/;/g) || []).length;
  const comma = (firstLine.match(/,/g) || []).length;
  const tab = (firstLine.match(/\t/g) || []).length;
  const delim = tab > semi && tab > comma ? '\t' : semi >= comma ? ';' : ',';
  const out = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], nx = text[i + 1];
    if (q) {
      if (ch === '"' && nx === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else {
      if (ch === '"') q = true;
      else if (ch === delim) { row.push(cell); cell = ''; }
      else if (ch === '\n') { row.push(cell); out.push(row); row = []; cell = ''; }
      else if (ch !== '\r') cell += ch;
    }
  }
  if (cell !== '' || row.length) { row.push(cell); out.push(row); }
  const header = (out.shift() || []).map(h => h.trim());
  return out.filter(r => r.some(c => String(c).trim() !== '')).map(r => {
    const o = {};
    header.forEach((h, i) => { o[h] = r[i] ?? ''; });
    return o;
  });
}

export function normalizeRow(raw, fallbackService) {
  const fuente = first(raw, ['Fuente/Origen', 'Fuente', 'Origen', 'campaign', 'source']);
  const service = serviceFromSource(fuente, fallbackService);
  const nss = String(first(raw, ['NSS (Dígitos)', 'NSS', 'nss_digits', 'nss'])).trim();
  let nssNum = parseInt(nss, 10);
  if (Number.isNaN(nssNum)) nssNum = null;
  const nivel = String(first(raw, ['Nivel/Calificación', 'Nivel Score', 'Nivel', 'Calificación', 'score_level'])).trim();
  let nssBand = 'Sin dato';
  if (nssNum !== null) {
    if (nssNum <= 96) nssBand = '≤96 · pre-97 probable';
    else if (nssNum === 97) nssBand = '97 · umbral';
    else if (nssNum >= 98) nssBand = '≥98 · revisión necesaria';
  }
  return {
    _id: first(raw, ['ID', 'id']) || makeId(), service,
    fecha: first(raw, ['Fecha Registro', 'fecha_registro', 'Fecha', 'created_at']),
    prospecto: first(raw, ['Nombre Completo', 'nombre', 'prospecto', 'Nombre']),
    telefono: first(raw, ['Teléfono', 'Telefono', 'phone', 'celular']),
    email: first(raw, ['Email', 'Correo', 'email']),
    edad: first(raw, ['Rango de Edad', 'edad', 'age_range']),
    escolaridad: first(raw, ['Escolaridad', 'education']),
    nss, nssNum, nssBand,
    tramite: first(raw, ['Estado Trámite', 'estado_tramite', 'Trámite']),
    descripcion: first(raw, ['Descripción del Caso', 'descripcion', 'Notas', 'case_description']),
    fuente, nivel, nivelNormalizado: service === 'SF-R73' && nivel ? ('SF-' + nivel) : nivel,
    contacto: first(raw, ['Estado Contacto', 'estado_contacto', 'contact_status']),
    flujo: first(raw, ['Estado Flujo', 'estado_flujo', 'flow_status']),
    asesor: first(raw, ['Asesor Asignado', 'asesor', 'owner', 'assigned_to']) || 'Sin Asignar',
    duplicado: first(raw, ['Es Duplicado', 'duplicado', 'duplicate']),
    notas: first(raw, ['Notas Adicionales', 'notas', 'notes']), raw
  };
}
