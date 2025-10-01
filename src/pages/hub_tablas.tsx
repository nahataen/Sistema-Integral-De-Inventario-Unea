import { useState } from "react";
import { useNavigate } from "react-router-dom";

const InventarioDashboard = () => {
   const navigate = useNavigate();

   // --- ESTADO ---
   // Guarda el valor del campo de búsqueda
   const [searchTerm, setSearchTerm] = useState("");

  // --- DATOS DE EJEMPLO ---
  // En una aplicación real, estos datos vendrían de una API
  const [tableData, setTableData] = useState([
    { id: 1, name: 'Tabla_1', creationDate: '2023-01-15', image: 'https://picsum.photos/300/200?random=1' },
    { id: 2, name: 'Tabla_2', creationDate: '2023-02-20', image: 'https://picsum.photos/300/200?random=2' },
    { id: 3, name: 'Tabla_3', creationDate: '2023-03-10', image: 'https://picsum.photos/300/200?random=3' },
    { id: 4, name: 'Tabla_4', creationDate: '2023-04-05', image: 'https://picsum.photos/300/200?random=4' },
    { id: 5, name: 'Tabla_5', creationDate: '2023-05-12', image: 'https://picsum.photos/300/200?random=5' },
  ]);

  // --- LÓGICA DE FILTRADO ---
  // Filtra las tarjetas basándose en el término de búsqueda
  const filteredTables = tableData.filter(table =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- FUNCIONES ---
  // Función para manejar la eliminación de tablas
  const handleDeleteTable = (tableId: number, tableName: string) => {
    // Mostrar diálogo de confirmación
    const confirmDelete = window.confirm(
      `¿Estás seguro de que deseas eliminar la tabla "${tableName}"?\n\nEsta acción no se puede deshacer.`
    );

    // Solo proceder con la eliminación si el usuario confirma explícitamente
    if (confirmDelete === true) {
      // Eliminar la tabla del estado solo después de confirmación
      setTableData(prevData => {
        const newData = prevData.filter(table => table.id !== tableId);
        console.log(`Tabla ${tableId} (${tableName}) eliminada exitosamente. Tablas restantes: ${newData.length}`);
        return newData;
      });
    } else {
      // El usuario canceló la eliminación
      console.log(`Eliminación de tabla ${tableId} (${tableName}) cancelada por el usuario`);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 font-sans">

      {/* --- BARRA LATERAL (Sidebar) --- */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 p-5 flex flex-col">
        <h2 className="text-2xl font-bold text-gray-100">UNEA</h2>

        <div className="mt-6 bg-gray-700 p-3 rounded-lg flex items-center">
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full mr-3"></span>
          <span className="font-semibold text-gray-300">Inventario_2</span>
        </div>

        <nav className="mt-8 space-y-2">
          <a href="#" className="flex items-center p-3 text-blue-400 bg-blue-900/50 rounded-lg font-semibold">
            🗃️
            <span className="ml-3">Base de datos</span>
          </a>
          <a href="#" className="flex items-center p-3 text-gray-400 hover:bg-gray-700 rounded-lg">
            ❔
            <span className="ml-3">Acerca de</span>
          </a>
        </nav>
      </aside>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header>
          <h1 className="text-4xl font-bold text-gray-100">Tablas</h1>
          <p className="text-gray-400 mt-1">Administrar tablas</p>
        </header>

        {/* --- BARRA DE ACCIONES (Búsqueda y Filtro) --- */}
        <div className="mt-8 flex items-center justify-between">
          <div className="relative w-full max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="px-5 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-gray-300 font-semibold hover:bg-gray-600 transition-colors">
            Filtrar ▼
          </button>
        </div>

        {/* --- CUADRÍCULA DE TARJETAS --- */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {filteredTables.map((table) => (
            <div key={table.id} className="bg-gray-800 rounded-lg shadow-sm overflow-hidden transform hover:-translate-y-1 transition-transform duration-200 border border-gray-700 cursor-pointer" onClick={() => navigate('/pagina')}>
              <img src={table.image} alt={`Imagen de ${table.name}`} className="w-full h-40 object-cover" />
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-100">{table.name}</h3>
                <p className="text-sm text-gray-400 mt-1">Creado el: {table.creationDate}</p>
                <div className="mt-4 text-sm font-semibold">
                  <a href="#" className="text-blue-400 hover:underline">Editar</a>
                  <span className="text-gray-600 mx-2">|</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Evita que se active el onClick de la tarjeta
                      handleDeleteTable(table.id, table.name);
                    }}
                    className="text-red-400 hover:text-red-300 hover:underline bg-transparent border-none cursor-pointer p-0 font-semibold"
                  >
                    Borrar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* --- ACCIONES DEL FOOTER --- */}
        <footer className="mt-auto pt-8 flex justify-between items-center">
           <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold text-base hover:bg-blue-700 transition-colors flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Nueva Tabla
          </button>
          <div className="space-x-3">
             <button className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold text-base hover:bg-green-700 transition-colors">
              Importar tabla
            </button>
             <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold text-base hover:bg-blue-700 transition-colors">
              Exportar tabla
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default InventarioDashboard;