import React from 'react';

export default function Bars({ entries }) {
  if (!entries.length) return <p className="mini">Sin datos.</p>;
  const max = Math.max(...entries.map(x => x[1]), 1);
  return entries.slice(0, 10).map(([k, v]) => (
    <div className="barrow" key={k}>
      <div className="barlabel">
        <span>{k || 'Sin dato'}</span>
        <strong>{v}</strong>
      </div>
      <div className="bar">
        <span style={{ width: `${Math.round((v / max) * 100)}%` }} />
      </div>
    </div>
  ));
}
