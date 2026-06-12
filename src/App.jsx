import React from 'react';
import useAppState from './hooks/useAppState.js';
import { sections } from './constants/services.js';
import Kpi from './components/common/Kpi.jsx';
import Section from './components/common/Section.jsx';
import Dashboard from './components/Dashboard.jsx';
import Importar from './components/Importar.jsx';
import Tabla from './components/Tabla.jsx';
import Asesores from './components/Asesores.jsx';
import Incidencias from './components/Incidencias.jsx';
import Reporte from './components/Reporte.jsx';
import Diccionario from './components/Diccionario.jsx';

export default function App() {
  const {
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
  } = useAppState();

  const campaignSelector = state.imports.length ? (
    <div className="field">
      <label>Campaña activa</label>
      <select
        value={activeImport?.id || ''}
        onChange={e => updateState(p => ({ ...p, activeImportId: e.target.value }))}
      >
        {state.imports.map(i => (
          <option key={i.id} value={i.id}>
            {i.name} · {i.service} · {i.rows.length}
          </option>
        ))}
      </select>
    </div>
  ) : null;

  return (
    <div className="app">
      <aside className="side">
        <div className="brand">
          <div className="logo">JPM</div>
          <div>
            <h1>Sistema Comercial Integral</h1>
            <small>v4.3 · CRM campañas + incidencias</small>
          </div>
        </div>
        <div className="side-note">
          Recibe exportaciones CSV de mini CRMs por campaña, genera reporte manual, registra
          incidencias operativas por gerencia y deja el modelo listo para escalar SF-R73 → FIN-M40
          → RVD → nuevos servicios.
        </div>
        <nav className="nav">
          {sections.map(s => (
            <button
              key={s[0]}
              data-id={s[0]}
              onClick={() => setActiveSection(s[0])}
              className={activeSection === s[0] ? 'active' : ''}
            >
              <span className="dot" />
              {s[1]}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main">
        <header className="hero">
          <h2>Inteligencia comercial por campaña</h2>
          <p>
            Importa el CSV del mini CRM, normaliza los campos, asigna servicio rector, calcula
            métricas de contacto, prioridad, flujo, asesores, riesgos operativos, registra
            incidencias manuales y genera un informe gerencial reutilizable para cualquier campaña.
          </p>
          <div className="toolbar">
            <button className="btn ghost" onClick={() => setActiveSection('importar')}>
              ⬆ Importar CSV CRM
            </button>
            <button className="btn ghost" onClick={() => setActiveSection('reporte')}>
              📄 Generar reporte
            </button>
            <button className="btn ghost" onClick={() => setActiveSection('incidencias')}>
              ⚠ Incidencias
            </button>
            <button className="btn ghost" onClick={downloadJSON}>
              💾 Exportar JSON
            </button>
            <label className="btn ghost">
              📂 Importar JSON
              <input className="hidden" type="file" accept="application/json" onChange={importJSON} />
            </label>
            <button className="btn ghost" onClick={downloadFilteredCSV}>
              📊 Exportar CSV normalizado
            </button>
            <button className="btn ghost" onClick={() => window.print()}>
              🖨 Imprimir sección actual / PDF
            </button>
            <button className="btn warn" onClick={clearAll}>
              🗑 Limpiar
            </button>
          </div>
        </header>

        <div className="grid" id="kpis">
          <Kpi label="Leads importados" value={m.total} sub="Campaña activa" />
          <Kpi
            label="Pendientes contacto"
            value={m.pending}
            sub={`${m.total ? Math.round((m.pending / m.total) * 100) : 0}% del total`}
            color="var(--vta)"
          />
          <Kpi
            label="Interesados / proceso"
            value={m.interested}
            sub={`${Math.round(m.interestRate * 100)}% sobre contactados`}
            color="var(--jur)"
          />
          <Kpi label="Alertas NSS ≥98" value={m.nss98} sub="Revisión necesaria" color="var(--rr)" />
        </div>

        <div id="sections">
          <Section
            id="dashboard"
            activeSection={activeSection}
            title="📊 Dashboard"
            description="Resumen de la campaña activa, KPIs y alertas automáticas."
          >
            <Dashboard
              activeImport={activeImport}
              rows={rows}
              m={m}
              setActiveSection={setActiveSection}
            />
          </Section>

          <Section
            id="importar"
            activeSection={activeSection}
            title="⬆ Importar CSV CRM"
            description="Carga manual de exportaciones CSV de mini CRM por campaña."
          >
            <Importar
              state={state}
              activeImport={activeImport}
              form={importForm}
              setForm={setImportForm}
              handleCSV={handleCSV}
              campaignSelector={campaignSelector}
              deleteImport={deleteImport}
              setActive={id => updateState(p => ({ ...p, activeImportId: id }))}
              setActiveSection={setActiveSection}
            />
          </Section>

          <Section
            id="tabla"
            activeSection={activeSection}
            title="📋 Leads normalizados"
            description="Vista operativa de los registros importados."
          >
            {campaignSelector}
            <Tabla rows={rows} />
          </Section>

          <Section
            id="asesores"
            activeSection={activeSection}
            title="👥 Asesores"
            description="Distribución de carga, contacto e interés por asesor."
          >
            <Asesores rows={rows} />
          </Section>

          <Section
            id="incidencias"
            activeSection={activeSection}
            title="⚠ Incidencias operativas"
            description="Registro manual de incidencias capturadas por gerencia, vinculadas a campaña, asesor, etapa y responsable."
          >
            <Incidencias
              rows={rows}
              form={incForm}
              setForm={setIncForm}
              addIncidencia={addIncidencia}
              incidencias={filteredIncidencias}
              closeIncidencia={closeIncidencia}
              deleteIncidencia={deleteIncidencia}
              activeImport={activeImport}
            />
          </Section>

          <Section
            id="reporte"
            activeSection={activeSection}
            title="📄 Reporte gerencial"
            description="Informe generado desde el CSV importado, con concentrado por asesor e incidencias operativas."
          >
            <Reporte
              activeImport={activeImport}
              rows={rows}
              m={m}
              incidencias={filteredIncidencias}
              setActiveSection={setActiveSection}
            />
          </Section>

          <Section
            id="diccionario"
            activeSection={activeSection}
            title="🧩 Diccionario escalable"
            description="Campos base para SF-R73, FIN-M40, RVD y campañas futuras."
          >
            <Diccionario />
          </Section>
        </div>
      </main>

      <div className={`toast ${toast.show ? 'show' : ''} ${toast.err ? 'err' : ''}`}>
        {toast.msg}
      </div>
    </div>
  );
}
