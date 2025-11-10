import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { dirname } from '@tauri-apps/api/path';
import { useState } from 'react';
import type { Database } from "../../pages/types";
import { useNavigate } from "react-router-dom";

interface DatabaseTableProps {
  databases: Database[];
  onRefresh: () => void;
}

const DatabaseTable = ({ databases, onRefresh }: DatabaseTableProps) => {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);

  if (databases.length === 0) {
    return (
      <div className="mt-4 sm:mt-6 md:mt-8 p-3 sm:p-4 text-center text-slate-400 bg-slate-800/50 rounded-lg border border-slate-700/30">
        No hay bases de datos disponibles.
      </div>
    );
  }

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

  return (
    <>
      <div className="overflow-x-auto border border-slate-600/30 shadow-sm rounded-lg bg-slate-800/30">
        <div className="min-w-[500px] sm:min-w-0">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-200">Nombre</th>
                <th className="hidden xs:table-cell px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-200">Última Modificación</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-200">Tamaño</th>
                <th className="hidden lg:table-cell px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-200">Ruta</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-200">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {databases.map((db, index) => (
                <tr key={index} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm font-medium text-white bg-slate-900/20">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="truncate max-w-[200px] sm:max-w-none">{db.name}</span>
                      <span className="xs:hidden text-xs text-slate-400 sm:hidden">{db.last_mod}</span>
                    </div>
                  </td>

                  <td className="hidden xs:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm text-slate-300 bg-slate-900/20 whitespace-nowrap">
                    {db.last_mod}
                  </td>

                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm text-slate-300 bg-slate-900/20">
                    {db.size}
                  </td>

                  <td className="hidden lg:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm text-slate-300 bg-slate-900/20">
                    <button
                      onClick={async () => {
                        try {
                          const dir = await dirname(db.path);
                          await invoke('open_directory', { path: dir });
                        } catch (error) {
                          console.error('Error al abrir el directorio:', error);
                          alert('Error al abrir el directorio: ' + error);
                        }
                      }}
                      className="px-2 py-1 text-xs bg-slate-600/50 text-slate-300 rounded hover:bg-slate-600 hover:text-white transition-colors border border-slate-500/30"
                      title={db.path}
                    >
                      Abrir
                    </button>
                  </td>

                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm text-white bg-slate-900/20">
                    <div className="flex flex-col xs:flex-row gap-1 xs:gap-2 items-center justify-center">
                      <button
                        className="w-16 px-2 py-1 text-xs bg-blue-600/80 text-white rounded hover:bg-blue-600 transition-colors font-medium text-center"
                        onClick={() => navigate('/hub_tablas', { state: { dbName: db.name } })}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleExport(db.name)}
                        className="w-16 px-2 py-1 text-xs bg-green-600/80 text-white rounded hover:bg-green-600 transition-colors font-medium text-center"
                      >
                        Exportar
                      </button>
                      <button
                        onClick={() => handleDelete(db.name)}
                        className="w-16 px-2 py-1 text-xs bg-red-600/80 text-white rounded hover:bg-red-600 transition-colors font-medium text-center"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 p-4 sm:p-6 rounded-lg border border-slate-600/50 shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-white text-lg sm:text-xl mb-4 font-semibold">Confirmar eliminación</h3>
            <p className="text-slate-300 mb-6 text-sm sm:text-base">¿Estás seguro de eliminar "{deleteCandidate}"?</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-end">
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium order-2 sm:order-1"
              >
                Eliminar
              </button>
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition-colors font-medium order-1 sm:order-2"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DatabaseTable;
