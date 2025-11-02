import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { save, open } from '@tauri-apps/api/dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/api/fs';

// Define las propiedades del componente.
interface ImportarExportarProps {
  dbName: string;
  tableName?: string; // Opcional para permitir selección en hub de tablas
  tableList?: { name: string }[]; // Lista de tablas para selección
  onSuccess: () => void; // Callback para refrescar la vista principal.
}

const ImportarExportar: React.FC<ImportarExportarProps> = ({ dbName, tableName, tableList, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>(tableName || '');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState<{
    jsonContent: string;
    originalTableName: string;
  } | null>(null);
  const [newTableName, setNewTableName] = useState('');

  // Muestra un mensaje de feedback y lo limpia después de unos segundos.
  const showFeedback = (message: string, duration: number = 4000) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), duration);
  };

  // Maneja la exportación de la tabla a un archivo JSON.
  const handleExport = async () => {
    const tableToExport = tableName || selectedTable;
    if (!dbName || !tableToExport) {
      showFeedback('Error: Base de datos o tabla no seleccionada.');
      return;
    }
    setIsLoading(true);
    try {
      // Llama al backend para obtener el contenido JSON de la tabla.
      const jsonContent: string = await invoke('export_table_to_json', {
        dbName,
        tableName: tableToExport,
      });

      // Abre el diálogo para guardar el archivo.
      const filePath = await save({
        defaultPath: `${tableToExport}_export.json`,
        filters: [{ name: 'JSON', extensions: ['json'] }],
      });

      if (filePath) {
        // Escribe el contenido JSON al archivo seleccionado.
        await writeTextFile(filePath, jsonContent);
        showFeedback(`Tabla '${tableToExport}' exportada exitosamente.`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      showFeedback(`Error al exportar: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Maneja la importación desde un archivo JSON.
  const handleImport = async () => {
    if (!dbName) {
      showFeedback('Error: No se ha seleccionado una base de datos de destino.');
      return;
    }
    setIsLoading(true);
    try {
      // Abre el diálogo para seleccionar un archivo JSON.
      const selectedPath = await open({
        multiple: false,
        filters: [{ name: 'JSON', extensions: ['json'] }],
      });

      if (typeof selectedPath === 'string') {
        // Lee el contenido del archivo seleccionado.
        const jsonContent = await readTextFile(selectedPath);

        // Intenta importar primero sin opciones
        try {
          await invoke('import_table_from_json', {
            dbName,
            jsonContent,
          });
          showFeedback('Tabla importada exitosamente. Refrescando datos...');
          onSuccess(); // Llama al callback para actualizar la UI.
        } catch (importError) {
          const errorMessage = importError instanceof Error ? importError.message : String(importError);

          // Si el error indica que la tabla ya existe, muestra el diálogo personalizado
          if (errorMessage.includes('ya existe')) {
            // Extrae el nombre de la tabla del error
            const tableNameMatch = errorMessage.match(/'([^']+)'/);
            const originalTableName = tableNameMatch ? tableNameMatch[1] : 'la tabla';

            setImportData({ jsonContent, originalTableName });
            setNewTableName('');
            setShowImportDialog(true);
          } else {
            // Otro tipo de error
            showFeedback(`Error al importar: ${errorMessage}`);
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      showFeedback(`Error al importar: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Maneja la confirmación del diálogo de importación
  const handleImportConfirm = async (action: 'overwrite' | 'rename' | 'cancel') => {
    if (!importData) return;

    setShowImportDialog(false);
    setIsLoading(true);

    try {
      if (action === 'overwrite') {
        await invoke('import_table_from_json_with_options', {
          dbName,
          jsonContent: importData.jsonContent,
          forceReplace: true,
          newTableName: null,
        });
        showFeedback('Tabla reemplazada exitosamente. Refrescando datos...');
        onSuccess();
      } else if (action === 'rename' && newTableName.trim()) {
        await invoke('import_table_from_json_with_options', {
          dbName,
          jsonContent: importData.jsonContent,
          forceReplace: false,
          newTableName: newTableName.trim(),
        });
        showFeedback(`Tabla importada con nombre '${newTableName.trim()}' exitosamente. Refrescando datos...`);
        onSuccess();
      } else if (action === 'cancel') {
        showFeedback('Importación cancelada.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      showFeedback(`Error al procesar la importación: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setImportData(null);
    }
  };

  return (
    <>
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 my-6">
        <h3 className="text-lg font-semibold text-white mb-3">Gestión de Datos</h3>
        {!tableName && tableList && tableList.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Seleccionar Tabla para Exportar:
            </label>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleccionar tabla...</option>
              {tableList.map((table) => (
                <option key={table.name} value={table.name}>
                  {table.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleExport}
            disabled={isLoading || (!tableName && !selectedTable)}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
          >
            {isLoading ? 'Exportando...' : 'Exportar Tabla a JSON'}
          </button>
          <button
            onClick={handleImport}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-medium"
          >
            {isLoading ? 'Importando...' : 'Importar Tabla desde JSON'}
          </button>
        </div>
        {feedback && (
          <p className="text-center text-sm text-gray-300 mt-3">{feedback}</p>
        )}
      </div>

      {/* Modal de diálogo para opciones de importación */}
      {showImportDialog && importData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Tabla ya existe</h3>
            <p className="text-gray-300 mb-4">
              La tabla '{importData.originalTableName}' ya existe en la base de datos '{dbName}'.
              ¿Qué desea hacer?
            </p>

            <div className="space-y-4">
              {/* Opción de renombrar */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Renombrar tabla:
                </label>
                <input
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="Nuevo nombre para la tabla"
                  className="block w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex space-x-3">
                <button
                  onClick={() => handleImportConfirm('rename')}
                  disabled={!newTableName.trim() || isLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                >
                  Renombrar
                </button>
                <button
                  onClick={() => handleImportConfirm('overwrite')}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
                >
                  Reemplazar
                </button>
                <button
                  onClick={() => handleImportConfirm('cancel')}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImportarExportar;