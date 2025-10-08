import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { useState } from 'react';
import type { Database } from "../../pages/types"; // ruta relativa desde components/ui/DatabaseTable.tsx
//importar ruter
import { useNavigate } from "react-router-dom";

interface DatabaseTableProps {
  databases: Database[]; // lista de bases de datos
  onRefresh: () => void;// función para refrescar la lista de bases de datos
}


// Componente para mostrar la tabla de bases de datos
const DatabaseTable = ({ databases, onRefresh }: DatabaseTableProps) => {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);
  if (databases.length === 0) {
    return (
      <div className="mt-6 md:mt-8 p-4 text-center text-gray-400 bg-gray-700 rounded-lg border border-gray-600">
        No hay bases de datos disponibles.
      </div>
    );
  }
// función para exportar base de datos
  const handleExport = async (name: string) => {
    try {
      const targetPath = await open({
        title: 'Guardar exportación',
        directory: false,
        multiple: false,
        defaultPath: `${name}.db`,
      });
      if (targetPath) {
        await invoke('export_database', { name, targetPath });
        alert('Base de datos exportada con éxito');
      }
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar la base de datos');
    }
  };

  // función para eliminar base de datos
  const handleDelete = (name: string) => {
    setDeleteCandidate(name);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (deleteCandidate) {
      try {
        await invoke('delete_database', { name: deleteCandidate, confirmed: true });
        onRefresh();
        alert('Base de datos eliminada con éxito');
      } catch (error) {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar la base de datos');
      }
    }
    setShowDeleteDialog(false);
    setDeleteCandidate(null);
  };

  // Renderizar la tabla de bases de datos
  return (
    <>
    <div className="mt-6 md:mt-8 overflow-x-auto border shadow-sm rounded-lg border-gray-600 bg-gray-700">
      <table className="w-full min-w-[640px]">
        <thead className="bg-gray-900">
          <tr>
            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white">Nombre</th>
            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white">Estado</th>
            <th className="hidden sm:table-cell px-4 md:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white">Última Modificación</th>
            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white">Tamaño</th>
            <th className="hidden lg:table-cell px-4 md:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white">Ruta</th>
            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-600">
          {databases.map((db, index) => (
            <tr key={index}>
              <td className="whitespace-nowrap px-4 md:px-6 py-4 text-sm font-medium text-white bg-gray-800">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span>{db.name}</span>
                  <span className="sm:hidden text-xs mt-1 text-gray-400">{db.last_mod}</span>
                </div>
              </td>

              {/* Badge para status */}
              <td className="px-4 md:px-6 py-4 text-sm bg-gray-800">
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  db.status === "active" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                }`}>
                  {db.status}
                </span>
              </td>

              <td className="hidden sm:table-cell whitespace-nowrap px-4 md:px-6 py-4 text-sm text-white bg-gray-800">{db.last_mod}</td>
              <td className="whitespace-nowrap px-4 md:px-6 py-4 text-sm text-white bg-gray-800">{db.size}</td>
              <td className="hidden lg:table-cell whitespace-nowrap px-4 md:px-6 py-4 text-sm text-white bg-gray-800">{db.path}</td>
              <td className="whitespace-nowrap px-4 md:px-6 py-4 text-sm text-white bg-gray-800">
                <div className="flex space-x-2">
                  <button className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => navigate('/hub_tablas')}>Editar</button>
                  <button onClick={() => handleExport(db.name)} className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">Exportar</button>
                  <button onClick={() => handleDelete(db.name)} className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700">Eliminar</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {showDeleteDialog && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
          <h3 className="text-white text-lg mb-4">Confirmar eliminación</h3>
          <p className="text-gray-300 mb-6">¿Estás seguro de eliminar "{deleteCandidate}"?</p>
          <div className="flex space-x-4">
            <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Eliminar</button>
            <button onClick={() => setShowDeleteDialog(false)} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Cancelar</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default DatabaseTable;
