# Glosario Técnico Complementario

## Inter-Process Communication (IPC)
Mecanismo que permite la comunicación entre procesos independientes en un sistema operativo. En aplicaciones híbridas como Tauri, facilita el intercambio de datos y comandos entre el frontend web y el backend nativo, asegurando una integración segura y eficiente sin comprometer el aislamiento de procesos.

## Serialización
Proceso de convertir estructuras de datos complejas en un formato que puede ser almacenado o transmitido, como JSON o binario. Utiliza librerías como Serde en Rust para transformar objetos en cadenas serializables, permitiendo la persistencia de datos y comunicación entre componentes del sistema.

## Programación Asíncrona
Paradigma de programación que permite ejecutar operaciones sin bloquear el hilo principal, mejorando la responsividad de la aplicación. En este stack, se implementa mediante async/await en Rust y promesas en JavaScript, gestionando tareas como consultas a base de datos o llamadas al sistema de archivos de forma no bloqueante.

## Promesas
Objetos que representan el resultado eventual de una operación asíncrona, permitiendo manejar estados de éxito o error de manera elegante. En el frontend, facilitan el manejo de llamadas API y operaciones de E/S, proporcionando una API consistente para trabajar con código asíncrono y mejorar la legibilidad del flujo de ejecución.

## Codificación Base64
Método de codificación que convierte datos binarios en una representación de texto ASCII segura para transmisión. En esta aplicación, se utiliza para manejar imágenes y archivos binarios en la base de datos, permitiendo su almacenamiento y recuperación eficiente sin corrupción de datos.

## Expresiones Regulares
Patrones de búsqueda y manipulación de texto basados en reglas sintácticas. Empleadas en Rust mediante la librería Regex para validar entradas, parsear datos y realizar búsquedas avanzadas en cadenas, proporcionando una herramienta poderosa para procesamiento de texto en operaciones de base de datos y validación.

## Manejo de Fecha y Hora
Funcionalidad para trabajar con fechas, horas y zonas horarias de manera precisa. La librería Chrono en Rust ofrece tipos de datos robustos para representar instantes temporales, calcular diferencias y formatear fechas, esencial para auditoría, logging y gestión temporal de registros en aplicaciones de base de datos.

## Operaciones del Sistema de Archivos
Interfaz para interactuar con el sistema de archivos del sistema operativo, incluyendo lectura, escritura y navegación de directorios. En Tauri, se configura con permisos específicos para acceder a rutas de datos de usuario, permitiendo importar/exportar bases de datos y gestionar archivos de manera segura y controlada.

## Carga Perezosa (Lazy Loading)
Técnica de optimización que carga componentes o módulos solo cuando son necesarios, reduciendo el tiempo inicial de carga de la aplicación. En el frontend, se implementa con React.lazy y Suspense para dividir el código en chunks, mejorando el rendimiento y la experiencia de usuario en aplicaciones de una sola página.

## API de Contexto
Mecanismo para compartir estado global entre componentes sin prop drilling excesivo. En aplicaciones React, proporciona un proveedor de contexto que inyecta datos y funciones a través del árbol de componentes, facilitando la gestión de estado compartido como configuraciones de tabla o estado de modales de manera centralizada y eficiente.
## Notificaciones Toast
Sistema de alertas no intrusivas que muestran mensajes temporales al usuario sobre acciones realizadas o errores ocurridos. En esta aplicación, se implementa con react-hot-toast para proporcionar feedback visual inmediato, mejorando la experiencia de usuario sin interrumpir el flujo de trabajo principal.

## Manejo de Eventos
Proceso de capturar y responder a interacciones del usuario, como clics, doble clics o cambios en formularios. En componentes React, se utiliza para gestionar la lógica de UI, como selección de filas en tablas o activación de modales, permitiendo una interfaz dinámica y responsiva.

## Operaciones CRUD
Acrónimo para Create, Read, Update, Delete: operaciones básicas de manipulación de datos en bases de datos. En esta aplicación, se implementan para gestionar registros de tablas SQLite, permitiendo a los usuarios crear nuevos registros, consultar existentes, editar información y eliminar entradas de manera segura y controlada.

## Gestión de Modales
Técnica para mostrar ventanas emergentes que requieren atención del usuario, como confirmaciones de eliminación o formularios de creación. En el frontend, se maneja con estado local para controlar visibilidad y contenido, proporcionando una interfaz clara para acciones críticas sin navegar a nuevas páginas.

## Búsqueda y Filtrado
Funcionalidad que permite a los usuarios encontrar datos específicos dentro de grandes conjuntos de información. Se implementa con algoritmos de búsqueda en memoria que filtran filas de tabla basadas en términos de consulta, mejorando la usabilidad al reducir la sobrecarga cognitiva en interfaces de datos complejas.

## Renderizado de Tablas
Proceso de convertir datos estructurados en una representación visual tabular para facilitar la lectura y manipulación. En esta aplicación, se utiliza para mostrar registros de base de datos con funcionalidades avanzadas como edición en línea, selección múltiple y navegación, optimizando la presentación de datos relacionales.

## Manejo de Archivos
Capacidad para procesar archivos del usuario, incluyendo carga, conversión y almacenamiento. En el frontend, se utiliza FileReader API para convertir archivos a formatos compatibles como Base64, permitiendo subir imágenes a la base de datos y gestionar contenido multimedia de manera eficiente.

## Enrutamiento
Mecanismo para navegar entre diferentes vistas o páginas de la aplicación sin recargar completamente. Con React Router, se implementa navegación declarativa que mantiene el estado de la aplicación, permitiendo transiciones fluidas entre secciones como dashboards, formularios de creación y vistas de detalle.

## Memoización
Técnica de optimización que almacena en caché resultados de funciones costosas para evitar recálculos innecesarios. En React, se utiliza useMemo y useCallback para optimizar el rendimiento de componentes que renderizan listas grandes o realizan cálculos complejos, reduciendo el consumo de recursos.

## Hooks Personalizados
Funciones reutilizables que encapsulan lógica de estado y efectos secundarios en componentes React. Permiten extraer comportamiento común como gestión de formularios o llamadas API, promoviendo la reutilización de código y manteniendo los componentes enfocados en la presentación.