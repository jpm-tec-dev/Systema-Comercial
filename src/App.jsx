import { useEffect, useMemo, useState } from 'react';

const LSKEY = 'jpm_sistema_comercial_v43_campaign_importer';
const LEGACY_LSKEY = 'jpm_sistema_comercial_v42_campaign_importer';
const servicios = ['SF-R73', 'FIN-M40', 'RVD', 'JUR-TP', 'JUR-M40', 'JUR-RT-AFORE/INFONAVIT', 'Cuotas Complementarias', 'Otro'];
const sections = [
  ['dashboard', '📊 Dashboard', 'Resumen de la campaña activa, KPIs y alertas automáticas.'],
  ['importar', '⬆ Importar CSV CRM', 'Carga manual de exportaciones CSV de mini CRM por campaña.'],
  ['tabla', '📋 Leads normalizados', 'Vista operativa de los registros importados.'],
  ['asesores', '👥 Asesores', 'Distribución de carga, contacto e interés por asesor.'],
  ['incidencias', '⚠ Incidencias operativas', 'Registro manual de incidencias capturadas por gerencia, vinculadas a campaña, asesor, etapa y responsable.'],
  ['reporte', '📄 Reporte gerencial', 'Informe generado desde el CSV importado, con concentrado por asesor e incidencias operativas.'],
  ['diccionario', '🧩 Diccionario escalable', 'Campos base para SF-R73, FIN-M40, RVD y campañas futuras.']
];

