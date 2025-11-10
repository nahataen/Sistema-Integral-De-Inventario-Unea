import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { invoke } from '@tauri-apps/api/tauri';
import ConsultaTablaFront from '../components/ui/consulta_tabla_front';

const Pagina = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tableName, dbName } = location.state || {};

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);

  const handleRowSelect = (rowId: number) => {
    const newSelectedId = selectedRowId === rowId ? null : rowId;
    setSelectedRowId(newSelectedId);
  };

  const handleSaveRow = async (pk: { name: string, value: any }, updatedData: Record<string, any>): Promise<boolean> => {
    try {
      if (!dbName || !tableName) throw new Error('Nombre de base de datos o tabla no especificado.');
      if (!pk || pk.name === undefined || pk.value === undefined) throw new Error('Clave primaria inválida.');

      const result = await invoke('update_table_row', {
        dbName: dbName.trim(),
        tableName: tableName.trim(),
        pkColumn: pk.name,
        pkValue: pk.value,
        updates: updatedData,
      });

      return result === true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert('Error al actualizar la fila:\n' + errorMessage);
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-gray-100">
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => navigate('/hub_tablas', { state: { dbName } })}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700/50 text-gray-300 hover:text-white hover:bg-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              aria-label="Volver a la selección de tablas"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Volver</span>
            </button>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white text-center flex-1 truncate">
              {tableName ? `Tabla: ${tableName}` : 'Sin tabla seleccionada'}
            </h1>

            <div className="w-24 sm:w-28"></div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar registros por cualquier campo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-600"
              aria-label="Buscar registros"
            />
          </div>
        </div>

        {tableName && dbName ? (
          <div className="transition-opacity duration-300">
            <ConsultaTablaFront
              dbName={dbName}
              tableName={tableName}
              selectedRowId={selectedRowId}
              onRowSelect={handleRowSelect}
              onSaveRow={handleSaveRow}
              searchTerm={searchTerm}
            />
          </div>
        ) : (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 sm:p-12 text-center transition-all duration-200 hover:border-gray-600">
            <div className="mb-6">
              <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-400 text-lg font-medium">No se especificó la base de datos o la tabla</p>
              <p className="text-gray-500 text-sm mt-2">Por favor, selecciona una tabla para continuar</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 hover:shadow-lg hover:shadow-blue-500/25"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Volver al inicio
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Pagina;