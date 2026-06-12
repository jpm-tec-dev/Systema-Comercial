import React from 'react';
import LevelTag from './common/LevelTag.jsx';
import NssTag from './common/NssTag.jsx';
import { isDup } from '../utils/metrics.js';

export default function Tabla({ rows }) {
  return (
    <>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Nivel</th>
              <th>Prospecto</th>
              <th>Contacto</th>
              <th>NSS</th>
              <th>Lectura NSS</th>
              <th>Escolaridad</th>
              <th>Trámite</th>
              <th>Estado contacto</th>
              <th>Flujo</th>
              <th>Asesor</th>
              <th>Duplicado</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.slice(0, 500).map(r => (
                <tr key={r._id}>
                  <td>{r.fecha}</td>
                  <td>
                    <LevelTag value={r.nivelNormalizado} />
                  </td>
                  <td>
                    <strong>{r.prospecto}</strong>
                    <br />
                    <span className="mini">{r.fuente}</span>
                  </td>
                  <td>
                    {r.telefono}
                    <br />
                    <span className="mini">{r.email}</span>
                  </td>
                  <td>{r.nss}</td>
                  <td>
                    <NssTag row={r} />
                  </td>
                  <td>{r.escolaridad}</td>
                  <td>{r.tramite}</td>
                  <td>{r.contacto}</td>
                  <td>{r.flujo}</td>
                  <td>{r.asesor}</td>
                  <td>{isDup(r) ? <span className="tag risk">Sí</span> : 'No'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="12">Sin datos importados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mini">
        Vista limitada a 500 filas para rendimiento. El reporte usa el total importado.
      </p>
    </>
  );
}
