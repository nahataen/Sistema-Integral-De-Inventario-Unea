import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { invoke } from "@tauri-apps/api/tauri";
import { open, save } from "@tauri-apps/api/dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/api/fs";
import toast, { Toaster } from "react-hot-toast";
import TableCard from "../../components/ui/TableCard";
import Sidebar from "../../components/layout/Sidebar"; // 👈 Nuevo import del Sidebar
import styles from "../../styles/InventarioDashboard.module.css";

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState<{ jsonContent: string; originalTableName: string } | null>(null);
  const [newTableName, setNewTableName] = useState('');

  const loadTables = useCallback(async () => {
    try {
      const tableList: TableInfo[] = await invoke("list_tables", { dbName });
      setTableData(tableList);
    } catch {
      toast.error("Error al cargar las tablas de la base de datos.");
    } finally {
      setLoading(false);
    }
  }, [dbName]);

  useEffect(() => {
    if (dbName !== "Desconocida") loadTables();
    else setLoading(false);
  }, [dbName, refreshKey, loadTables]);

  const handleEditTable = (tableName: string) =>
    navigate("/pagina", { state: { tableName, dbName } });

  const handleDeleteTable = (tableName: string) => {
    setDeleteCandidate(tableName);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    try {
      await invoke("delete_table", {
        dbName,
        tableName: deleteCandidate,
        confirmDelete: true,
      });
      setRefreshKey((prev) => prev + 1);
      toast.success(`Tabla "${deleteCandidate}" eliminada con éxito.`);
    } catch {
      toast.error("Error al eliminar la tabla.");
    } finally {
      setShowDeleteDialog(false);
      setDeleteCandidate(null);
    }
  };

  const handleUploadImage = async (tableName: string) => {
    try {
      setUploadingImage(tableName);
      const selected = await open({
        multiple: false,
        filters: [{ name: "Imágenes", extensions: ["jpg", "jpeg", "png", "gif", "webp"] }],
      });

      if (selected && typeof selected === "string") {
        const newImagePath: string = await invoke("upload_table_image", {
          dbName,
          tableName,
          imagePath: selected,
        });
        setTableData((prev) =>
          prev.map((table) =>
            table.name === tableName ? { ...table, image_path: newImagePath } : table
          )
        );
        setRefreshKey((prev) => prev + 1);
        toast.success(`Imagen para "${tableName}" subida con éxito.`);
      }
    } catch {
      toast.error("Error al subir la imagen.");
    } finally {
      setUploadingImage(null);
    }
  };

  const handleDeleteImage = async (tableName: string) => {
    if (window.confirm(`¿Eliminar imagen de "${tableName}"?`)) {
      try {
        await invoke("delete_table_image", { dbName, tableName });
        setRefreshKey((prev) => prev + 1);
        toast.success(`Imagen de "${tableName}" eliminada con éxito.`);
      } catch {
        toast.error("Error al eliminar la imagen.");
      }
    }
  };

  const handleImportTable = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'JSON', extensions: ['json'] }]
      });
      if (selected && typeof selected === 'string') {
        const jsonContent = await readTextFile(selected);
        try {
          await invoke('import_table_from_json', { dbName, jsonContent });
          toast.success('Tabla importada exitosamente.');
          setRefreshKey((prev) => prev + 1);
        } catch (importError) {
          const msg = importError instanceof Error ? importError.message : String(importError);
          if (msg.includes('ya existe')) {
            const tableNameMatch = msg.match(/'([^']+)'/);
            const originalTableName = tableNameMatch ? tableNameMatch[1] : 'la tabla';
            setImportData({ jsonContent, originalTableName });
            setNewTableName('');
            setShowImportDialog(true);
          } else {
            toast.error(`Error al importar: ${msg}`);
          }
        }
      }
    } catch (error) {
      toast.error(`Error al importar: ${String(error)}`);
    }
  };

  const handleImportConfirm = async (action: 'overwrite' | 'rename' | 'cancel') => {
    if (!importData) return;
    setShowImportDialog(false);
    try {
      if (action === 'overwrite') {
        await invoke('import_table_from_json_with_options', {
          dbName,
          jsonContent: importData.jsonContent,
          forceReplace: true,
          newTableName: null
        });
        toast.success('Tabla reemplazada exitosamente.');
        setRefreshKey((prev) => prev + 1);
      } else if (action === 'rename' && newTableName.trim()) {
        await invoke('import_table_from_json_with_options', {
          dbName,
          jsonContent: importData.jsonContent,
          forceReplace: false,
          newTableName: newTableName.trim()
        });
        toast.success(`Tabla importada como '${newTableName.trim()}'.`);
        setRefreshKey((prev) => prev + 1);
      } else if (action === 'cancel') {
        toast.success('Importación cancelada.');
      }
    } catch (error) {
      toast.error(`Error: ${String(error)}`);
    } finally {
      setImportData(null);
    }
  };

  const handleExportTable = async (tableName: string) => {
    try {
      const jsonContent: string = await invoke('export_table_to_json', { dbName, tableName });
      const filePath = await save({
        defaultPath: `${tableName}_export.json`,
        filters: [{ name: 'JSON', extensions: ['json'] }]
      });
      if (filePath) {
        await writeTextFile(filePath, jsonContent);
        toast.success(`Tabla '${tableName}' exportada exitosamente.`);
      }
    } catch (error) {
      toast.error(`Error al exportar: ${String(error)}`);
    }
  };

  const filteredTables = tableData.filter((table) =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.dashboard}>
      {/* ✅ Sidebar externo importado */}
      <Sidebar />

      <main className={styles.main}>
        <header className={styles.header}>
          <h1>Tablas de {dbName}</h1>
          <p>Selecciona una tabla para ver y gestionar sus registros</p>
        </header>

        <div className={styles.controls}>
          <div className={styles.searchContainer}>
            <svg
              className={styles.searchIcon}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Buscar tablas por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <button
            onClick={handleImportTable}
            className={styles.importButton}
            style={{
              padding: '8px 16px',
              background: 'rgba(37, 99, 235, 0.3)',
              color: '#ffffff',
              border: '1px solid rgba(37, 99, 235, 0.4)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(37, 99, 235, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(37, 99, 235, 0.3)';
            }}
          >
            Importar Tabla
          </button>
        </div>

        <div className={styles.grid}>
          {loading ? (
            <div className={styles.loader}>
              <svg className={styles.spinner} fill="none" viewBox="0 0 24 24">
                <circle
                  className={styles.spinnerBg}
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className={styles.spinnerPath}
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p>Cargando tablas...</p>
              <span>Conectando con la base de datos</span>
            </div>
          ) : filteredTables.length === 0 ? (
            <div className={styles.emptyState}>
              <svg
                className={styles.iconLarge}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
              <h3>No se encontraron tablas</h3>
              <p>No hay tablas que coincidan con "{searchTerm}"</p>
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
                onExport={handleExportTable}
                refreshKey={refreshKey}
              />
            ))
          )}
        </div>
      </main>

      {showDeleteDialog && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Confirmar eliminación</h3>
            <p>¿Estás seguro de eliminar "{deleteCandidate}"?</p>
            <div className={styles.modalButtons}>
              <button onClick={confirmDelete} className={styles.btnDelete}>
                Eliminar
              </button>
              <button
                onClick={() => setShowDeleteDialog(false)}
                className={styles.btnCancel}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportDialog && importData && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>⚠ Tabla existente</h3>
            <p>
              La tabla <strong>'{importData.originalTableName}'</strong> ya existe en{' '}
              <strong>'{dbName}'</strong>.
            </p>

            <div style={{ margin: '1rem 0' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#f1f5f9' }}>
                Renombrar tabla:
              </label>
              <input
                type="text"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                placeholder="Nuevo nombre..."
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  background: 'rgba(15, 15, 25, 0.8)',
                  color: '#f1f5f9',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => handleImportConfirm('rename')}
                disabled={!newTableName.trim()}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(37, 99, 235, 0.3)',
                  color: '#ffffff',
                  border: '1px solid rgba(37, 99, 235, 0.4)',
                  borderRadius: '8px',
                  cursor: newTableName.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                ✏️ Renombrar
              </button>
              <button
                onClick={() => handleImportConfirm('overwrite')}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(239, 68, 68, 0.3)',
                  color: '#ffffff',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                🔄 Reemplazar
              </button>
              <button
                onClick={() => handleImportConfirm('cancel')}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(107, 114, 128, 0.3)',
                  color: '#ffffff',
                  border: '1px solid rgba(107, 114, 128, 0.4)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster position="bottom-right" />
    </div>
  );
};

export default InventarioDashboard;