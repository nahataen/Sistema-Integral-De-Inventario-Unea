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