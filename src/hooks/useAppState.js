import { useState, useEffect, useMemo } from 'react';
import { LSKEY, LEGACY_LSKEY } from '../constants/services.js';
import { makeId, today, downloadBlob } from '../utils/helpers.js';
import { parseCSV, normalizeRow } from '../utils/csvParser.js';
import { metrics } from '../utils/metrics.js';

function initialState() {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(LSKEY) || localStorage.getItem(LEGACY_LSKEY) || '{}'
    );
    return {
      imports: Array.isArray(parsed.imports) ? parsed.imports : [],
      activeImportId: parsed.activeImportId || null,
      incidencias: Array.isArray(parsed.incidencias) ? parsed.incidencias : []
    };
  } catch {
    return { imports: [], activeImportId: null, incidencias: [] };
  }
}

export default function useAppState() {
  const [state, setState] = useState(initialState);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [toast, setToast] = useState({ msg: '', err: false, show: false });
  const [importForm, setImportForm] = useState({
    service: 'SF-R73',
    name: 'CAMPAÑA_ORGANICA_SF-R73 · Export CRM',
    origin: 'Mini CRM',
    note: 'Importación manual desde CSV. Lista para automatizar por webhook/API en fase posterior.'
  });
  const [incForm, setIncForm] = useState({
    fecha: today(),
    servicio: 'SF-R73',
    campana: '',
    tipo: 'Backlog / atraso de contacto',
    severidad: 'Baja',
    etapa: 'Captura',
    asesor: '',
    responsable: '',
    estado: 'Abierta',
    descripcion: '',
    accion: '',
    proxima: ''
  });

  const activeImport = useMemo(() => {
    return (
      state.imports.find(x => x.id === state.activeImportId) ||
      state.imports[state.imports.length - 1] ||
      null
    );
  }, [state.imports, state.activeImportId]);

  const rows = activeImport?.rows || [];
  const m = metrics(rows);

  // Sync state with localstorage
  useEffect(() => {
    localStorage.setItem(LSKEY, JSON.stringify(state));
  }, [state]);

  // Set body attribute for CSS styling
  useEffect(() => {
    document.body.setAttribute('data-active-section', activeSection);
  }, [activeSection]);

  // Update incident form default campaign/service when active import changes
  useEffect(() => {
    if (activeImport) {
      setIncForm(f => ({
        ...f,
        servicio: activeImport.service || f.servicio,
        campana: activeImport.name || f.campana
      }));
    }
  }, [activeImport]);

  function notify(msg, err = false) {
    setToast({ msg, err, show: true });
    setTimeout(() => setToast(t => ({ ...t, show: false })), err ? 2500 : 1200);
  }

  function updateState(next) {
    setState(prev => (typeof next === 'function' ? next(prev) : next));
  }

  function handleCSV(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = parseCSV(String(reader.result || ''));
        const normalized = raw.map(r => normalizeRow(r, importForm.service));
        const imp = {
          id: makeId(),
          name: importForm.name || file.name,
          service: importForm.service,
          origin: importForm.origin || 'Mini CRM',
          note: importForm.note || '',
          fileName: file.name,
          importedAt: new Date().toLocaleString('es-MX'),
          columns: Object.keys(raw[0] || {}),
          rows: normalized
        };
        updateState(prev => ({
          ...prev,
          imports: [...prev.imports, imp],
          activeImportId: imp.id
        }));
        setActiveSection('dashboard');
        notify(`✓ CSV importado: ${normalized.length} registros`);
      } catch (err) {
        notify(`No pude leer el CSV: ${err.message}`, true);
      }
    };
    reader.readAsText(file, 'utf-8');
  }

  function deleteImport(id) {
    if (!confirm('¿Eliminar esta importación?')) return;
    updateState(prev => {
      const imports = prev.imports.filter(i => i.id !== id);
      return {
        ...prev,
        imports,
        activeImportId:
          prev.activeImportId === id ? (imports.at(-1)?.id || null) : prev.activeImportId
      };
    });
  }

  function clearAll() {
    if (!confirm('¿Borrar importaciones locales?')) return;
    localStorage.removeItem(LSKEY);
    updateState({ imports: [], activeImportId: null, incidencias: [] });
    notify('Datos borrados');
  }

  function downloadJSON() {
    downloadBlob(
      new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }),
      `JPM_Sistema_Comercial_v43_${today()}.json`
    );
  }

  function importJSON(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const parsed = JSON.parse(String(r.result || '{}'));
        updateState({
          imports: Array.isArray(parsed.imports) ? parsed.imports : [],
          activeImportId: parsed.activeImportId || null,
          incidencias: Array.isArray(parsed.incidencias) ? parsed.incidencias : []
        });
        setActiveSection('dashboard');
      } catch {
        notify('JSON inválido', true);
      }
    };
    r.readAsText(file);
  }

  function downloadFilteredCSV() {
    const cols = [
      'service',
      'fecha',
      'prospecto',
      'telefono',
      'email',
      'nss',
      'nssBand',
      'escolaridad',
      'tramite',
      'nivelNormalizado',
      'contacto',
      'flujo',
      'asesor',
      'duplicado',
      'fuente'
    ];
    let txt = '\uFEFF' + cols.join(',') + '\n';
    rows.forEach(r => {
      txt +=
        cols
          .map(c => '"' + String(r[c] ?? '').replace(/"/g, '""') + '"')
          .join(',') + '\n';
    });
    downloadBlob(
      new Blob([txt], { type: 'text/csv;charset=utf-8' }),
      `JPM_CRM_normalizado_${activeImport?.service || 'campana'}_${today()}.csv`
    );
  }

  const filteredIncidencias = useMemo(() => {
    return (state.incidencias || []).filter(
      i =>
        !i.importId ||
        !activeImport ||
        i.importId === activeImport.id ||
        i.campana === activeImport.name ||
        i.servicio === activeImport.service
    );
  }, [state.incidencias, activeImport]);

  function addIncidencia() {
    if (!incForm.descripcion.trim()) {
      notify('Describe la incidencia antes de guardarla', true);
      return;
    }
    const inc = {
      ...incForm,
      id: makeId(),
      importId: activeImport?.id || '',
      creado: new Date().toLocaleString('es-MX')
    };
    updateState(prev => ({
      ...prev,
      incidencias: [inc, ...(prev.incidencias || [])]
    }));
    setIncForm(f => ({ ...f, descripcion: '', accion: '' }));
    notify('✓ Incidencia registrada');
  }

  function closeIncidencia(id) {
    updateState(prev => ({
      ...prev,
      incidencias: prev.incidencias.map(i =>
        i.id === id ? { ...i, estado: 'Cerrada', cerrado: new Date().toLocaleString('es-MX') } : i
      )
    }));
  }

  function deleteIncidencia(id) {
    if (confirm('¿Eliminar esta incidencia operativa?')) {
      updateState(prev => ({
        ...prev,
        incidencias: prev.incidencias.filter(i => i.id !== id)
      }));
    }
  }

  return {
    state,
    updateState,
    activeSection,
    setActiveSection,
    toast,
    importForm,
    setImportForm,
    incForm,
    setIncForm,
    activeImport,
    rows,
    m,
    handleCSV,
    deleteImport,
    clearAll,
    downloadJSON,
    importJSON,
    downloadFilteredCSV,
    filteredIncidencias,
    addIncidencia,
    closeIncidencia,
    deleteIncidencia
  };
}
