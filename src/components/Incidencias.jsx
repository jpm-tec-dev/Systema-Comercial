import React from 'react';
import { servicios } from '../constants/services.js';
import Bars from './common/Bars.jsx';
import IncidentBadge from './common/IncidentBadge.jsx';
import { countBy } from '../utils/metrics.js';

export default function Incidencias({
  rows,
  form,
  setForm,
  addIncidencia,
  incidencias,
  closeIncidencia,
  deleteIncidencia
}) {
  const asesores = [...new Set(rows.map(r => r.asesor).filter(Boolean))].sort();
  const set = (k, v) => setForm({ ...form, [k]: v });

  return (
    <>
      <div className="callout">
        <strong>Registro manual de gerencia:</strong> esta sección no modifica los leads
        importados; agrega una bitácora operativa para documentar bloqueos, fallas de captura,
        retrasos, reasignaciones, dudas de clasificación, fricciones del equipo y acciones
        correctivas.
      </div>
      <div className="form-grid">
        <div className="field">
          <label>Fecha</label>
          <input
            type="date"
            value={form.fecha}
            onChange={e => set('fecha', e.target.value)}
          />
        </div>
        <div className="field">
          <label>Servicio</label>
          <select
            value={form.servicio}
            onChange={e => set('servicio', e.target.value)}
          >
            {servicios.map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="field half">
          <label>Campaña vinculada</label>
          <input
            value={form.campana}
            onChange={e => set('campana', e.target.value)}
          />
        </div>
        <div className="field">
          <label>Tipo</label>
          <select
            value={form.tipo}
            onChange={e => set('tipo', e.target.value)}
          >
            {[
              'Backlog / atraso de contacto',
              'Asignación incorrecta',
              'Dato incompleto',
              'Duplicidad',
              'Clasificación dudosa',
              'Falla técnica CRM',
              'Fricción detectada',
              'Capacitación / criterio',
              'Otro'
            ].map(x => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Severidad</label>
          <select
            value={form.severidad}
            onChange={e => set('severidad', e.target.value)}
          >
            {['Baja', 'Media', 'Alta', 'Crítica'].map(x => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Etapa</label>
          <select
            value={form.etapa}
            onChange={e => set('etapa', e.target.value)}
          >
            {[
              'Captura',
              'Primer contacto',
              'Seguimiento',
              'Derivación AF-04',
              'Validación JUR-07',
              'Cierre / descarte',
              'Reporte'
            ].map(x => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Asesor relacionado</label>
          <input
            list="asesoresList"
            value={form.asesor}
            onChange={e => set('asesor', e.target.value)}
            placeholder="Opcional"
          />
          <datalist id="asesoresList">
            {asesores.map(x => (
              <option key={x} value={x} />
            ))}
          </datalist>
        </div>
        <div className="field">
          <label>Responsable siguiente acción</label>
          <input
            value={form.responsable}
            onChange={e => set('responsable', e.target.value)}
          />
        </div>
        <div className="field">
          <label>Estado</label>
          <select
            value={form.estado}
            onChange={e => set('estado', e.target.value)}
          >
            {['Abierta', 'En seguimiento', 'Cerrada'].map(x => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Próxima revisión</label>
          <input
            type="date"
            value={form.proxima}
            onChange={e => set('proxima', e.target.value)}
          />
        </div>
        <div className="field full">
          <label>Descripción de incidencia</label>
          <textarea
            value={form.descripcion}
            onChange={e => set('descripcion', e.target.value)}
          />
        </div>
        <div className="field full">
          <label>Acción correctiva / acuerdo</label>
          <textarea
            value={form.accion}
            onChange={e => set('accion', e.target.value)}
          />
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <button className="btn primary" onClick={addIncidencia}>
          Guardar incidencia
        </button>
      </div>
      <div className="cards" style={{ marginTop: 16 }}>
        <div className="card">
          <h4>Resumen de incidencias</h4>
          <Bars entries={countBy(incidencias, 'estado')} />
        </div>
        <div className="card">
          <h4>Criterio de uso</h4>
          <p>
            Usar esta bitácora para decisiones de gerencia: redistribuir carga, corregir criterio,
            pedir ajuste al mini CRM o documentar incidencias antes del reporte semanal.
          </p>
        </div>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Severidad</th>
              <th>Tipo</th>
              <th>Campaña</th>
              <th>Asesor</th>
              <th>Responsable</th>
              <th>Descripción</th>
              <th>Acción</th>
              <th>Próxima</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {incidencias.length ? (
              incidencias.map(i => (
                <tr key={i.id}>
                  <td>{i.fecha}</td>
                  <td>
                    <IncidentBadge estado={i.estado} />
                  </td>
                  <td>{i.severidad}</td>
                  <td>{i.tipo}</td>
                  <td>{i.campana || i.servicio}</td>
                  <td>{i.asesor}</td>
                  <td>{i.responsable}</td>
                  <td>{i.descripcion}</td>
                  <td>{i.accion}</td>
                  <td>{i.proxima}</td>
                  <td>
                    <button className="btn sm" onClick={() => closeIncidencia(i.id)}>
                      Cerrar
                    </button>{' '}
                    <button className="btn sm" onClick={() => deleteIncidencia(i.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="11">Sin incidencias registradas.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
