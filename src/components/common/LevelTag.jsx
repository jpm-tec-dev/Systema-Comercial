import React from 'react';

export default function LevelTag({ value }) {
  const v = value || 'Sin nivel';
  const c = /AAA/.test(v) ? 'aaa' : /AA/.test(v) ? 'aa' : /A1/.test(v) ? 'a1' : /NP/.test(v) ? 'np' : 'info';
  return <span className={`tag ${c}`}>{v}</span>;
}