function initialState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LSKEY) || localStorage.getItem(LEGACY_LSKEY) || '{}');
    return {
      imports: Array.isArray(parsed.imports) ? parsed.imports : [],
      activeImportId: parsed.activeImportId || null,
      incidencias: Array.isArray(parsed.incidencias) ? parsed.incidencias : []
    };
  } catch {
    return { imports: [], activeImportId: null, incidencias: [] };
  }
}
function makeId() { return Date.now() + '' + Math.floor(Math.random() * 99999); }
function today() { return new Date().toISOString().slice(0, 10); }
function esc(v) {
  return String(v ?? '').replace(/[&<>"]/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[s]));
}
function norm(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '').trim();
}
function first(obj, names) {
  const keys = Object.keys(obj || {});
  for (const n of names) {
    const nk = norm(n);
    const k = keys.find(x => norm(x) === nk);
    if (k !== undefined) return obj[k] ?? '';
  }
  return '';
}
function serviceFromSource(src, fallback) {
  const s = String(src || '').toUpperCase();
  if (s.includes('SF-R73') || s.includes('SFR73')) return 'SF-R73';
  if (s.includes('FIN-M40') || s.includes('FINM40') || s.includes('M40')) return 'FIN-M40';
  if (s.includes('RVD')) return 'RVD';
  return fallback || 'Otro';
}
function parseCSV(text) {
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
function normalizeRow(raw, fallbackService) {
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
const isActive = r => String(r.flujo || '').toLowerCase().includes('activo') && !String(r.flujo || '').toLowerCase().includes('inactivo');
const isPending = r => /pendiente/i.test(r.contacto || '');
const isInterested = r => /interesado|derivable|en proceso/i.test(r.contacto || '') && !/sin interes/i.test(r.contacto || '');
const isNoInterest = r => /sin interes/i.test(r.contacto || '');
const isDup = r => /^s[ií]/i.test(r.duplicado || '');
function countBy(rs, key) {
  const c = {};
  rs.forEach(r => {
    const k = typeof key === 'function' ? key(r) : (r[key] || 'Sin dato');
    c[k] = (c[k] || 0) + 1;
  });
  return Object.entries(c).sort((a, b) => b[1] - a[1]);
}
function metrics(rs) {
  const total = rs.length;
  const pending = rs.filter(isPending).length;
  const interested = rs.filter(isInterested).length;
  const noint = rs.filter(isNoInterest).length;
  const dup = rs.filter(isDup).length;
  const nss98 = rs.filter(r => r.nssNum !== null && r.nssNum >= 98).length;
  const contactados = total - pending;
  return { total, pending, interested, noint, dup, nss98, contactados, contactRate: total ? contactados / total : 0, interestRate: contactados ? interested / contactados : 0 };
}
function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function LevelTag({ value }) {
  const v = value || 'Sin nivel';
  const c = /AAA/.test(v) ? 'aaa' : /AA/.test(v) ? 'aa' : /A1/.test(v) ? 'a1' : /NP/.test(v) ? 'np' : 'info';
  return <span className={`tag ${c}`}>{v}</span>;
}
function NssTag({ row }) {
  const cls = row.nssNum !== null && row.nssNum >= 98 ? 'risk' : row.nssNum === 97 ? 'info' : 'ok';
  return <span className={`tag ${cls}`}>{row.nssBand}</span>;
}
function IncidentBadge({ estado }) {
  const e = String(estado || '').toLowerCase();
  const cls = e.includes('cerr') ? 'ok' : e.includes('seguimiento') ? 'info' : 'risk';
  return <span className={`tag ${cls}`}>{estado || 'Abierta'}</span>;
}
function Bars({ entries }) {
  if (!entries.length) return <p className="mini">Sin datos.</p>;
  const max = Math.max(...entries.map(x => x[1]), 1);
  return entries.slice(0, 10).map(([k, v]) => (
    <div className="barrow" key={k}>
      <div className="barlabel"><span>{k || 'Sin dato'}</span><strong>{v}</strong></div>
      <div className="bar"><span style={{ width: `${Math.round(v / max * 100)}%` }} /></div>
    </div>
  ));
}
function Section({ id, activeSection, title, description, children }) {
  return <section className={`section ${activeSection === id ? 'active' : ''}`} id={`sec-${id}`}>
    <div className="section-head"><div className="section-title"><h3>{title}</h3><p>{description}</p></div><span className="pill">v4.3 React</span></div>
    <div className="section-body">{children}</div>
  </section>;
}

export default function App() {
  const [state, setState] = useState(initialState);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [toast, setToast] = useState({ msg: '', err: false, show: false });
  const [importForm, setImportForm] = useState({ service: 'SF-R73', name: 'CAMPAÑA_ORGANICA_SF-R73 · Export CRM', origin: 'Mini CRM', note: 'Importación manual desde CSV. Lista para automatizar por webhook/API en fase posterior.' });
  const [incForm, setIncForm] = useState({ fecha: today(), servicio: 'SF-R73', campana: '', tipo: 'Backlog / atraso de contacto', severidad: 'Baja', etapa: 'Captura', asesor: '', responsable: '', estado: 'Abierta', descripcion: '', accion: '', proxima: '' });

  const activeImport = useMemo(() => state.imports.find(x => x.id === state.activeImportId) || state.imports[state.imports.length - 1] || null, [state]);
  const rows = activeImport?.rows || [];
  const m = metrics(rows);

  useEffect(() => { localStorage.setItem(LSKEY, JSON.stringify(state)); }, [state]);
  useEffect(() => { document.body.setAttribute('data-active-section', activeSection); }, [activeSection]);
  useEffect(() => { if (activeImport) setIncForm(f => ({ ...f, servicio: activeImport.service || f.servicio, campana: activeImport.name || f.campana })); }, [activeImport?.id]);
  function notify(msg, err = false) {
    setToast({ msg, err, show: true });
    setTimeout(() => setToast(t => ({ ...t, show: false })), err ? 2500 : 1200);
  }
  function updateState(next) { setState(prev => typeof next === 'function' ? next(prev) : next); }
  function handleCSV(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = parseCSV(String(reader.result || ''));
        const normalized = raw.map(r => normalizeRow(r, importForm.service));
        const imp = { id: makeId(), name: importForm.name || file.name, service: importForm.service, origin: importForm.origin || 'Mini CRM', note: importForm.note || '', fileName: file.name, importedAt: new Date().toLocaleString('es-MX'), columns: Object.keys(raw[0] || {}), rows: normalized };
        updateState(prev => ({ ...prev, imports: [...prev.imports, imp], activeImportId: imp.id }));
        setActiveSection('dashboard');
        notify(`✓ CSV importado: ${normalized.length} registros`);
      } catch (err) { notify(`No pude leer el CSV: ${err.message}`, true); }
    };
    reader.readAsText(file, 'utf-8');
  }
  function deleteImport(id) {
    if (!confirm('¿Eliminar esta importación?')) return;
    updateState(prev => {
      const imports = prev.imports.filter(i => i.id !== id);
      return { ...prev, imports, activeImportId: prev.activeImportId === id ? (imports.at(-1)?.id || null) : prev.activeImportId };
    });
  }
  function clearAll() {
    if (!confirm('¿Borrar importaciones locales?')) return;
    localStorage.removeItem(LSKEY);
    updateState({ imports: [], activeImportId: null, incidencias: [] });
    notify('Datos borrados');
  }
  function downloadJSON() { downloadBlob(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }), `JPM_Sistema_Comercial_v43_${today()}.json`); }
  function importJSON(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const parsed = JSON.parse(String(r.result || '{}'));
        updateState({ imports: Array.isArray(parsed.imports) ? parsed.imports : [], activeImportId: parsed.activeImportId || null, incidencias: Array.isArray(parsed.incidencias) ? parsed.incidencias : [] });
        setActiveSection('dashboard');
      } catch { notify('JSON inválido', true); }
    };
    r.readAsText(file);
  }
  function downloadFilteredCSV() {
    const cols = ['service', 'fecha', 'prospecto', 'telefono', 'email', 'nss', 'nssBand', 'escolaridad', 'tramite', 'nivelNormalizado', 'contacto', 'flujo', 'asesor', 'duplicado', 'fuente'];
    let txt = '\uFEFF' + cols.join(',') + '\n';
    rows.forEach(r => { txt += cols.map(c => '"' + String(r[c] ?? '').replace(/"/g, '""') + '"').join(',') + '\n'; });
    downloadBlob(new Blob([txt], { type: 'text/csv;charset=utf-8' }), `JPM_CRM_normalizado_${activeImport?.service || 'campana'}_${today()}.csv`);
  }
  function filteredIncidencias() {
    return (state.incidencias || []).filter(i => !i.importId || !activeImport || i.importId === activeImport.id || i.campana === activeImport.name || i.servicio === activeImport.service);
  }
  function addIncidencia() {
    if (!incForm.descripcion.trim()) { notify('Describe la incidencia antes de guardarla', true); return; }
    const inc = { ...incForm, id: makeId(), importId: activeImport?.id || '', creado: new Date().toLocaleString('es-MX') };
    updateState(prev => ({ ...prev, incidencias: [inc, ...(prev.incidencias || [])] }));
    setIncForm(f => ({ ...f, descripcion: '', accion: '' }));
    notify('✓ Incidencia registrada');
  }
  function closeIncidencia(id) { updateState(prev => ({ ...prev, incidencias: prev.incidencias.map(i => i.id === id ? { ...i, estado: 'Cerrada', cerrado: new Date().toLocaleString('es-MX') } : i) })); }
  function deleteIncidencia(id) { if (confirm('¿Eliminar esta incidencia operativa?')) updateState(prev => ({ ...prev, incidencias: prev.incidencias.filter(i => i.id !== id) })); }
  const campaignSelector = state.imports.length ? <div className="field"><label>Campaña activa</label><select value={activeImport?.id || ''} onChange={e => updateState(p => ({ ...p, activeImportId: e.target.value }))}>{state.imports.map(i => <option key={i.id} value={i.id}>{i.name} · {i.service} · {i.rows.length}</option>)}</select></div> : null;

  return <div className="app">
    <aside className="side">
      <div className="brand"><div className="logo">JPM</div><div><h1>Sistema Comercial Integral</h1><small>v4.3 · CRM campañas + incidencias</small></div></div>
      <div className="side-note">Recibe exportaciones CSV de mini CRMs por campaña, genera reporte manual, registra incidencias operativas por gerencia y deja el modelo listo para escalar SF-R73 → FIN-M40 → RVD → nuevos servicios.</div>
      <nav className="nav">{sections.map(s => <button key={s[0]} data-id={s[0]} onClick={() => setActiveSection(s[0])} className={activeSection === s[0] ? 'active' : ''}><span className="dot" />{s[1]}</button>)}</nav>
    </aside>
    <main className="main">
      <header className="hero"><h2>Inteligencia comercial por campaña</h2><p>Importa el CSV del mini CRM, normaliza los campos, asigna servicio rector, calcula métricas de contacto, prioridad, flujo, asesores, riesgos operativos, registra incidencias manuales y genera un informe gerencial reutilizable para cualquier campaña.</p><div className="toolbar">
        <button className="btn ghost" onClick={() => setActiveSection('importar')}>⬆ Importar CSV CRM</button><button className="btn ghost" onClick={() => setActiveSection('reporte')}>📄 Generar reporte</button><button className="btn ghost" onClick={() => setActiveSection('incidencias')}>⚠ Incidencias</button><button className="btn ghost" onClick={downloadJSON}>💾 Exportar JSON</button><label className="btn ghost">📂 Importar JSON<input className="hidden" type="file" accept="application/json" onChange={importJSON} /></label><button className="btn ghost" onClick={downloadFilteredCSV}>📊 Exportar CSV normalizado</button><button className="btn ghost" onClick={() => window.print()}>🖨 Imprimir sección actual / PDF</button><button className="btn warn" onClick={clearAll}>🗑 Limpiar</button>
      </div></header>
      <div className="grid" id="kpis"><Kpi label="Leads importados" value={m.total} sub="Campaña activa" /><Kpi label="Pendientes contacto" value={m.pending} sub={`${m.total ? Math.round(m.pending / m.total * 100) : 0}% del total`} color="var(--vta)" /><Kpi label="Interesados / proceso" value={m.interested} sub={`${Math.round(m.interestRate * 100)}% sobre contactados`} color="var(--jur)" /><Kpi label="Alertas NSS ≥98" value={m.nss98} sub="Revisión necesaria" color="var(--rr)" /></div>
      <div id="sections">
        <Section id="dashboard" activeSection={activeSection} title="📊 Dashboard" description="Resumen de la campaña activa, KPIs y alertas automáticas."><Dashboard activeImport={activeImport} rows={rows} m={m} setActiveSection={setActiveSection} /></Section>
        <Section id="importar" activeSection={activeSection} title="⬆ Importar CSV CRM" description="Carga manual de exportaciones CSV de mini CRM por campaña."><Importar state={state} activeImport={activeImport} form={importForm} setForm={setImportForm} handleCSV={handleCSV} campaignSelector={campaignSelector} deleteImport={deleteImport} setActive={id => updateState(p => ({ ...p, activeImportId: id }))} setActiveSection={setActiveSection} /></Section>
        <Section id="tabla" activeSection={activeSection} title="📋 Leads normalizados" description="Vista operativa de los registros importados.">{campaignSelector}<Tabla rows={rows} /></Section>
        <Section id="asesores" activeSection={activeSection} title="👥 Asesores" description="Distribución de carga, contacto e interés por asesor."><Asesores rows={rows} /></Section>
        <Section id="incidencias" activeSection={activeSection} title="⚠ Incidencias operativas" description="Registro manual de incidencias capturadas por gerencia, vinculadas a campaña, asesor, etapa y responsable."><Incidencias rows={rows} form={incForm} setForm={setIncForm} addIncidencia={addIncidencia} incidencias={filteredIncidencias()} closeIncidencia={closeIncidencia} deleteIncidencia={deleteIncidencia} activeImport={activeImport} /></Section>
        <Section id="reporte" activeSection={activeSection} title="📄 Reporte gerencial" description="Informe generado desde el CSV importado, con concentrado por asesor e incidencias operativas."><Reporte activeImport={activeImport} rows={rows} m={m} incidencias={filteredIncidencias()} setActiveSection={setActiveSection} /></Section>
        <Section id="diccionario" activeSection={activeSection} title="🧩 Diccionario escalable" description="Campos base para SF-R73, FIN-M40, RVD y campañas futuras."><Diccionario /></Section>
      </div>
    </main>
    <div className={`toast ${toast.show ? 'show' : ''} ${toast.err ? 'err' : ''}`}>{toast.msg}</div>
  </div>;
}
function Kpi({ label, value, sub, color }) { return <div className="kpi" style={color ? { borderTopColor: color } : undefined}><div className="label">{label}</div><div className="value">{value}</div><div className="sub">{sub}</div></div>; }
function Dashboard({ activeImport, rows, m, setActiveSection }) {
  if (!activeImport) return <div className="drop"><h4>Sin campaña importada</h4><p>Importa el CSV del mini CRM para generar métricas.</p><button className="btn primary" onClick={() => setActiveSection('importar')}>Importar CSV</button></div>;
  return <><div className="callout"><strong>Campaña activa:</strong> {activeImport.name} · Servicio {activeImport.service} · {activeImport.rows.length} registros · importado {activeImport.importedAt}. El sistema conserva los datos crudos y una capa normalizada para reportes comparables entre servicios.</div><div className="cards"><div className="card"><h4>Distribución por nivel</h4><Bars entries={countBy(rows, 'nivelNormalizado')} /></div><div className="card"><h4>Estado contacto</h4><Bars entries={countBy(rows, 'contacto')} /></div><div className="card"><h4>Estado flujo</h4><Bars entries={countBy(rows, 'flujo')} /></div><div className="card"><h4>Lectura NSS / validación</h4><Bars entries={countBy(rows, 'nssBand')} /></div></div>{m.pending > 0 && <div className="alert"><strong>Alerta operativa:</strong> {m.pending} leads siguen pendientes de contacto. Priorizar SF-AAA/SF-AA activos antes de nuevas importaciones.</div>}{m.nss98 > 0 && <div className="alert"><strong>Alerta de clasificación:</strong> {m.nss98} registros tienen NSS ≥98. No implica descarte automático; sí exige etiqueta de revisión necesaria y ruta de validación documental.</div>}</>;
}
function Importar({ state, activeImport, form, setForm, handleCSV, campaignSelector, deleteImport, setActive, setActiveSection }) {
  return <><div className="form-grid"><div className="field"><label>Servicio rector</label><select value={form.service} onChange={e => setForm({ ...form, service: e.target.value })}>{servicios.map(s => <option key={s}>{s}</option>)}</select></div><div className="field half"><label>Nombre de campaña</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div><div className="field"><label>Origen</label><input value={form.origin} onChange={e => setForm({ ...form, origin: e.target.value })} /></div><div className="field full"><label>Nota operativa</label><textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></div></div><div className="drop" style={{ marginTop: 16 }}><h4>Sube el CSV exportado del mini CRM</h4><p>Compatible con el formato actual del mini CRM.</p><input type="file" accept=".csv,text/csv" onChange={handleCSV} /></div><div style={{ marginTop: 16 }}>{campaignSelector}</div><div className="table-wrap"><table className="data-table"><thead><tr><th>Campaña</th><th>Servicio</th><th>Importado</th><th>Registros</th><th>Origen</th><th>Acción</th></tr></thead><tbody>{state.imports.length ? state.imports.map(i => <tr key={i.id}><td>{i.name}</td><td>{i.service}</td><td>{i.importedAt}</td><td>{i.rows.length}</td><td>{i.origin}</td><td><button className="btn sm" onClick={() => { setActive(i.id); setActiveSection('dashboard'); }}>Usar</button> <button className="btn sm" onClick={() => deleteImport(i.id)}>Eliminar</button></td></tr>) : <tr><td colSpan="6">Sin importaciones.</td></tr>}</tbody></table></div></>;
}
function Tabla({ rows }) { return <><div className="table-wrap"><table className="data-table"><thead><tr><th>Fecha</th><th>Nivel</th><th>Prospecto</th><th>Contacto</th><th>NSS</th><th>Lectura NSS</th><th>Escolaridad</th><th>Trámite</th><th>Estado contacto</th><th>Flujo</th><th>Asesor</th><th>Duplicado</th></tr></thead><tbody>{rows.length ? rows.slice(0, 500).map(r => <tr key={r._id}><td>{r.fecha}</td><td><LevelTag value={r.nivelNormalizado} /></td><td><strong>{r.prospecto}</strong><br /><span className="mini">{r.fuente}</span></td><td>{r.telefono}<br /><span className="mini">{r.email}</span></td><td>{r.nss}</td><td><NssTag row={r} /></td><td>{r.escolaridad}</td><td>{r.tramite}</td><td>{r.contacto}</td><td>{r.flujo}</td><td>{r.asesor}</td><td>{isDup(r) ? <span className="tag risk">Sí</span> : 'No'}</td></tr>) : <tr><td colSpan="12">Sin datos importados.</td></tr>}</tbody></table></div><p className="mini">Vista limitada a 500 filas para rendimiento. El reporte usa el total importado.</p></>; }
function Asesores({ rows }) {
  const grouped = {};
  rows.forEach(r => { const a = r.asesor || 'Sin Asignar'; (grouped[a] ||= []).push(r); });
  const data = Object.entries(grouped).map(([a, list]) => ({ a, total: list.length, pending: list.filter(isPending).length, interested: list.filter(isInterested).length, noint: list.filter(isNoInterest).length, active: list.filter(isActive).length, aaa: list.filter(r => /AAA/.test(r.nivelNormalizado)).length })).sort((x, y) => y.total - x.total);
  return <div className="table-wrap"><table className="data-table"><thead><tr><th>Asesor</th><th>Total</th><th>Activos</th><th>Pendientes</th><th>Interesados/Proceso</th><th>Sin interés</th><th>SF-AAA</th><th>Lectura</th></tr></thead><tbody>{data.length ? data.map(d => <tr key={d.a}><td><strong>{d.a}</strong></td><td>{d.total}</td><td>{d.active}</td><td>{d.pending}</td><td>{d.interested}</td><td>{d.noint}</td><td>{d.aaa}</td><td>{d.pending > d.total * .75 ? <span className="tag risk">Backlog alto</span> : d.interested ? <span className="tag ok">Con tracción</span> : <span className="tag info">Monitorear</span>}</td></tr>) : <tr><td colSpan="8">Sin datos.</td></tr>}</tbody></table></div>;
}
function Incidencias({ rows, form, setForm, addIncidencia, incidencias, closeIncidencia, deleteIncidencia }) {
  const asesores = [...new Set(rows.map(r => r.asesor).filter(Boolean))].sort();
  const set = (k, v) => setForm({ ...form, [k]: v });
  return <><div className="callout"><strong>Registro manual de gerencia:</strong> esta sección no modifica los leads importados; agrega una bitácora operativa para documentar bloqueos, fallas de captura, retrasos, reasignaciones, dudas de clasificación, fricciones del equipo y acciones correctivas.</div><div className="form-grid"><div className="field"><label>Fecha</label><input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} /></div><div className="field"><label>Servicio</label><select value={form.servicio} onChange={e => set('servicio', e.target.value)}>{servicios.map(s => <option key={s}>{s}</option>)}</select></div><div className="field half"><label>Campaña vinculada</label><input value={form.campana} onChange={e => set('campana', e.target.value)} /></div><div className="field"><label>Tipo</label><select value={form.tipo} onChange={e => set('tipo', e.target.value)}>{['Backlog / atraso de contacto', 'Asignación incorrecta', 'Dato incompleto', 'Duplicidad', 'Clasificación dudosa', 'Falla técnica CRM', 'Fricción detectada', 'Capacitación / criterio', 'Otro'].map(x => <option key={x}>{x}</option>)}</select></div><div className="field"><label>Severidad</label><select value={form.severidad} onChange={e => set('severidad', e.target.value)}>{['Baja', 'Media', 'Alta', 'Crítica'].map(x => <option key={x}>{x}</option>)}</select></div><div className="field"><label>Etapa</label><select value={form.etapa} onChange={e => set('etapa', e.target.value)}>{['Captura', 'Primer contacto', 'Seguimiento', 'Derivación AF-04', 'Validación JUR-07', 'Cierre / descarte', 'Reporte'].map(x => <option key={x}>{x}</option>)}</select></div><div className="field"><label>Asesor relacionado</label><input list="asesoresList" value={form.asesor} onChange={e => set('asesor', e.target.value)} placeholder="Opcional" /><datalist id="asesoresList">{asesores.map(x => <option key={x} value={x} />)}</datalist></div><div className="field"><label>Responsable siguiente acción</label><input value={form.responsable} onChange={e => set('responsable', e.target.value)} /></div><div className="field"><label>Estado</label><select value={form.estado} onChange={e => set('estado', e.target.value)}>{['Abierta', 'En seguimiento', 'Cerrada'].map(x => <option key={x}>{x}</option>)}</select></div><div className="field"><label>Próxima revisión</label><input type="date" value={form.proxima} onChange={e => set('proxima', e.target.value)} /></div><div className="field full"><label>Descripción de incidencia</label><textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} /></div><div className="field full"><label>Acción correctiva / acuerdo</label><textarea value={form.accion} onChange={e => set('accion', e.target.value)} /></div></div><div style={{ marginTop: 14 }}><button className="btn primary" onClick={addIncidencia}>Guardar incidencia</button></div><div className="cards" style={{ marginTop: 16 }}><div className="card"><h4>Resumen de incidencias</h4><Bars entries={countBy(incidencias, 'estado')} /></div><div className="card"><h4>Criterio de uso</h4><p>Usar esta bitácora para decisiones de gerencia: redistribuir carga, corregir criterio, pedir ajuste al mini CRM o documentar incidencias antes del reporte semanal.</p></div></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Fecha</th><th>Estado</th><th>Severidad</th><th>Tipo</th><th>Campaña</th><th>Asesor</th><th>Responsable</th><th>Descripción</th><th>Acción</th><th>Próxima</th><th>Acciones</th></tr></thead><tbody>{incidencias.length ? incidencias.map(i => <tr key={i.id}><td>{i.fecha}</td><td><IncidentBadge estado={i.estado} /></td><td>{i.severidad}</td><td>{i.tipo}</td><td>{i.campana || i.servicio}</td><td>{i.asesor}</td><td>{i.responsable}</td><td>{i.descripcion}</td><td>{i.accion}</td><td>{i.proxima}</td><td><button className="btn sm" onClick={() => closeIncidencia(i.id)}>Cerrar</button> <button className="btn sm" onClick={() => deleteIncidencia(i.id)}>Eliminar</button></td></tr>) : <tr><td colSpan="11">Sin incidencias registradas.</td></tr>}</tbody></table></div></>;
}
function asesorConcentradoRows(rs) {
  const grouped = {};
  rs.forEach(r => { const a = r.asesor || 'Sin Asignar'; (grouped[a] ||= []).push(r); });
  return Object.entries(grouped).map(([asesor, list]) => ({ asesor, total: list.length, activos: list.filter(isActive).length, pendientes: list.filter(isPending).length, contactados: list.filter(r => !isPending(r)).length, interesados: list.filter(isInterested).length, sinInteres: list.filter(isNoInterest).length, duplicados: list.filter(isDup).length, sfAAA: list.filter(r => /AAA/.test(r.nivelNormalizado)).length, sfAA: list.filter(r => /AA/.test(r.nivelNormalizado) && !/AAA/.test(r.nivelNormalizado)).length, sfA1: list.filter(r => /A1/.test(r.nivelNormalizado)).length, sfNP: list.filter(r => /NP/.test(r.nivelNormalizado)).length, nss98: list.filter(r => r.nssNum !== null && r.nssNum >= 98).length })).sort((x, y) => y.total - x.total);
}
function ConcentradoAsesor({ rows }) {
  const data = asesorConcentradoRows(rows);
  if (!data.length) return <p className="mini">Sin datos.</p>;
  return <><div className="table-wrap"><table className="data-table"><thead><tr><th>Asesor</th><th>Total leads</th><th>Activos</th><th>Pendientes</th><th>Contactados</th><th>Interesados / Proceso</th><th>Sin interés</th><th>SF-AAA</th><th>SF-AA</th><th>SF-A1</th><th>SF-NP</th><th>NSS ≥98</th><th>Duplicados</th></tr></thead><tbody>{data.map(d => <tr key={d.asesor}><td><strong>{d.asesor}</strong></td><td>{d.total}</td><td>{d.activos}</td><td>{d.pendientes}</td><td>{d.contactados}</td><td>{d.interesados}</td><td>{d.sinInteres}</td><td>{d.sfAAA}</td><td>{d.sfAA}</td><td>{d.sfA1}</td><td>{d.sfNP}</td><td>{d.nss98}</td><td>{d.duplicados}</td></tr>)}</tbody></table></div><p className="mini">Este concentrado se genera desde la misma base de Leads normalizados.</p></>;
}
function Reporte({ activeImport, rows, m, incidencias, setActiveSection }) {
  if (!activeImport) return <div className="drop"><h4>Sin datos</h4><p>Importa una campaña para generar reporte.</p><button className="btn primary" onClick={() => setActiveSection('importar')}>Importar CSV</button></div>;
  const topPending = rows.filter(isPending).slice(0, 8);
  return <><div className="report-block"><h4>Informe Gerencial · {activeImport.name}</h4><p><strong>Servicio rector:</strong> {activeImport.service} · <strong>Registros:</strong> {m.total} · <strong>Fuente:</strong> {activeImport.origin} · <strong>Archivo:</strong> {activeImport.fileName || ''}</p></div><div className="report-block"><h4>1. Resumen ejecutivo</h4><ul><li>{m.pending} leads pendientes de contacto ({m.total ? Math.round(m.pending / m.total * 100) : 0}% del total).</li><li>{m.interested} leads interesados / en proceso / derivables.</li><li>{m.nss98} leads con NSS ≥98 requieren revisión necesaria, no descarte automático.</li><li>{m.dup} duplicados marcados por el CRM.</li></ul></div><div className="report-block"><h4>2. Distribución por nivel</h4><Bars entries={countBy(rows, 'nivelNormalizado')} /></div><div className="report-block"><h4>3. Carga por asesor · concentrado de Leads normalizados</h4><ConcentradoAsesor rows={rows} /></div><div className="report-block"><h4>4. Validación por NSS / regla SF-R73</h4><Bars entries={countBy(rows, 'nssBand')} /><p className="mini">Para SF-R73, NSS ≤96 orienta a pre-97 probable; NSS 97 es umbral; NSS ≥98 exige revisión necesaria si existe escolaridad pre-1997 o indicios documentales.</p></div><div className="report-block"><h4>5. Prioridad operativa inmediata</h4><ul>{topPending.length ? topPending.map(r => <li key={r._id}><LevelTag value={r.nivelNormalizado} /> <strong>{r.prospecto}</strong> · NSS {r.nss} · {r.asesor} · {r.telefono}</li>) : <li>Sin pendientes visibles.</li>}</ul></div><div className="report-block"><h4>6. Incidencias operativas registradas por gerencia</h4><p><strong>Total incidencias vinculadas:</strong> {incidencias.length} · <strong>Abiertas/en seguimiento:</strong> {incidencias.filter(i => !String(i.estado || '').toLowerCase().includes('cerr')).length}</p><div className="table-wrap"><table className="data-table"><thead><tr><th>Fecha</th><th>Estado</th><th>Severidad</th><th>Tipo</th><th>Asesor</th><th>Responsable</th><th>Descripción</th><th>Acción</th></tr></thead><tbody>{incidencias.slice(0, 25).length ? incidencias.slice(0, 25).map(i => <tr key={i.id}><td>{i.fecha}</td><td><IncidentBadge estado={i.estado} /></td><td>{i.severidad}</td><td>{i.tipo}</td><td>{i.asesor}</td><td>{i.responsable}</td><td>{i.descripcion}</td><td>{i.accion}</td></tr>) : <tr><td colSpan="8">Sin incidencias registradas para la campaña activa.</td></tr>}</tbody></table></div></div><div className="report-block"><h4>7. Recomendación sistémico-operativa</h4><p>Usar esta importación como capa manual de inteligencia mientras se automatiza. Para FIN-M40, solo debe cambiar el esquema de campos específicos: ruta de calculadora, fuente de liquidación, tramo obligatorio JUR-TP y recuperación JUR-RT-AFORE/INFONAVIT.</p></div></>;
}
function Diccionario() { return <><div className="callout"><strong>Modelo escalable:</strong> todos los mini CRM deben exportar una capa común y una capa específica por servicio. Así el Sistema Comercial Integral puede reportar campañas distintas sin rediseñar el motor.</div><div className="cards"><div className="card"><h4>Capa común obligatoria</h4><ul><li>ID</li><li>Fecha Registro</li><li>Nombre Completo</li><li>Teléfono / Email</li><li>Fuente/Origen</li><li>Nivel/Calificación</li><li>Estado Contacto</li><li>Estado Flujo</li><li>Asesor Asignado</li><li>Duplicado</li><li>Notas</li></ul></div><div className="card"><h4>SF-R73 específico</h4><ul><li>Rango de Edad</li><li>Escolaridad</li><li>NSS (Dígitos)</li><li>Estado Trámite</li><li>Descripción del Caso</li><li>Ruta AF-04 / JUR-07 futura</li></ul></div><div className="card"><h4>FIN-M40 próximo</h4><ul><li>Ruta calculadora</li><li>Capital disponible</li><li>Fuente de liquidación</li><li>Estado cliente: prospecto / ya paga M40 / post-resolución</li><li>Tramo JUR-TP obligatorio</li><li>Tramo JUR-RT-AFORE/INFONAVIT obligatorio</li></ul></div><div className="card"><h4>RVD posterior</h4><ul><li>Tipo RVD</li><li>Capacidad económica</li><li>Documentos base</li><li>Riesgo de recuperación</li><li>Nodo responsable siguiente</li></ul></div></div></>; }
