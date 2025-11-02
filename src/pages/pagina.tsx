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
      if (!dbName || !tableName) {
        throw new Error('Nombre de base de datos o tabla no especificado.');
      }
      if (!pk || pk.name === undefined || pk.value === undefined) {
        throw new Error('Clave primaria inválida.');
      }

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
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-300">
              Volver
            </button>
            <h1 className="text-3xl font-bold truncate">
              {tableName ? `Tabla: ${tableName}` : 'Sin tabla seleccionada'}
            </h1>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar registros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full p-3 border border-gray-600 rounded-lg bg-gray-700 focus:ring-blue-500"
          />
        </div>


        {tableName && dbName ? (
          <ConsultaTablaFront
            dbName={dbName}
            tableName={tableName}
            selectedRowId={selectedRowId}
            onRowSelect={handleRowSelect}
            onSaveRow={handleSaveRow}
            searchTerm={searchTerm}
          />
        ) : (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400">No se especificó la base de datos o la tabla.</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Volver al inicio
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Pagina;