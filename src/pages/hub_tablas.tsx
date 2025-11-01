import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { invoke } from "@tauri-apps/api/tauri";
import { open } from "@tauri-apps/api/dialog";
import { convertFileSrc } from "@tauri-apps/api/tauri";

// Función helper para depuración
const getImageSrc = (imagePath: string | undefined) => {
  if (!imagePath) return null;
  console.log("Ruta original:", imagePath);
  const converted = convertFileSrc(imagePath);
  console.log("Ruta convertida:", converted);
  return converted;
};

interface TableInfo {
  name: string;
  image_path?: string;
}

const InventarioDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dbName = location.state?.dbName || "Desconocida";

  // --- ESTADO ---
  const [searchTerm, setSearchTerm] = useState("");
  const [tableData, setTableData] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  // --- CARGAR TABLAS ---
  const loadTables = async () => {
    try {
      const tableList: TableInfo[] = await invoke("list_tables", { dbName });
      console.log("Tablas cargadas:", tableList);
      setTableData(tableList);
    } catch (error) {
      console.error("Error al cargar tablas:", error);
      alert("Error al cargar las tablas de la base de datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dbName !== "Desconocida") {
      loadTables();
    } else {
      setLoading(false);
    }
  }, [dbName, refreshKey]);

  // --- FUNCIONES ---
  const handleEditTable = (tableName: string) => {
    navigate("/pagina", { state: { tableName, dbName } });
  };

  const handleDeleteTable = async (tableName: string) => {
    const confirmDelete = window.confirm(
      `¿Estás seguro de eliminar la tabla "${tableName}"? Esta acción es irreversible.`
    );
    if (confirmDelete) {
      try {
        await invoke("delete_table", { dbName, tableName, confirmDelete: true });
        setRefreshKey((prev) => prev + 1);
      } catch (error) {
        alert("Error al eliminar la tabla");
      }
    }
  };

  const handleUploadImage = async (tableName: string) => {
    try {
      setUploadingImage(tableName);

      // Abrir diálogo para seleccionar imagen
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Imágenes',
          extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp']
        }]
      });

      if (selected && typeof selected === 'string') {
        await invoke("upload_table_image", {
          dbName,
          tableName,
          imagePath: selected
        });

        // Refrescar la lista de tablas
        setRefreshKey((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error al subir imagen:", error);
      alert("Error al subir la imagen");
    } finally {
      setUploadingImage(null);
    }
  };

  const handleDeleteImage = async (tableName: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const confirmDelete = window.confirm(
      `¿Estás seguro de eliminar la imagen de "${tableName}"?`
    );

    if (confirmDelete) {
      try {
        await invoke("delete_table_image", { dbName, tableName });
        setRefreshKey((prev) => prev + 1);
      } catch (error) {
        console.error("Error al eliminar imagen:", error);
        alert("Error al eliminar la imagen");
      }
    }
  };

  // --- FILTRADO DE TABLAS ---
  const filteredTables = tableData.filter((table) =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 p-5 flex flex-col">
        <h2 className="text-2xl font-bold text-gray-100">UNEA</h2>

        <div className="mt-6 bg-gray-700 p-3 rounded-lg flex items-center">
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full mr-3"></span>
          <span className="font-semibold text-gray-300">{dbName}</span>
        </div>

        <nav className="mt-8 space-y-2">
          <a
            href="#"
            className="flex items-center p-3 text-blue-400 bg-blue-900/50 rounded-lg font-semibold"
          >
            🗃️
            <span className="ml-3">Base de datos</span>
          </a>
          <a
            href="#"
            className="flex items-center p-3 text-gray-400 hover:bg-gray-700 rounded-lg"
          >
            ❔
            <span className="ml-3">Acerca de</span>
          </a>
        </nav>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header>
          <h1 className="text-4xl font-bold text-gray-100">
            Tablas de {dbName}
          </h1>
          <p className="text-gray-400 mt-1">Administrar tablas</p>
        </header>

        {/* Barra de acciones */}
        <div className="mt-8 flex items-center justify-between">
          <div className="relative w-full max-w-xs">
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
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Cuadrícula de tablas */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {loading ? (
            <p className="text-gray-400">Cargando tablas...</p>
          ) : filteredTables.length === 0 ? (
            <p className="text-gray-400">No hay tablas disponibles.</p>
          ) : (
            filteredTables.map((table) => (
              <div
                key={`${table.name}-${refreshKey}`}
                className="bg-gray-800 rounded-lg shadow-sm overflow-hidden transform hover:-translate-y-1 transition-transform duration-200 border border-gray-700 cursor-pointer"
                onClick={() => handleEditTable(table.name)}
              >
                {/* Imagen o placeholder */}
                <div className="w-full h-40 bg-gray-700 flex items-center justify-center text-gray-400 relative group overflow-hidden">
                  {table.image_path ? (
                    <>
                      <img
                        src={getImageSrc(table.image_path) || ""}
                        alt={table.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error("Error al cargar imagen:", table.image_path);
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="text-center">
                                <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                <p class="text-sm text-gray-400">Error al cargar</p>
                              </div>
                            `;
                          }
                        }}
                        onLoad={() => {
                          console.log("Imagen cargada exitosamente:", table.name);
                        }}
                      />
                      <button
                        onClick={(e) => handleDeleteImage(table.name, e)}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        title="Eliminar imagen"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <div className="text-center">
                      <svg
                        className="w-12 h-12 mx-auto mb-2 opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-sm">Sin imagen</p>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-100 mb-3">{table.name}</h3>

                  {/* Botón de subir imagen */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUploadImage(table.name);
                    }}
                    disabled={uploadingImage === table.name}
                    className="w-full mb-3 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {uploadingImage === table.name ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {table.image_path ? "Cambiar imagen" : "Subir imagen"}
                      </>
                    )}
                  </button>

                  <div className="flex gap-3 text-sm font-semibold">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTable(table.name);
                      }}
                      className="flex-1 text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTable(table.name);
                      }}
                      className="flex-1 text-red-400 hover:text-red-300 hover:underline"
                    >
                      Borrar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default InventarioDashboard;