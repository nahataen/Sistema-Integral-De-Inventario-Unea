import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ConsultaTablaFront from '../components/ui/consulta_tabla_front';

const Pagina = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tableName, dbName } = location.state || {};

  const [searchTerm, setSearchTerm] = useState("");
  // CAMBIO: Renombrado de 'selectedFilter' a 'sortOrder'
  const [sortOrder, setSortOrder] = useState("default"); // 'default', 'asc', 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);

  const handleRowSelect = (rowId: number) => {
    setSelectedRowId(selectedRowId === rowId ? null : rowId);
  };

  const handleEditRow = () => {
    if (selectedRowId !== null) {
      navigate('/editar_fila', {
        state: {
          rowId: selectedRowId,
          tableName,
          dbName
        }
      });
    }
  };

  // Listen for edit row events from the table component
  useEffect(() => {
    const handleEditRowEvent = () => {
      handleEditRow();
    };

    window.addEventListener('editRow', handleEditRowEvent);
    return () => window.removeEventListener('editRow', handleEditRowEvent);
  }, [selectedRowId, tableName, dbName]);

  // Mock data for the table
  const records = [
    {
      id: 1,
      zona: "Noroeste",
      campus: "Florido",
      departamento: "TI",
      puesto: "Encargado TI"
    },
    {
      id: 2,
      zona: "Noroeste",
      campus: "Florido",
      departamento: "Recursos humanos",
      puesto: "Administradora"
    },
    {
      id: 3,
      zona: "Noroeste",
      campus: "Florido",
      departamento: "Dirección",
      puesto: "Directora"
    },
    {
      id: 4,
      zona: "Noroeste",
      campus: "Florido",
      departamento: "Servicios escolares",
      puesto: "Coordinadora"
    }
  ];

  // Columnas usadas para el filtrado (la búsqueda general)
  const filterableColumns = Object.keys(records[0] || {}).filter(key => key !== 'id');

  // CAMBIO: Lógica de filtrado y ordenamiento combinada
  const filteredRecords = records.filter(record => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;

    // La búsqueda (filtro) AHORA SIEMPRE busca en todas las columnas
    return filterableColumns.some(column =>
      String(record[column as keyof typeof record] || '').toLowerCase().includes(term)
    );
  }).sort((a, b) => {
    // Lógica de ORDENAMIENTO

    // === ¡IMPORTANTE! ===
    // Asumo que ordenamos por 'zona'.
    // Cambia 'zona' por 'campus' o 'puesto' si lo necesitas.
    const sortColumn = 'zona';
    // ====================

    if (sortOrder === 'asc') {
      return String(a[sortColumn] || '').localeCompare(String(b[sortColumn] || ''));
    }
    if (sortOrder === 'desc') {
      return String(b[sortColumn] || '').localeCompare(String(a[sortColumn] || ''));
    }
    // 'default' (orden por ID)
    return a.id - b.id;
  });
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/')} className="flex items-center text-gray-400 hover:text-gray-300 transition-colors text-sm sm:text-base">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Volver</span>
            </button>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">
              {tableName ? `Tabla: ${tableName}` : 'Identificación y ubicación'}
            </h1>
            <div className="w-16 sm:w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <nav className="space-y-2">
              <button className="w-full text-left px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-300 bg-gray-700 rounded-lg font-medium">
                Identificación y ubicación
              </button>
              <button className="w-full text-left px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-400 hover:text-gray-300 hover:bg-gray-600 rounded-lg transition-colors">
                Tabla 2
              </button>
              <button className="w-full text-left px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-400 hover:text-gray-300 hover:bg-gray-600 rounded-lg transition-colors">
                Tabla 3
              </button>
              <button className="w-full text-left px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-400 hover:text-gray-300 hover:bg-gray-600 rounded-lg transition-colors">
                Tabla 4
              </button>
            </nav>

            <button className="mt-6 sm:mt-8 w-full flex items-center justify-center px-3 sm:px-4 py-2 sm:py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nueva Tabla
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search and Filter */}
            <div className="mb-4 sm:mb-6">
              <div className="relative mb-3 sm:mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar registros en todas las columnas" // Placeholder actualizado
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-3 text-sm sm:text-base border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-3 sm:mb-4">
                <button className="flex items-center justify-center px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden sm:inline">Subir imagen de QR</span>
                  <span className="sm:hidden">QR</span>
                </button>

                {/* CAMBIO: Select de ordenamiento */}
                <div className="flex-1">
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="default">Orden por defecto</option>
                    <option value="asc">Ordenar Alfabéticamente (A-Z)</option>
                    <option value="desc">Ordenar Alfabéticamente (Z-A)</option>
                  </select>
                </div>

                <button className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap">
                  Crear registro
                </button>
              </div>
            </div>


            {/* Table Data from Database */}
            {tableName && (
              <ConsultaTablaFront
                dbName={dbName || "test"}
                tableName={tableName}
                selectedRowId={selectedRowId}
                onRowSelect={handleRowSelect}
                searchTerm={searchTerm}
                // NOTA: 'ConsultaTablaFront' ahora necesita recibir el 'sortOrder'
                // para aplicar el ordenamiento a los datos reales de la BD.
                sortOrder={sortOrder}
              />
            )}

            {/* Pagination */}
            {totalPages > 1 && !tableName && ( // Ocultar si la tabla real está visible
              <div className="flex flex-wrap justify-center items-center gap-1 sm:gap-2 mt-4 sm:mt-6">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2 sm:px-3 py-1 sm:py-2 text-sm sm:text-base bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="hidden sm:inline">Anterior</span>
                  <span className="sm:hidden">←</span>
                </button>

                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    if (pageNumber > totalPages) return null;
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => paginate(pageNumber)}
                        className={`px-2 sm:px-3 py-1 sm:py-2 text-sm sm:text-base rounded-lg transition-colors ${
                          currentPage === pageNumber
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-2 sm:px-3 py-1 sm:py-2 text-sm sm:text-base bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <span className="sm:hidden">→</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Pagina;