import React from 'react';

export default function IncidentBadge({ estado }) {
  const e = String(estado || '').toLowerCase();
  const cls = e.includes('cerr') ? 'ok' : e.includes('seguimiento') ? 'info' : 'risk';
  return <span className={`tag ${cls}`}>{estado || 'Abierta'}</span>;
}
