import React, { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { save, open } from '@tauri-apps/api/dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/api/fs';
import "../../styles/ImportarExportar.css";

interface ImportarExportarProps {
  dbName: string;
  tableName?: string;
  tableList?: { name: string }[];
  onSuccess: () => void;
}

const ImportarExportar: React.FC<ImportarExportarProps> = ({
  dbName,
  tableName,
  tableList,
  onSuccess
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>(tableName || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState<{ jsonContent: string; originalTableName: string } | null>(null);
  const [newTableName, setNewTableName] = useState('');

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const showFeedback = (message: string, duration: number = 4000) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), duration);
  };

  const handleExport = async () => {
    const tableToExport = tableName || selectedTable;
    if (!dbName || !tableToExport) {
      showFeedback('⚠️ Error: Base de datos o tabla no seleccionada.');
      return;
    }
    setIsLoading(true);
    try {
      const jsonContent: string = await invoke('export_table_to_json', { dbName, tableName: tableToExport });
      const filePath = await save({
        defaultPath: `${tableToExport}_export.json`,
        filters: [{ name: 'JSON', extensions: ['json'] }]
      });
      if (filePath) {
        await writeTextFile(filePath, jsonContent);
        showFeedback(`✅ Tabla '${tableToExport}' exportada exitosamente.`);
      }
    } catch (error) {
      showFeedback(`❌ Error al exportar: ${String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!dbName) {
      showFeedback('⚠️ Error: No se ha seleccionado una base de datos.');
      return;
    }
    setIsLoading(true);
    try {
      const selectedPath = await open({ multiple: false, filters: [{ name: 'JSON', extensions: ['json'] }] });
      if (typeof selectedPath === 'string') {
        const jsonContent = await readTextFile(selectedPath);
        try {
          await invoke('import_table_from_json', { dbName, jsonContent });
          showFeedback('✅ Tabla importada exitosamente.');
          onSuccess();
        } catch (importError) {
          const msg = importError instanceof Error ? importError.message : String(importError);
          if (msg.includes('ya existe')) {
            const tableNameMatch = msg.match(/'([^']+)'/);
            const originalTableName = tableNameMatch ? tableNameMatch[1] : 'la tabla';
            setImportData({ jsonContent, originalTableName });
            setNewTableName('');
            setShowImportDialog(true);
          } else {
            showFeedback(`❌ Error al importar: ${msg}`);
          }
        }
      }
    } catch (error) {
      showFeedback(`❌ Error al importar: ${String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

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
          newTableName: null
        });
        showFeedback('✅ Tabla reemplazada exitosamente.');
        onSuccess();
      } else if (action === 'rename' && newTableName.trim()) {
        await invoke('import_table_from_json_with_options', {
          dbName,
          jsonContent: importData.jsonContent,
          forceReplace: false,
          newTableName: newTableName.trim()
        });
        showFeedback(`✅ Tabla importada como '${newTableName.trim()}'.`);
        onSuccess();
      } else if (action === 'cancel') {
        showFeedback('⚙️ Importación cancelada.');
      }
    } catch (error) {
      showFeedback(`❌ Error: ${String(error)}`);
    } finally {
      setIsLoading(false);
      setImportData(null);
    }
  };

  useEffect(() => {
    function handleOutsideClick(e: Event) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowDropdown(false);
    }
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <>
      <div className="impexp-container">
        <h3 className="impexp-title">📂 Gestión de Datos</h3>

        {!tableName && tableList && tableList.length > 0 && (
          <div className="impexp-select-wrapper">
            <label className="impexp-label">Seleccionar Tabla:</label>
            <div className="impexp-select-box" ref={dropdownRef}>
              <div className="impexp-selected" onClick={() => setShowDropdown(prev => !prev)}>
                {selectedTable || 'Seleccionar tabla...'}
                <span className={`impexp-arrow ${showDropdown ? 'impexp-arrow-rotated' : ''}`} />
              </div>
              <div className={`impexp-options-container ${showDropdown ? 'impexp-options-active' : ''}`}>
                {tableList.map((table) => (
                  <div
                    key={table.name}
                    className="impexp-option"
                    onClick={() => {
                      setSelectedTable(table.name);
                      setShowDropdown(false);
                    }}
                  >
                    {table.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="impexp-buttons-group">
          <button
            onClick={handleExport}
            disabled={isLoading || (!tableName && !selectedTable)}
            className="impexp-button impexp-btn-export"
          >
            {isLoading ? 'Exportando...' : '⬇ Exportar a JSON'}
          </button>

          <button
            onClick={handleImport}
            disabled={isLoading}
            className="impexp-button impexp-btn-import"
          >
            {isLoading ? 'Importando...' : '⬆ Importar desde JSON'}
          </button>
        </div>

        {feedback && <p className="impexp-feedback">{feedback}</p>}
      </div>

      {/* ⚠️ Modal para renombrar o reemplazar */}
      {showImportDialog && importData && (
        <div className="impexp-modal-overlay">
          <div className="impexp-modal-content">
            <h3 className="impexp-modal-title">⚠ Tabla existente</h3>
            <p className="impexp-modal-text">
              La tabla <span className="impexp-modal-table-name">'{importData.originalTableName}'</span> ya existe en{' '}
              <span className="impexp-modal-db-name">'{dbName}'</span>.
            </p>

            <div className="impexp-input-wrapper">
              <label className="impexp-label">Renombrar tabla:</label>
              <input
                type="text"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                placeholder="Nuevo nombre..."
                className="impexp-input"
              />
            </div>

            <div className="impexp-modal-buttons">
              <button
                onClick={() => handleImportConfirm('rename')}
                disabled={!newTableName.trim() || isLoading}
                className="impexp-modal-btn impexp-modal-btn-rename"
              >
                ✏️ Renombrar
              </button>
              <button
                onClick={() => handleImportConfirm('overwrite')}
                disabled={isLoading}
                className="impexp-modal-btn impexp-modal-btn-overwrite"
              >
                🔄 Reemplazar
              </button>
              <button
                onClick={() => handleImportConfirm('cancel')}
                disabled={isLoading}
                className="impexp-modal-btn impexp-modal-btn-cancel"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImportarExportar;