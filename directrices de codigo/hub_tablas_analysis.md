# Documentación del Componente `InventarioDashboard` (`src/pages/database/hub_tablas.tsx`)

## Resumen General

El archivo `src/pages/database/hub_tablas.tsx` implementa un componente funcional de React llamado `InventarioDashboard`, que sirve como un panel de control para gestionar tablas de bases de datos en una aplicación basada en Tauri. Este componente sigue una estructura estándar de React, utilizando hooks para la gestión de estado, efectos para la carga de datos inicial y manejadores de eventos para las interacciones del usuario. Se integra estrechamente con las APIs de Tauri para la comunicación con el backend, operaciones de archivos y diálogos.

El componente es responsable de:
- Mostrar una lista de tablas de una base de datos específica.
- Permitir operaciones CRUD (Crear, Leer, Actualizar, Eliminar) en las tablas.
- Gestionar la subida y eliminación de imágenes asociadas a las tablas.
- Importar y exportar tablas en formato JSON.
- Proporcionar una interfaz de búsqueda para filtrar tablas.

El componente tiene 424 líneas de código y podría beneficiarse de una descomposición en subcomponentes más pequeños o hooks personalizados para mejorar la legibilidad.

## Estructura del Código

### Importaciones
Las importaciones están bien organizadas e incluyen:
- Hooks de React: `useState`, `useEffect`, `useCallback`.
- Utilidades de enrutamiento: `useNavigate`, `useLocation` de `react-router-dom`.
- APIs de Tauri: `invoke`, `open`, `save`, `readTextFile`, `writeTextFile`.
- Librerías de UI: `toast` y `Toaster` de `react-hot-toast`.
- Componentes personalizados: `TableCard`, `Sidebar`.
- Estilos: Módulo CSS `InventarioDashboard.module.css`.

### Definición de Interfaz
- `TableInfo`: Interfaz que define la estructura de los datos de tabla, con propiedades `name` (string) e `image_path` opcional (string).

### Gestión de Estado
Se utilizan múltiples hooks `useState` para manejar diversos estados de la UI:
- `searchTerm`: Término de búsqueda para filtrar tablas.
- `tableData`: Array de objetos `TableInfo` que representa las tablas cargadas.
- `loading`: Booleano para indicar si se están cargando las tablas.
- `refreshKey`: Número utilizado para forzar re-renders después de operaciones.
- `uploadingImage`: String o null para indicar qué tabla está subiendo una imagen.
- Estados para modales: `showDeleteDialog`, `deleteCandidate`, `showImportDialog`, `importData`, `newTableName`.

### Efectos y Callbacks
- `useEffect`: Se ejecuta para cargar tablas inicialmente y cuando cambian `dbName` o `refreshKey`.
- `useCallback`: Para `loadTables`, memoizando la función para evitar re-renders innecesarios.

### Manejadores de Eventos
Funciones dedicadas para operaciones CRUD, gestión de imágenes, importación/exportación y interacciones con modales.

### Render JSX
Un layout limpio con:
- Un sidebar importado.
- Área principal con encabezado, controles de búsqueda e importación, y una cuadrícula de `TableCard`.
- Modales condicionales para eliminación e importación.
- Indicadores de carga y estados vacíos.

## Componentes

### Componentes Principales
- **`InventarioDashboard`**: El componente principal que orquesta toda la funcionalidad.
- **`TableCard`**: Componente importado que representa cada tabla en la cuadrícula. Recibe props como `table`, `dbName`, `uploadingImage`, y funciones de callback para editar, eliminar, subir imagen, eliminar imagen y exportar.
- **`Sidebar`**: Componente de layout importado para la navegación lateral.

### Modales
- **Modal de Eliminación**: Aparece cuando se confirma la eliminación de una tabla, con botones para confirmar o cancelar.
- **Modal de Importación**: Se muestra cuando una tabla ya existe durante la importación, ofreciendo opciones para renombrar, reemplazar o cancelar.

## Funciones y Métodos

### Funciones de Carga y Actualización
- **`loadTables`**: Función asíncrona que invoca `list_tables` en el backend para cargar la lista de tablas. Maneja errores con toasts y establece el estado de carga.

### Manejadores de Operaciones CRUD
- **`handleEditTable`**: Navega a la página de edición de la tabla seleccionada, pasando `tableName` y `dbName` como estado.
- **`handleDeleteTable`**: Establece el candidato para eliminación y muestra el modal de confirmación.
- **`confirmDelete`**: Confirma la eliminación invocando `delete_table` en el backend, actualiza el estado y muestra toasts de éxito/error.

### Manejadores de Imágenes
- **`handleUploadImage`**: Abre un diálogo de archivos para seleccionar una imagen, invoca `upload_table_image` y actualiza el estado de la tabla.
- **`handleDeleteImage`**: Confirma la eliminación de la imagen con un `window.confirm` y invoca `delete_table_image`.

### Manejadores de Importación/Exportación
- **`handleImportTable`**: Abre un diálogo para seleccionar un archivo JSON, lee su contenido y intenta importar invocando `import_table_from_json`. Si la tabla existe, muestra el modal de importación.
- **`handleImportConfirm`**: Maneja las acciones del modal de importación (renombrar, reemplazar, cancelar), invocando `import_table_from_json_with_options` con las opciones apropiadas.
- **`handleExportTable`**: Invoca `export_table_to_json`, abre un diálogo de guardado y escribe el contenido JSON en el archivo seleccionado.

### Otras Funciones
- **`filteredTables`**: Variable computada que filtra `tableData` basado en `searchTerm`, insensible a mayúsculas.

## Gestión de Estado

El componente utiliza 10+ hooks `useState`, lo que indica una gestión de estado compleja. Se recomienda considerar `useReducer` para consolidar el estado y mejorar la predictibilidad. Los estados se actualizan de manera inmutable, y se utiliza `refreshKey` para forzar re-renders, aunque esto es un anti-patrón; sería mejor actualizar `tableData` directamente después de operaciones exitosas.

## Interacciones del Usuario

- **Búsqueda**: Input de texto que filtra tablas en tiempo real.
- **Importar Tabla**: Botón que abre un diálogo de archivos para seleccionar JSON y importar tablas.
- **Editar Tabla**: Clic en una tarjeta de tabla para navegar a la página de edición.
- **Eliminar Tabla**: Opción en la tarjeta que muestra un modal de confirmación.
- **Subir/Eliminar Imagen**: Opciones en la tarjeta para gestionar imágenes asociadas.
- **Exportar Tabla**: Opción para exportar la tabla a JSON.
- **Modales**: Interacciones para confirmar eliminaciones o resolver conflictos de importación.

## Integración con Tauri

- **Invocaciones al Backend**: Usa `invoke` para llamadas como `list_tables`, `delete_table`, `upload_table_image`, etc., con payloads que coinciden con las firmas de funciones Rust.
- **Diálogos de Archivos**: Utiliza `open` y `save` para selecciones de archivos, con filtros para tipos específicos (imágenes, JSON).
- **Operaciones de Archivos**: `readTextFile` y `writeTextFile` para leer/escribir archivos JSON.
- La integración es sólida y aprovecha el modelo de seguridad de Tauri para acceso a archivos.

## Calidad del Código

- **Uso de TypeScript**: Tipado fuerte con interfaces y tipos explícitos, mejorando la fiabilidad.
- **Legibilidad**: Nombres de variables descriptivos, pero funciones largas como `handleImportTable` podrían dividirse.
- **Consistencia**: Convenciones de camelCase, uso consistente de hooks y async/await.
- **Manejo de Errores**: Bloques try-catch robustos con toasts amigables, aunque algunos errores genéricos podrían mejorarse.
- **Duplicación**: Estilos inline repetidos en modales; se recomienda usar clases CSS.

## Mejores Prácticas

- **React**: Hooks usados correctamente con dependencias apropiadas. Estado inmutable, renderizado condicional bien manejado.
- **TypeScript**: Interfaces para estructuras de datos, tipado de parámetros.
- **Tauri**: Uso seguro de `invoke` y operaciones de archivos.
- **Áreas de Mejora**: Consolidar estado con `useReducer`, extraer lógica a hooks personalizados, mover estilos inline a CSS, agregar validación (e.g., para `newTableName`), extraer constantes para mensajes.

## Problemas Potenciales

- **Manejo de Errores Frágil**: Análisis de mensajes de error con regex en `handleImportTable` asume formatos específicos del backend.
- **Falta de Validación**: `newTableName` sin validación de longitud o caracteres.
- **Sincronización de Estado**: Uso de `refreshKey` en lugar de actualizar `tableData` directamente.
- **Estados de Modal**: Asegurar que se reseteen al desmontar.
- **Condiciones de Carrera**: Operaciones asíncronas rápidas podrían superponerse.
- **Fugas de Memoria**: Sin limpieza de efectos, pero aceptable para un dashboard.

## Consideraciones de Rendimiento

- **Re-renders**: `filteredTables` se computa en cada render; usar `useMemo`.
- **Re-renders de Componentes**: `TableCard` recibe muchas props; memoizar si es necesario.
- **Carga de Datos**: `loadTables` se llama en mount y refresh; considerar paginación para datasets grandes.
- **Manejo de Imágenes**: Subidas involucran I/O; optimizar en el backend.
- **Tamaño del Bundle**: Importaciones aceptables, pero monitorear dependencias.

## Mantenibilidad

- **Modularidad**: Componente monolítico; extraer manejadores a hooks, modales a componentes separados.
- **Pruebas**: Agregar pruebas unitarias para manejadores e integración para invocaciones.
- **Documentación**: Comentarios escasos; agregar JSDoc.
- **Escalabilidad**: Con crecimiento, considerar gestión de estado global (Zustand/Redux).
- **Organización**: Agrupar funciones relacionadas.

## Otras Observaciones

- **React Específico**: Uso de `useLocation` para `dbName`; considerar params de URL para marcadores.
- **TypeScript Específico**: Sin características avanzadas, apropiado para el alcance.
- **Tauri Específico**: Integración sólida; asegurar validación en backend para seguridad.
- **Seguridad**: Operaciones de archivos gated por diálogos; validar inputs en frontend y backend.
- **UX**: Toasts proporcionan retroalimentación buena; agregar indicadores de carga para operaciones largas.
- **Mejoras Potenciales**: Atajos de teclado, undo para operaciones destructivas.
- **Dependencias**: Librerías actualizadas y compatibles.

Este componente es funcional y bien integrado con Tauri, pero refactorizar para modularidad mejoraría la mantenibilidad a largo plazo. Priorizar extraer estilos inline, consolidar estado y agregar validación para abordar los problemas identificados.

## Sugerencias de Mejora

### Optimizaciones de React
- **Uso de `useMemo` para filtrado**: Implementar `useMemo` para `filteredTables` para evitar recalculaciones innecesarias en cada render, mejorando el rendimiento especialmente con listas grandes de tablas.
- **Memoización de componentes**: Aplicar `React.memo` al componente `TableCard` si se detectan re-renders innecesarios, pasando props de manera eficiente.
- **Consolidación de estado con `useReducer`**: Reemplazar múltiples `useState` para estados de modales y carga con un único `useReducer` para simplificar la lógica de estado y mejorar la predictibilidad.
- **Memoización de manejadores**: Asegurar que todos los manejadores de eventos estén memoizados con `useCallback` para prevenir re-renders de componentes hijos.

### Mejoras en UI/UX
- **Indicadores de carga granular**: Agregar estados de carga específicos para operaciones individuales (e.g., subir imagen, eliminar tabla) en lugar de un indicador global.
- **Mensajes de error mejorados**: Proporcionar mensajes de error más descriptivos y específicos, incluyendo sugerencias de resolución para el usuario.
- **Tooltips y ayuda contextual**: Agregar tooltips a botones e inputs para mejorar la usabilidad, especialmente para usuarios nuevos.
- **Confirmaciones consistentes**: Reemplazar `window.confirm` con modales personalizados para eliminaciones de imágenes, manteniendo consistencia con el diseño de la aplicación.
- **Paginación o virtualización**: Implementar paginación o virtualización para listas de tablas grandes para mejorar el rendimiento y la navegación.

### Accesibilidad (A11y)
- **Etiquetas ARIA**: Agregar `aria-label` o `aria-labelledby` a todos los botones, inputs y elementos interactivos para lectores de pantalla.
- **Roles de modal apropiados**: Asegurar que los modales tengan `role="dialog"`, `aria-modal="true"` y `aria-labelledby` apuntando al título del modal.
- **Gestión de foco**: Implementar focus trapping en modales y restaurar el foco al elemento anterior al cerrar.
- **Navegación por teclado**: Garantizar que todos los elementos sean accesibles con teclado (tab order, activación con Enter/Espacio).
- **Texto alternativo para imágenes**: Verificar y agregar `alt` text descriptivo para las imágenes de tabla en `TableCard`.
- **Contraste de color**: Auditar y ajustar colores para cumplir con estándares WCAG AA, especialmente para texto sobre fondos oscuros.

### Rendimiento
- **Debouncing en búsqueda**: Implementar debouncing en el input de búsqueda para reducir la frecuencia de filtrado y mejorar la responsividad.
- **Carga diferida de datos**: Considerar lazy loading para datos de tablas si el backend soporta paginación.
- **Optimización de re-renders**: Evitar actualizaciones de estado innecesarias y usar `refreshKey` solo cuando sea estrictamente necesario; preferir actualizaciones directas de `tableData`.

### Mejores Prácticas de Frontend
- **Extracción de estilos inline**: Mover todos los estilos inline en modales a clases CSS en el módulo de estilos para mejorar mantenibilidad y consistencia.
- **Constantes para strings repetidos**: Definir constantes para mensajes de toast, placeholders y otros strings para facilitar la internacionalización futura.
- **Descomposición de componentes**: Extraer modales en componentes separados (`DeleteModal`, `ImportModal`) para reducir el tamaño del componente principal y mejorar la reutilización.
- **Validación de inputs**: Agregar validación en tiempo real para `newTableName` (e.g., longitud mínima, caracteres permitidos) con feedback visual.
- **Boundaries de error**: Implementar `ErrorBoundary` alrededor del componente para manejar errores de renderizado gracefully.
- **Pruebas unitarias**: Agregar pruebas con Jest/React Testing Library para manejadores de eventos, lógica de filtrado y componentes modales.

### Otras Mejoras Relevantes
- **Internacionalización (i18n)**: Preparar el componente para i18n extrayendo textos a archivos de traducción.
- **Logging mejorado**: Implementar logging estructurado para operaciones críticas (e.g., import/export) para debugging en producción.
- **Soporte para temas**: Asegurar que los estilos sean compatibles con temas oscuros/claros si la aplicación los soporta.
- **Análisis de bundle**: Monitorear el tamaño del bundle y optimizar importaciones si crece significativamente.
- **Documentación JSDoc**: Agregar comentarios JSDoc a funciones y componentes para mejorar la documentación interna.