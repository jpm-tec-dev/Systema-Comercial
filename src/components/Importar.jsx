import React from 'react';
import { servicios } from '../constants/services.js';

export default function Importar({
  state,
  activeImport,
  form,
  setForm,
  handleCSV,
  campaignSelector,
  deleteImport,
  setActive,
  setActiveSection
}) {
  return (
    <>
      <div className="form-grid">
        <div className="field">
          <label>Servicio rector</label>
          <select
            value={form.service}
            onChange={e => setForm({ ...form, service: e.target.value })}
          >
            {servicios.map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="field half">
          <label>Nombre de campaña</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field">
          <label>Origen</label>
          <input
            value={form.origin}
            onChange={e => setForm({ ...form, origin: e.target.value })}
          />
        </div>
        <div className="field full">
          <label>Nota operativa</label>
          <textarea
            value={form.note}
            onChange={e => setForm({ ...form, note: e.target.value })}
          />
        </div>
      </div>
      <div className="drop" style={{ marginTop: 16 }}>
        <h4>Sube el CSV exportado del mini CRM</h4>
        <p>Compatible con el formato actual del mini CRM.</p>
        <input type="file" accept=".csv,text/csv" onChange={handleCSV} />
      </div>
      <div style={{ marginTop: 16 }}>{campaignSelector}</div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Campaña</th>
              <th>Servicio</th>
              <th>Importado</th>
              <th>Registros</th>
              <th>Origen</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {state.imports.length ? (
              state.imports.map(i => (
                <tr key={i.id}>
                  <td>{i.name}</td>
                  <td>{i.service}</td>
                  <td>{i.importedAt}</td>
                  <td>{i.rows.length}</td>
                  <td>{i.origin}</td>
                  <td>
                    <button
                      className="btn sm"
                      onClick={() => {
                        setActive(i.id);
                        setActiveSection('dashboard');
                      }}
                    >
                      Usar
                    </button>{' '}
                    <button className="btn sm" onClick={() => deleteImport(i.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">Sin importaciones.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
