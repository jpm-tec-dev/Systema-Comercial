export const isActive = r =>
  String(r.flujo || '').toLowerCase().includes('activo') &&
  !String(r.flujo || '').toLowerCase().includes('inactivo');

export const isPending = r => /pendiente/i.test(r.contacto || '');

export const isInterested = r =>
  /interesado|derivable|en proceso/i.test(r.contacto || '') &&
  !/sin interes/i.test(r.contacto || '');

export const isNoInterest = r => /sin interes/i.test(r.contacto || '');

export const isDup = r => /^s[ií]/i.test(r.duplicado || '');

export function countBy(rs, key) {
  const c = {};
  rs.forEach(r => {
    const k = typeof key === 'function' ? key(r) : (r[key] || 'Sin dato');
    c[k] = (c[k] || 0) + 1;
  });
  return Object.entries(c).sort((a, b) => b[1] - a[1]);
}

export function metrics(rs) {
  const total = rs.length;
  const pending = rs.filter(isPending).length;
  const interested = rs.filter(isInterested).length;
  const noint = rs.filter(isNoInterest).length;
  const dup = rs.filter(isDup).length;
  const nss98 = rs.filter(r => r.nssNum !== null && r.nssNum >= 98).length;
  const contactados = total - pending;
  return {
    total,
    pending,
    interested,
    noint,
    dup,
    nss98,
    contactados,
    contactRate: total ? contactados / total : 0,
    interestRate: contactados ? interested / contactados : 0
  };
}

export function asesorConcentradoRows(rs) {
  const grouped = {};
  rs.forEach(r => {
    const a = r.asesor || 'Sin Asignar';
    (grouped[a] ||= []).push(r);
  });
  return Object.entries(grouped)
    .map(([asesor, list]) => ({
      asesor,
      total: list.length,
      activos: list.filter(isActive).length,
      pendientes: list.filter(isPending).length,
      contactados: list.filter(r => !isPending(r)).length,
      interesados: list.filter(isInterested).length,
      sinInteres: list.filter(isNoInterest).length,
      duplicados: list.filter(isDup).length,
      sfAAA: list.filter(r => /AAA/.test(r.nivelNormalizado)).length,
      sfAA: list.filter(r => /AA/.test(r.nivelNormalizado) && !/AAA/.test(r.nivelNormalizado)).length,
      sfA1: list.filter(r => /A1/.test(r.nivelNormalizado)).length,
      sfNP: list.filter(r => /NP/.test(r.nivelNormalizado)).length,
      nss98: list.filter(r => r.nssNum !== null && r.nssNum >= 98).length
    }))
    .sort((x, y) => y.total - x.total);
}
