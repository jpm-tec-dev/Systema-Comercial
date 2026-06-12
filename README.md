# JPM Sistema Comercial Integral - Conversión a React

Conversión funcional del HTML original a una app React montable con Vite.

## Ejecutar

```bash
npm install
npm run dev
```

## Archivos principales

- `src/App.jsx`: componente principal, estado, carga CSV, JSON, incidencias y reportes.
- `src/App.css`: CSS migrado desde el HTML original.
- `src/main.jsx`: punto de entrada React.
- `index.html`: HTML base para Vite.

## Notas de migración

- Los `onclick` globales del HTML se cambiaron por handlers React (`onClick`, `onChange`).
- `localStorage` se conserva con la misma llave principal.
- La normalización CSV y las reglas de NSS se conservaron en funciones utilitarias.
- La impresión sigue usando `window.print()` y las reglas `@media print` del CSS original.
