import React from 'react';
import Bars from './common/Bars.jsx';
import LevelTag from './common/LevelTag.jsx';
import IncidentBadge from './common/IncidentBadge.jsx';
import { isPending, countBy, asesorConcentradoRows } from '../utils/metrics.js';

function ConcentradoAsesor({ rows }) {
  const data = asesorConcentradoRows(rows);
  if (!data.length) return <p className="mini">Sin datos.</p>;

  return (
    <>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Asesor</th>
              <th>Total leads</th>
              <th>Activos</th>
              <th>Pendientes</th>
              <th>Contactados</th>
              <th>Interesados / Proceso</th>
              <th>Sin interés</th>
              <th>SF-AAA</th>
              <th>SF-AA</th>
              <th>SF-A1</th>
              <th>SF-NP</th>
              <th>NSS ≥98</th>
              <th>Duplicados</th>
            </tr>
          </thead>
          <tbody>
            {data.map(d => (
              <tr key={d.asesor}>
                <td>
                  <strong>{d.asesor}</strong>
                </td>
                <td>{d.total}</td>
                <td>{d.activos}</td>
                <td>{d.pendientes}</td>
                <td>{d.contactados}</td>
                <td>{d.interesados}</td>
                <td>{d.sinInteres}</td>
                <td>{d.sfAAA}</td>
                <td>{d.sfAA}</td>
                <td>{d.sfA1}</td>
                <td>{d.sfNP}</td>
                <td>{d.nss98}</td>
                <td>{d.duplicados}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mini">Este concentrado se genera desde la misma base de Leads normalizados.</p>
    </>
  );
}

export default function Reporte({ activeImport, rows, m, incidencias, setActiveSection }) {
  if (!activeImport) {
    return (
      <div className="drop">
        <h4>Sin datos</h4>
        <p>Importa una campaña para generar reporte.</p>
        <button className="btn primary" onClick={() => setActiveSection('importar')}>
          Importar CSV
        </button>
      </div>
    );
  }

  const topPending = rows.filter(isPending).slice(0, 8);

  return (
    <>
      <div className="report-block">
        <h4>
          Informe Gerencial · {activeImport.name}
        </h4>
        <p>
          <strong>Servicio rector:</strong> {activeImport.service} · <strong>Registros:</strong>{' '}
          {m.total} · <strong>Fuente:</strong> {activeImport.origin} · <strong>Archivo:</strong>{' '}
          {activeImport.fileName || ''}
        </p>
      </div>
      <div className="report-block">
        <h4>1. Resumen ejecutivo</h4>
        <ul>
          <li>
            {m.pending} leads pendientes de contacto ({m.total ? Math.round((m.pending / m.total) * 100) : 0}% del total).
          </li>
          <li>{m.interested} leads interesados / en proceso / derivables.</li>
          <li>
            {m.nss98} leads con NSS ≥98 requieren revisión necesaria, no descarte automático.
          </li>
          <li>{m.dup} duplicados marcados por el CRM.</li>
        </ul>
      </div>
      <div className="report-block">
        <h4>2. Distribución por nivel</h4>
        <Bars entries={countBy(rows, 'nivelNormalizado')} />
      </div>
      <div className="report-block">
        <h4>3. Carga por asesor · concentrado de Leads normalizados</h4>
        <ConcentradoAsesor rows={rows} />
      </div>
      <div className="report-block">
        <h4>4. Validación por NSS / regla SF-R73</h4>
        <Bars entries={countBy(rows, 'nssBand')} />
        <p className="mini">
          Para SF-R73, NSS ≤96 orienta a pre-97 probable; NSS 97 es umbral; NSS ≥98 exige revisión
          necesaria si existe escolaridad pre-1997 o indicios documentales.
        </p>
      </div>
      <div className="report-block">
        <h4>5. Prioridad operativa inmediata</h4>
        <ul>
          {topPending.length ? (
            topPending.map(r => (
              <li key={r._id}>
                <LevelTag value={r.nivelNormalizado} /> <strong>{r.prospecto}</strong> · NSS{' '}
                {r.nss} · {r.asesor} · {r.telefono}
              </li>
            ))
          ) : (
            <li>Sin pendientes visibles.</li>
          )}
        </ul>
      </div>
      <div className="report-block">
        <h4>6. Incidencias operativas registradas por gerencia</h4>
        <p>
          <strong>Total incidencias vinculadas:</strong> {incidencias.length} ·{' '}
          <strong>Abiertas/en seguimiento:</strong>{' '}
          {incidencias.filter(i => !String(i.estado || '').toLowerCase().includes('cerr')).length}
        </p>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Severidad</th>
                <th>Tipo</th>
                <th>Asesor</th>
                <th>Responsable</th>
                <th>Descripción</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {incidencias.slice(0, 25).length ? (
                incidencias.slice(0, 25).map(i => (
                  <tr key={i.id}>
                    <td>{i.fecha}</td>
                    <td>
                      <IncidentBadge estado={i.estado} />
                    </td>
                    <td>{i.severidad}</td>
                    <td>{i.tipo}</td>
                    <td>{i.asesor}</td>
                    <td>{i.responsable}</td>
                    <td>{i.descripcion}</td>
                    <td>{i.accion}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8">Sin incidencias registradas para la campaña activa.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="report-block">
        <h4>7. Recomendación sistémico-operativa</h4>
        <p>
          Usar esta importación como capa manual de inteligencia mientras se automatiza. Para
          FIN-M40, solo debe cambiar el esquema de campos específicos: ruta de calculadora, fuente
          de liquidación, tramo obligatorio JUR-TP y recuperación JUR-RT-AFORE/INFONAVIT.
        </p>
      </div>
    </>
  );
}
