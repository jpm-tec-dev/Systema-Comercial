import React from 'react';
import { isPending, isInterested, isNoInterest, isActive } from '../utils/metrics.js';

export default function Asesores({ rows }) {
  const grouped = {};
  rows.forEach(r => {
    const a = r.asesor || 'Sin Asignar';
    (grouped[a] ||= []).push(r);
  });

  const data = Object.entries(grouped)
    .map(([a, list]) => ({
      a,
      total: list.length,
      pending: list.filter(isPending).length,
      interested: list.filter(isInterested).length,
      noint: list.filter(isNoInterest).length,
      active: list.filter(isActive).length,
      aaa: list.filter(r => /AAA/.test(r.nivelNormalizado)).length
    }))
    .sort((x, y) => y.total - x.total);

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Asesor</th>
            <th>Total</th>
            <th>Activos</th>
            <th>Pendientes</th>
            <th>Interesados/Proceso</th>
            <th>Sin interés</th>
            <th>SF-AAA</th>
            <th>Lectura</th>
          </tr>
        </thead>
        <tbody>
          {data.length ? (
            data.map(d => (
              <tr key={d.a}>
                <td>
                  <strong>{d.a}</strong>
                </td>
                <td>{d.total}</td>
                <td>{d.active}</td>
                <td>{d.pending}</td>
                <td>{d.interested}</td>
                <td>{d.noint}</td>
                <td>{d.aaa}</td>
                <td>
                  {d.pending > d.total * 0.75 ? (
                    <span className="tag risk">Backlog alto</span>
                  ) : d.interested ? (
                    <span className="tag ok">Con tracción</span>
                  ) : (
                    <span className="tag info">Monitorear</span>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8">Sin datos.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
