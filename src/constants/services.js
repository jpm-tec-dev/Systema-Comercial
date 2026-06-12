export const LSKEY = 'jpm_sistema_comercial_v43_campaign_importer';
export const LEGACY_LSKEY = 'jpm_sistema_comercial_v42_campaign_importer';

export const servicios = [
  'SF-R73',
  'FIN-M40',
  'RVD',
  'JUR-TP',
  'JUR-M40',
  'JUR-RT-AFORE/INFONAVIT',
  'Cuotas Complementarias',
  'Otro'
];

export const sections = [
  ['dashboard', '📊 Dashboard', 'Resumen de la campaña activa, KPIs y alertas automáticas.'],
  ['importar', '⬆ Importar CSV CRM', 'Carga manual de exportaciones CSV de mini CRM por campaña.'],
  ['tabla', '📋 Leads normalizados', 'Vista operativa de los registros importados.'],
  ['asesores', '👥 Asesores', 'Distribución de carga, contacto e interés por asesor.'],
  ['incidencias', '⚠ Incidencias operativas', 'Registro manual de incidencias capturadas por gerencia, vinculadas a campaña, asesor, etapa y responsable.'],
  ['reporte', '📄 Reporte gerencial', 'Informe generado desde el CSV importado, con concentrado por asesor e incidencias operativas.'],
  ['diccionario', '🧩 Diccionario escalable', 'Campos base para SF-R73, FIN-M40, RVD y campañas futuras.']
];
