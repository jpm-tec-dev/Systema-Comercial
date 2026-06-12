# JPM - Sistema Comercial Integral

Este proyecto es la conversión funcional del HTML/JS original de JPM a una aplicación moderna SPA utilizando **React** y **Vite**. Permite importar archivos CSV de mini CRMs, realizar una normalización de leads y NSS, gestionar bitácoras de incidencias operativas y generar reportes gerenciales listos para imprimir.

---

## 🛠 Requisitos Previos

Antes de instalar y ejecutar el proyecto, asegúrate de tener instalado lo siguiente en tu máquina:

*   **Node.js**: Versión LTS (recomendado v18 o superior). [Descargar Node.js](https://nodejs.org/).
*   **npm**: Gestor de paquetes de Node (se instala automáticamente con Node.js).
*   **Git**: Para clonar y gestionar el repositorio.

---

## 🚀 Instalación y Uso

Sigue estos pasos para levantar la aplicación en tu entorno local:

1.  **Clonar el repositorio** (si aún no lo has hecho):
    ```bash
    git clone git@github.com:jpm-tec-dev/Systema-Comercial.git
    cd Systema-Comercial
    ```

2.  **Instalar dependencias**:
    ```bash
    npm install
    ```

3.  **Ejecutar en entorno de desarrollo**:
    ```bash
    npm run dev
    ```
    Una vez iniciado, abre tu navegador en [http://localhost:5173/](http://localhost:5173/).

4.  **Compilar para producción**:
    ```bash
    npm run build
    ```
    Esto generará los archivos listos para despliegue en la carpeta `dist/`.

---

## 🏗 Arquitectura y Refactorización

El proyecto ha sido refactorizado bajo principios de desarrollo de software limpio (como **Separation of Concerns** y **Single Responsibility Principle**), dividiendo el antiguo archivo monolítico en una estructura modular y altamente legible.

### ¿Por qué se realizó la refactorización?
*   **Mantenibilidad:** Separar la lógica matemática y de conversión de la lógica puramente visual. Así, cualquier cambio en una fórmula no romperá el diseño.
*   **Escalabilidad:** Facilitar la integración de nuevos servicios (como `FIN-M40` o `RVD`) sin congestionar un único archivo de código.
*   **Reutilización y Portabilidad:** La división limpia permite copiar componentes completos de UI (como visualizadores de barras o etiquetas de nivel) o utilidades de parseo de datos e importarlos en otros proyectos comerciales de JPM sin esfuerzo.

### Descripción de Carpetas y Estructura

La aplicación se organiza dentro del directorio `src/` de la siguiente manera:

```text
src/
├── constants/
│   └── services.js          # Constantes globales de negocio (servicios, secciones, llaves de localStorage)
├── utils/
│   ├── helpers.js           # Utilidades genéricas del sistema (formateadores, generadores de IDs, descargas)
│   ├── csvParser.js         # Algoritmos de lectura de archivos CSV y mapeo de columnas del CRM
│   └── metrics.js           # Reglas de negocio y cálculo matemático de leads, KPIs y concentrados
├── hooks/
│   └── useAppState.js       # Hook personalizado que gestiona el estado, persistencia y eventos (mecanismo central)
├── components/
│   ├── common/              # Componentes visuales genéricos y reutilizables (Kpis, tags, barras de avance, secciones)
│   │   ├── Kpi.jsx
│   │   ├── LevelTag.jsx
│   │   ├── NssTag.jsx
│   │   ├── IncidentBadge.jsx
│   │   ├── Bars.jsx
│   │   └── Section.jsx
│   ├── Dashboard.jsx        # Pestaña del panel de control
│   ├── Importar.jsx         # Interfaz para carga de archivos
│   ├── Tabla.jsx            # Visualización de los leads normalizados
│   ├── Asesores.jsx         # Panel de rendimiento de asesores
│   ├── Incidencias.jsx      # Panel de bitácora y registro de incidencias
│   ├── Reporte.jsx          # Sección generadora del informe gerencial imprimible
│   └── Diccionario.jsx      # Diccionario técnico escalable
└── App.jsx                  # Layout general del sistema y enrutador de vistas declarativo
```

---

## ⚡ Tecnologías Utilizadas

*   **Vite**: Herramienta de compilación ultrarrápida para desarrollo frontend.
*   **React**: Biblioteca de JavaScript para construir interfaces de usuario basadas en componentes.
*   **Vanilla CSS**: Diseño responsivo y personalizado mediante variables de CSS adaptadas para pantallas de proyectores y formato de impresión física (`@media print`).
*   **LocalStorage API**: Mecanismo de persistencia offline-first para guardar de forma local las importaciones e incidencias del usuario.
