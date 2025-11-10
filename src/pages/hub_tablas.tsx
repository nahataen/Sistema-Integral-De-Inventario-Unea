import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { invoke } from "@tauri-apps/api/tauri";
import { open } from "@tauri-apps/api/dialog";
import toast, { Toaster } from "react-hot-toast";
import TableCard from "../components/TableCard";
import ImportarExportar from "../components/ui/ImportarExportar";

export interface TableInfo {
  name: string;
  image_path?: string;
}

const InventarioDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dbName = location.state?.dbName || "Desconocida";

  const [searchTerm, setSearchTerm] = useState("");
  const [tableData, setTableData] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  const loadTables = useCallback(async () => {
    try {
      const tableList: TableInfo[] = await invoke("list_tables", { dbName });
      console.log("Tablas cargadas después de actualizar:", tableList);
      setTableData(tableList);
    } catch (error) {
      console.error("Error al cargar tablas:", error);
      toast.error("Error al cargar las tablas de la base de datos.");
    } finally {
      setLoading(false);
    }
  }, [dbName]);

  useEffect(() => {
    if (dbName !== "Desconocida") {
      loadTables();
    } else {
      setLoading(false);
    }
  }, [dbName, refreshKey, loadTables]);

  const handleEditTable = (tableName: string) => {
    navigate("/pagina", { state: { tableName, dbName } });
  };

  const handleDeleteTable = async (tableName: string) => {
    const confirmDelete = window.confirm(
      `¿Estás seguro de eliminar la tabla "${tableName}"? Esta acción es irreversible.`
    );
    if (confirmDelete) {
      try {
        await invoke("delete_table", {
          dbName,
          tableName,
          confirmDelete: true,
        });
        setRefreshKey((prev) => prev + 1);
        toast.success(`Tabla "${tableName}" eliminada con éxito.`);
      } catch (error) {
        console.error("Error al eliminar tabla:", error);
        toast.error("Error al eliminar la tabla.");
      }
    }
  };

  const handleUploadImage = async (tableName: string) => {
    try {
      setUploadingImage(tableName);
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Imágenes",
            extensions: ["jpg", "jpeg", "png", "gif", "webp"],
          },
        ],
      });

      if (selected && typeof selected === "string") {
        const newImagePath: string = await invoke("upload_table_image", {
          dbName,
          tableName,
          imagePath: selected,
        });

        setTableData((prevData) =>
          prevData.map((table) =>
            table.name === tableName
              ? { ...table, image_path: newImagePath }
              : table
          )
        );

        setRefreshKey((prev) => prev + 1);
        toast.success(`Imagen para "${tableName}" subida con éxito.`);
      }
    } catch (error) {
      console.error("Error al subir imagen:", error);
      toast.error("Error al subir la imagen.");
    } finally {
      setUploadingImage(null);
    }
  };

  const handleDeleteImage = async (tableName: string) => {
    const confirmDelete = window.confirm(
      `¿Estás seguro de eliminar la imagen de "${tableName}"?`
    );

    if (confirmDelete) {
      try {
        await invoke("delete_table_image", { dbName, tableName });
        setRefreshKey((prev) => prev + 1);
        toast.success(`Imagen de "${tableName}" eliminada con éxito.`);
      } catch (error) {
        console.error("Error al eliminar imagen:", error);
        toast.error("Error al eliminar la imagen.");
      }
    }
  };

  const handleImportExportSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const filteredTables = tableData.filter((table) =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-gray-100">
      <aside className="w-64 bg-gray-800/60 backdrop-blur-sm border-r border-gray-700/50 p-6 flex flex-col">
        <div className="mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent tracking-tight">
            UNEA
          </h2>
        </div>

        <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 flex items-center gap-3 mb-8 transition-all duration-200 hover:border-gray-600">
          <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px] shadow-emerald-500/50"></span>
          <span className="font-medium text-gray-300 truncate">{dbName}</span>
        </div>

        <nav className="flex-1 space-y-2">
          <Link
            to="/"
            state={{ dbName }}
            className="flex items-center gap-3 px-4 py-3 text-blue-400 bg-gradient-to-r from-blue-900/30 to-transparent border-l-4 border-blue-500 rounded-lg font-semibold transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span>Base de datos</span>
          </Link>
          <Link
            to="/about"
            className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-inset"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Acerca de</span>
          </Link>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 hub-main-scroll">
        <header className="mb-8 pb-6 border-b border-gray-700/50">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Tablas de {dbName}
          </h1>
          <p className="text-gray-400 mt-2 text-sm sm:text-base">
            Selecciona una tabla para ver y gestionar sus registros
          </p>
        </header>

        <div className="mb-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative w-full sm:max-w-md">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar tablas por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-600"
              />
            </div>
          </div>

          <ImportarExportar
            dbName={dbName}
            tableList={tableData}
            onSuccess={handleImportExportSuccess}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-gray-800/50 border border-gray-700 rounded-2xl col-span-full transition-all duration-300">
              <svg className="animate-spin w-10 h-10 text-blue-500 mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-400 text-lg font-medium">Cargando tablas...</p>
              <p className="text-gray-500 text-sm mt-1">Conectando con la base de datos</p>
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="col-span-full">
              {searchTerm ? (
                <div className="text-center p-12 bg-gray-800/50 border border-gray-700 rounded-2xl transition-all duration-200 hover:border-gray-600">
                  <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-gray-300 text-lg font-semibold mb-1">No se encontraron tablas</h3>
                  <p className="text-gray-500 text-sm">
                    No hay tablas que coincidan con "{searchTerm}"
                  </p>
                </div>
              ) : (
                <div className="text-center p-12 bg-gray-800/50 border border-gray-700 rounded-2xl transition-all duration-200 hover:border-gray-600">
                  <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <h3 className="text-gray-300 text-lg font-semibold mb-1">No hay tablas disponibles</h3>
                  <p className="text-gray-500 text-sm">Esta base de datos aún no contiene tablas</p>
                </div>
              )}
            </div>
          ) : (
            filteredTables.map((table) => (
              <TableCard
                key={`${table.name}-${refreshKey}`}
                table={table}
                dbName={dbName}
                uploadingImage={uploadingImage}
                onEdit={handleEditTable}
                onDelete={handleDeleteTable}
                onUploadImage={handleUploadImage}
                onDeleteImage={handleDeleteImage}
                refreshKey={refreshKey}
              />
            ))
          )}
        </div>
      </main>
      <Toaster position="bottom-right" reverseOrder={false} />
      <style>{`
        /* Scrollbar styles matching consulta_tabla_front.tsx */
        .hub-main-scroll {
          scrollbar-width: auto;
          scrollbar-color: #2563eb #374151;
        }

        /* Scrollbar más grueso y visible para WebKit */
        .hub-main-scroll::-webkit-scrollbar {
          width: 18px;
          height: 18px;
        }

        .hub-main-scroll::-webkit-scrollbar-track {
          background: #374151;
          border-left: 1px solid #4b5563;
        }

        .hub-main-scroll::-webkit-scrollbar-thumb {
          background: #2563eb;
          border-radius: 9px;
          border: 4px solid #374151;
          box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
        }

        .hub-main-scroll::-webkit-scrollbar-thumb:hover {
          background: #3b82f6;
        }

        /* Botones de scroll opcionales para mejor UX */
        .hub-main-scroll::-webkit-scrollbar-button:single-button {
          display: block;
          height: 16px;
          width: 16px;
          background: #374151;
          border: 1px solid #4b5563;
        }

        .hub-main-scroll::-webkit-scrollbar-button:single-button:hover {
          background: #4b5563;
        }

        .hub-main-scroll::-webkit-scrollbar-button:single-button:vertical:decrement {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23e5e7eb' d='M6 3L1 8h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: center;
        }

        .hub-main-scroll::-webkit-scrollbar-button:single-button:vertical:increment {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23e5e7eb' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: center;
        }
      `}</style>
    </div>
  );
};

export default InventarioDashboard;