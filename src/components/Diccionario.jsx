import React from 'react';

export default function Diccionario() {
  return (
    <>
      <div className="callout">
        <strong>Modelo escalable:</strong> todos los mini CRM deben exportar una capa común y una
        capa específica por servicio. Así el Sistema Comercial Integral puede reportar campañas
        distintas sin rediseñar el motor.
      </div>
      <div className="cards">
        <div className="card">
          <h4>Capa común obligatoria</h4>
          <ul>
            <li>ID</li>
            <li>Fecha Registro</li>
            <li>Nombre Completo</li>
            <li>Teléfono / Email</li>
            <li>Fuente/Origen</li>
            <li>Nivel/Calificación</li>
            <li>Estado Contacto</li>
            <li>Estado Flujo</li>
            <li>Asesor Asignado</li>
            <li>Duplicado</li>
            <li>Notas</li>
          </ul>
        </div>
        <div className="card">
          <h4>SF-R73 específico</h4>
          <ul>
            <li>Rango de Edad</li>
            <li>Escolaridad</li>
            <li>NSS (Dígitos)</li>
            <li>Estado Trámite</li>
            <li>Descripción del Caso</li>
            <li>Ruta AF-04 / JUR-07 futura</li>
          </ul>
        </div>
        <div className="card">
          <h4>FIN-M40 próximo</h4>
          <ul>
            <li>Ruta calculadora</li>
            <li>Capital disponible</li>
            <li>Fuente de liquidación</li>
            <li>Estado cliente: prospecto / ya paga M40 / post-resolución</li>
            <li>Tramo JUR-TP obligatorio</li>
            <li>Tramo JUR-RT-AFORE/INFONAVIT obligatorio</li>
          </ul>
        </div>
        <div className="card">
          <h4>RVD posterior</h4>
          <ul>
            <li>Tipo RVD</li>
            <li>Capacidad económica</li>
            <li>Documentos base</li>
            <li>Riesgo de recuperación</li>
            <li>Nodo responsable siguiente</li>
          </ul>
        </div>
      </div>
    </>
  );
}
