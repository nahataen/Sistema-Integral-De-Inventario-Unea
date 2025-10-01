import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Pagina = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("Filtro 1");
  const [selectedRecords, setSelectedRecords] = useState<number[]>([]);
  const [skuSearch, setSkuSearch] = useState("");

  const handleCheckboxChange = (id: number) => {
    setSelectedRecords(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

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

  const filteredRecords = records.filter(record =>
    record.zona.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.campus.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.departamento.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.puesto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/')} className="flex items-center text-gray-400 hover:text-gray-300 transition-colors">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </button>
            <h1 className="text-3xl font-bold text-white">Identificación y ubicación</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              <button className="w-full text-left px-4 py-2 text-gray-300 bg-gray-700 rounded-lg font-medium">
                Identificación y ubicación
              </button>
              <button className="w-full text-left px-4 py-2 text-gray-400 hover:text-gray-300 hover:bg-gray-600 rounded-lg transition-colors">
                Tabla 2
              </button>
              <button className="w-full text-left px-4 py-2 text-gray-400 hover:text-gray-300 hover:bg-gray-600 rounded-lg transition-colors">
                Tabla 3
              </button>
              <button className="w-full text-left px-4 py-2 text-gray-400 hover:text-gray-300 hover:bg-gray-600 rounded-lg transition-colors">
                Tabla 4
              </button>
            </nav>

            <button className="mt-8 w-full flex items-center justify-center px-4 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nueva Tabla
            </button>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Filter */}
            <div className="mb-6">
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar registros"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <button className="flex items-center px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Subir imagen de QR
                </button>

                <div className="flex-1">
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option>Filtro 1</option>
                    <option>Filtro 2</option>
                    <option>Filtro 3</option>
                  </select>
                </div>

                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Crear nuevo registro
                </button>
              </div>
            </div>

            {/* SKU Search Bar */}
            <div className="mb-6">
              <div className="flex items-center gap-4">
                <span className="text-white text-sm font-medium w-[5%]">SKU:</span>
                <input
                  type="text"
                  placeholder="Buscar por código de barras"
                  value={skuSearch}
                  onChange={(e) => setSkuSearch(e.target.value)}
                  className="flex-1 px-3 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Table */}
            <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-600">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Seleccionar</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Zona</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Campus</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Departamento</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Puesto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-600">
                    {filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{record.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          <input
                            type="checkbox"
                            checked={selectedRecords.includes(record.id)}
                            onChange={() => handleCheckboxChange(record.id)}
                            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{record.zona}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{record.campus}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{record.departamento}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{record.puesto}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        <div className="flex items-center justify-center h-full">
  <button
    className="p-2 rounded-full text-green-400 hover:text-green-300 transition-colors bg-transparent hover:bg-green-400/10 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
  >
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  </button>
</div>

                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                Eliminar Registro
              </button>
              <button className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors">
                Editar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pagina;
