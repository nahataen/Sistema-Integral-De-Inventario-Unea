import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom"; // Importamos Link para la navegación interna
import { invoke } from "@tauri-apps/api/tauri";
import { open } from "@tauri-apps/api/dialog";
// import { convertFileSrc } from "@tauri-apps/api/tauri"; // Ya no es necesario aquí, se mueve a TableCard

import toast, { Toaster } from "react-hot-toast"; // Importamos react-hot-toast para notificaciones

// Importar el nuevo componente TableCard
import TableCard from "../components/TableCard";

// Definimos la interfaz para la información de la tabla
// (Esto ayuda a TypeScript a entender la estructura de los datos que esperamos)
export interface TableInfo {
  name: string;
  image_path?: string; // La ruta de la imagen es opcional
}

// Componente principal para el dashboard de inventario, donde se gestionan las tablas de una base de datos
const InventarioDashboard = () => {
  // Hook para navegar entre diferentes rutas de la aplicación
  const navigate = useNavigate();
  // Hook para obtener información sobre la URL actual, incluyendo el estado pasado
  const location = useLocation();
  // Obtenemos el nombre de la base de datos del estado de la ruta o usamos "Desconocida" por defecto
  const dbName = location.state?.dbName || "Desconocida";

  // Estado para el término de búsqueda de tablas
  const [searchTerm, setSearchTerm] = useState("");
  // Estado para almacenar los datos de las tablas cargadas
  const [tableData, setTableData] = useState<TableInfo[]>([]);
  // Estado para indicar si las tablas están cargando (mostrar un spinner, por ejemplo)
  const [loading, setLoading] = useState(true);
  // Clave para forzar el refresco de la lista de tablas (se incrementa para reactivar useEffect)
  const [refreshKey, setRefreshKey] = useState(0);
  // Estado para indicar qué tabla está subiendo una imagen (para deshabilitar el botón de esa tabla)
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  // --- CARGAR TABLAS ---
  // Función asíncrona para obtener la lista de tablas de la base de datos
  // Usamos useCallback para memorizar esta función y que no cambie en cada renderizado,
  // solo si sus dependencias (dbName) cambian.
  const loadTables = useCallback(async () => {
    try {
      // Llamamos a la función "list_tables" del backend de Tauri
      const tableList: TableInfo[] = await invoke("list_tables", { dbName });
      console.log("Tablas cargadas después de actualizar:", tableList); // Para depuración, verificamos las rutas de imagen
      setTableData(tableList); // Actualizamos el estado con las tablas obtenidas
    } catch (error) {
      console.error("Error al cargar tablas:", error); // Registramos el error en consola
      // Mostramos una notificación al usuario de que hubo un error
      toast.error("Error al cargar las tablas de la base de datos.");
    } finally {
      setLoading(false); // Indicamos que la carga ha terminado, independientemente del resultado
    }
  }, [dbName]); // Esta función solo se recrea si el valor de dbName cambia

  // Hook de efecto que se ejecuta cuando el nombre de la base de datos o la clave de refresco cambian
  useEffect(() => {
    if (dbName !== "Desconocida") {
      loadTables(); // Si tenemos un nombre de base de datos válido, cargamos las tablas
    } else {
      setLoading(false); // Si no, simplemente indicamos que no hay carga pendiente
    }
  }, [dbName, refreshKey, loadTables]); // Dependencias del efecto: se ejecuta si dbName, refreshKey o loadTables cambian

  // --- FUNCIONES DE MANEJO DE EVENTOS ---

  // Función para manejar la edición de una tabla (navega a la página de edición)
  const handleEditTable = (tableName: string) => {
    // Navegamos a la ruta "/pagina", pasando el nombre de la tabla y la base de datos como estado
    navigate("/pagina", { state: { tableName, dbName } });
  };

  // Función para manejar la eliminación de una tabla
  const handleDeleteTable = async (tableName: string) => {
    // Pedimos confirmación al usuario antes de proceder con una acción irreversible
    const confirmDelete = window.confirm(
      `¿Estás seguro de eliminar la tabla "${tableName}"? Esta acción es irreversible.`,
    );
    if (confirmDelete) {
      try {
        // Llamamos al comando del backend para eliminar la tabla
        await invoke("delete_table", {
          dbName,
          tableName,
          confirmDelete: true, // Se pasa la confirmación al backend
        });
        // Incrementamos la clave de refresco para volver a cargar la lista de tablas
        setRefreshKey((prev) => prev + 1);
        // Mostramos una notificación de éxito
        toast.success(`Tabla "${tableName}" eliminada con éxito.`);
      } catch (error) {
        // Registramos el error y mostramos una notificación de error
        console.error("Error al eliminar tabla:", error);
        toast.error("Error al eliminar la tabla.");
      }
    }
  };

  // Función para manejar la subida de una imagen para una tabla
  const handleUploadImage = async (tableName: string) => {
    try {
      // Indicamos que se está subiendo una imagen para esta tabla específica
      setUploadingImage(tableName);

      // Abrimos el diálogo de selección de archivos del sistema operativo
      const selected = await open({
        multiple: false, // Solo permitir seleccionar un archivo
        filters: [
          {
            name: "Imágenes", // Filtramos para mostrar solo archivos de imagen
            extensions: ["jpg", "jpeg", "png", "gif", "webp"],
          },
        ],
      });

      // Si se seleccionó un archivo (y es una cadena de texto, que es la ruta)
      if (selected && typeof selected === "string") {
        // Llamamos al comando del backend para subir la imagen y asociarla a la tabla
        const newImagePath: string = await invoke("upload_table_image", {
          dbName,
          tableName,
          imagePath: selected, // Ruta del archivo de imagen seleccionado
        });

        // Actualizamos el estado local de 'tableData' con la nueva ruta de imagen
        setTableData((prevData) =>
          prevData.map((table) =>
            table.name === tableName
              ? { ...table, image_path: newImagePath }
              : table,
          ),
        );

        // Incrementamos refreshKey para forzar la recarga de la imagen en TableCard
        setRefreshKey((prev) => prev + 1);
        // Mostramos una notificación de éxito
        toast.success(`Imagen para \"${tableName}\" subida con éxito.`);
      }
    } catch (error) {
      // Registramos el error y mostramos una notificación de error
      console.error("Error al subir imagen:", error);
      toast.error("Error al subir la imagen.");
    } finally {
      // Aseguramos que el estado de "subiendo imagen" se resetee, independientemente del resultado
      setUploadingImage(null);
    }
  };

  // Función para manejar la eliminación de la imagen asociada a una tabla
  const handleDeleteImage = async (tableName: string) => {
    // Pedimos confirmación al usuario
    const confirmDelete = window.confirm(
      `¿Estás seguro de eliminar la imagen de "${tableName}"?`,
    );

    if (confirmDelete) {
      try {
        // Llamamos al comando del backend para eliminar la imagen
        await invoke("delete_table_image", { dbName, tableName });
        // Refrescamos la lista de tablas para que la imagen desaparezca
        setRefreshKey((prev) => prev + 1);
        // Mostramos una notificación de éxito
        toast.success(`Imagen de "${tableName}" eliminada con éxito.`);
      } catch (error) {
        // Registramos el error y mostramos una notificación de error
        console.error("Error al eliminar imagen:", error);
        toast.error("Error al eliminar la imagen.");
      }
    }
  };

  // --- LÓGICA DE FILTRADO ---
  // Filtramos las tablas basándonos en el término de búsqueda, sin importar mayúsculas/minúsculas
  const filteredTables = tableData.filter((table) =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    // Contenedor principal de la aplicación, con diseño flex para barra lateral y contenido
    <div className="flex h-screen bg-gray-900 font-sans">
      {/* Barra lateral (Sidebar) */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 p-5 flex flex-col">
        {/* Título de la aplicación */}
        <h2 className="text-2xl font-bold text-gray-100">UNEA</h2>

        {/* Indicador de la base de datos actual */}
        <div className="mt-6 bg-gray-700 p-3 rounded-lg flex items-center">
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full mr-3"></span>
          <span className="font-semibold text-gray-300">{dbName}</span>
        </div>

        {/* Sección de navegación principal */}
        <nav className="mt-8 space-y-2">
          {/* Enlace para volver al dashboard de tablas (activo) */}
          <Link
            to="/" // Navega a la ruta principal, manteniendo el dbName si es necesario
            state={{ dbName }}
            className="flex items-center p-3 text-blue-400 bg-blue-900/50 rounded-lg font-semibold"
          >
            🗃️
            <span className="ml-3">Base de datos</span>
          </Link>
          {/* Enlace de ejemplo para "Acerca de" (esta ruta necesitaría ser definida en tu router) */}
          <Link
            to="/about"
            className="flex items-center p-3 text-gray-400 hover:bg-gray-700 rounded-lg"
          >
            ❔<span className="ml-3">Acerca de</span>
          </Link>
        </nav>
      </aside>

      {/* Contenido principal de la página */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header>
          {/* Título de la sección, mostrando el nombre de la base de datos */}
          <h1 className="text-4xl font-bold text-gray-100">
            Tablas de {dbName}
          </h1>
          {/* Descripción de la sección */}
          <p className="text-gray-400 mt-1">Administrar tablas</p>
        </header>

        {/* Barra de acciones (ej. búsqueda) */}
        <div className="mt-8 flex items-center justify-between">
          <div className="relative w-full max-w-xs">
            {/* Icono de búsqueda dentro del campo de texto */}
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            {/* Campo de entrada para buscar tablas */}
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} // Actualiza el término de búsqueda al escribir
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Cuadrícula donde se muestran las tarjetas de las tablas */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {/* Mostramos un mensaje si está cargando, si no hay tablas o si mostramos las tablas */}
          {loading ? (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-800 rounded-lg shadow-sm border border-gray-700 col-span-full">
              {/* Spinner de carga (el mismo que ya usamos) */}
              <svg
                className="animate-spin h-8 w-8 text-blue-500 mb-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="text-gray-400 text-lg">Cargando tablas...</p>
            </div>
          ) : filteredTables.length === 0 ? (
            <p className="text-gray-400">No hay tablas disponibles.</p>
          ) : (
            // Iteramos sobre las tablas filtradas y mostramos un TableCard para cada una
            filteredTables.map((table) => (
              <TableCard
                key={`${table.name}-${refreshKey}`} // Clave única para cada tarjeta (importante para React)
                table={table} // Pasamos toda la información de la tabla
                dbName={dbName} // Pasamos el nombre de la base de datos
                uploadingImage={uploadingImage} // Indicamos si una imagen se está subiendo actualmente
                onEdit={handleEditTable} // Pasamos la función para editar la tabla
                onDelete={handleDeleteTable} // Pasamos la función para eliminar la tabla
                onUploadImage={handleUploadImage} // Pasamos la función para subir una imagen
                onDeleteImage={handleDeleteImage} // Pasamos la función para eliminar la imagen
                refreshKey={refreshKey} // Pasamos la clave de refresco para ayudar a la caché de imágenes
              />
            ))
          )}
        </div>
      </main>
      {/* Componente para mostrar notificaciones tipo "toast" */}
      <Toaster position="bottom-right" reverseOrder={false} />
    </div>
  );
};

export default InventarioDashboard;
