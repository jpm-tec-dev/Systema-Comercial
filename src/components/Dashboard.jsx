import React from 'react';
import Bars from './common/Bars.jsx';
import { countBy } from '../utils/metrics.js';

export default function Dashboard({ activeImport, rows, m, setActiveSection }) {
  if (!activeImport) {
    return (
      <div className="drop">
        <h4>Sin campaña importada</h4>
        <p>Importa el CSV del mini CRM para generar métricas.</p>
        <button className="btn primary" onClick={() => setActiveSection('importar')}>
          Importar CSV
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="callout">
        <strong>Campaña activa:</strong> {activeImport.name} · Servicio {activeImport.service} ·{' '}
        {activeImport.rows.length} registros · importado {activeImport.importedAt}. El sistema
        conserva los datos crudos y una capa normalizada para reportes comparables entre servicios.
      </div>
      <div className="cards">
        <div className="card">
          <h4>Distribución por nivel</h4>
          <Bars entries={countBy(rows, 'nivelNormalizado')} />
        </div>
        <div className="card">
          <h4>Estado contacto</h4>
          <Bars entries={countBy(rows, 'contacto')} />
        </div>
        <div className="card">
          <h4>Estado flujo</h4>
          <Bars entries={countBy(rows, 'flujo')} />
        </div>
        <div className="card">
          <h4>Lectura NSS / validación</h4>
          <Bars entries={countBy(rows, 'nssBand')} />
        </div>
      </div>
      {m.pending > 0 && (
        <div className="alert">
          <strong>Alerta operativa:</strong> {m.pending} leads siguen pendientes de contacto.
          Priorizar SF-AAA/SF-AA activos antes de nuevas importaciones.
        </div>
      )}
      {m.nss98 > 0 && (
        <div className="alert">
          <strong>Alerta de clasificación:</strong> {m.nss98} registros tienen NSS ≥98. No implica
          descarte automático; sí exige etiqueta de revisión necesaria y ruta de validación
          documental.
        </div>
      )}
    </>
  );
}
