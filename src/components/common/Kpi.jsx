import React from 'react';

export default function Kpi({ label, value, sub, color }) {
  return (
    <div className="kpi" style={color ? { borderTopColor: color } : undefined}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      <div className="sub">{sub}</div>
    </div>
  );
}
