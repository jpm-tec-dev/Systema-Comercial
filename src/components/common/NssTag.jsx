import React from 'react';

export default function NssTag({ row }) {
  const cls = row.nssNum !== null && row.nssNum >= 98 ? 'risk' : row.nssNum === 97 ? 'info' : 'ok';
  return <span className={`tag ${cls}`}>{row.nssBand}</span>;
}
