import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/tauri';
import toast from 'react-hot-toast';
import "../../styles/tabla.css";

// =========================================
// Tipos y Constantes
// =========================================

const PROTECTED_COLUMNS = ["ID", "Zona", "Campus"];

interface TableData {
  table_name: string;
  columns: string[];
  rows: Record<string, any>[];
}

interface ColumnInfo {
  name: string;
  type_: string;
}

interface ConsultaTablaFrontProps {
  dbName: string;
  tableName: string;
  selectedRowId: number | null;
  onRowSelect: (rowId: number) => void;
  onSaveRow?: (
    pk: { name: string; value: any },
    updatedData: Record<string, any>,
    columnTypes?: Record<string, string>
  ) => Promise<boolean>;
  onDeleteRow?: (pk: { name: string; value: any }) => Promise<boolean>;
  searchTerm?: string;
  sortOrder?: string;
  onTableUpdate?: () => void;
}

// =========================================
// Componente
// =========================================

const TablaSegura: React.FC<ConsultaTablaFrontProps> = memo(({
  dbName,
  tableName,
  selectedRowId,
  onRowSelect,
  onSaveRow,
  onDeleteRow,
  searchTerm = "",
}) => {
  const navigate = useNavigate();

  // Estados
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Record<string, any>>({});

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState('text');

  const [showDeleteColumnModal, setShowDeleteColumnModal] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState<string | null>(null);

  const [columnTypes, setColumnTypes] = useState<Record<string, string>>({});


  // =========================================
  // Obtener datos de la tabla
  // =========================================
  useEffect(() => {
    if (dbName && tableName) fetchTableData();
  }, [dbName, tableName]);

  const fetchTableData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response: TableData = await invoke("consulta_tabla", { dbName, tableName });

      const sanitizedRows = response.rows.map(r => {
        const x: Record<string, any> = {};
        Object.keys(r).forEach(k => x[k] = r[k] === null ? "" : r[k]);
        return x;
      });

      setTableData({ ...response, rows: sanitizedRows });

      // Fetch column types
      const columnInfo: ColumnInfo[] = await invoke("get_column_info", { dbName, tableName });
      const types: Record<string, string> = {};
      columnInfo.forEach(col => {
        types[col.name] = col.type_;
      });
      setColumnTypes(types);
    } catch (e) {
      setError("No se pudieron cargar los datos.");
      toast.error("No se pudieron cargar los datos de la tabla.");
    } finally {
      setLoading(false);
    }
  }, [dbName, tableName]);

  // =========================================
  // Lógica de UI
  // =========================================
  const processedRows = useMemo(() => {
    if (!tableData) return [];
    if (!searchTerm.trim()) return tableData.rows;

    const lower = searchTerm.toLowerCase();
    return tableData.rows.filter(row =>
      tableData.columns.some(col =>
        String(row[col] ?? "").toLowerCase().includes(lower)
      )
    );
  }, [tableData?.rows, tableData?.columns, searchTerm]);

  const getRowPK = useCallback((rowIndex: number) => {
    if (!tableData || !processedRows[rowIndex]) return null;
    const row = processedRows[rowIndex];
    let pk = tableData.columns[0];
    const candidates = ["No", "no", "No.", "id", "ID", "rowid"];
    for (const c of candidates) {
      if (tableData.columns.includes(c)) { pk = c; break; }
    }
    return { name: pk, value: row[pk] };
  }, [tableData?.columns, processedRows]);

  const isImageColumn = useCallback((columnName: string) => {
    return columnTypes[columnName] === "BLOB";
  }, [columnTypes]);

  // =========================================
  // Eventos
  // =========================================

  const handleRowClick = useCallback((e: React.MouseEvent, index: number) => {
    const tag = (e.target as HTMLElement).tagName;
    if (["INPUT", "BUTTON", "TEXTAREA", "SELECT"].includes(tag)) return;
    if (index >= 0) onRowSelect(index);
  }, [onRowSelect]);

  const handleRowDoubleClick = useCallback((e: React.MouseEvent, index: number) => {
    const tag = (e.target as HTMLElement).tagName;
    if (["INPUT", "BUTTON", "TEXTAREA", "SELECT"].includes(tag)) return;

    if (index >= 0 && processedRows[index]) {
      const row = processedRows[index];
      const pk = getRowPK(index);
      if (pk) {
        navigate('/detalles-consultas', {
          state: {
            dbName,
            tableName,
            recordId: pk.value,
            idColumn: pk.name
          }
        });
      }
    }
  }, [processedRows, getRowPK, navigate, dbName, tableName]);

  const handleCancelEdit = useCallback(() => {
    setEditingRowId(null);
    setEditData({});
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (editingRowId === null || editingRowId < 0) return;
    if (!onSaveRow) return;

    const pk = getRowPK(editingRowId);
    if (!pk) return toast.error("Error: Llave primaria no encontrada para guardar.");

    const payload = { ...editData };
    delete payload[pk.name];

    Object.keys(payload).forEach(k => {
      if (payload[k] === "") payload[k] = null;
      // For image columns, extract base64 data from data URL
      if (isImageColumn(k) && typeof payload[k] === 'string' && payload[k].startsWith('data:image/')) {
        const base64Data = payload[k].split(',')[1]; // Remove "data:image/png;base64," prefix
        payload[k] = base64Data;
      }
    });

    try {
      const ok = await onSaveRow(pk, payload, columnTypes);
      if (ok) {
        await fetchTableData();
        setEditingRowId(null);
        toast.success("Fila guardada exitosamente.");
      } else {
        toast.error("No se pudo guardar la fila.");
      }
    } catch (e) {
      toast.error(`Error al guardar: ${e}`);
    }
  }, [editingRowId, editData, onSaveRow, getRowPK, fetchTableData, isImageColumn]);

  const handleConfirmDelete = useCallback(async () => {
    if (selectedRowId === null || selectedRowId < 0) return;
    if (!onDeleteRow) return;
    const pk = getRowPK(selectedRowId);
    if (!pk) return;

    try {
      const ok = await onDeleteRow(pk);
      if (ok) {
        await fetchTableData();
        setShowDeleteModal(false);
        onRowSelect(-1);
        toast.success("Registro eliminado.");
      }
    } catch (e) {
      toast.error(`Error al eliminar: ${e}`);
    }
  }, [selectedRowId, onDeleteRow, getRowPK, fetchTableData, onRowSelect]);

  const handleConfirmAddColumn = useCallback(async () => {
    if (!newColumnName.trim()) {
      return toast.error("El nombre de la columna no puede estar vacío.");
    }

    try {
      await invoke('add_new_column', {
        dbName,
        tableName,
        columnName: newColumnName,
        columnType: newColumnType,
      });
      toast.success(`Columna "${newColumnName}" añadida exitosamente.`);
      await fetchTableData();
      setIsAddColumnModalOpen(false);
      setNewColumnName('');
      setNewColumnType('text');
    } catch (e) {
      toast.error(`Error al añadir columna: ${e}`);
    }
  }, [dbName, tableName, newColumnName, newColumnType, fetchTableData]);

  const handleConfirmDeleteColumn = useCallback(async () => {
    if (!columnToDelete) return;

    try {
      await invoke('delete_column', {
        dbName,
        tableName,
        columnName: columnToDelete,
      });
      toast.success(`Columna "${columnToDelete}" eliminada.`);
      await fetchTableData();
      setShowDeleteColumnModal(false);
      setColumnToDelete(null);
    } catch (e) {
      toast.error(`Error al eliminar columna: ${e}`);
    }
  }, [dbName, tableName, columnToDelete, fetchTableData]);

  // =========================================
  // Render
  // =========================================

  if (loading) return <div className="dark-grid-message">Cargando...</div>;
  if (error) return <div className="dark-grid-message dark-grid-message-error">{error}</div>;
  if (!tableData) return <div className="dark-grid-message">Sin datos.</div>;

  return (
    <>
      <div className="dark-grid-wrapper">
        <div className="dark-grid">
          <div className="dark-grid-toolbar">
            <h2 className="dark-grid-title">{tableData.table_name}</h2>
            <div className="dark-grid-actions">
              {editingRowId === null ? (
                <>
                  <button
                    className="dark-grid-btn dark-grid-btn-delete"
                    disabled={selectedRowId === null || selectedRowId < 0}
                    onClick={() => setShowDeleteModal(true)}
                  >
                    🗑️ Eliminar Fila
                  </button>
                  <button
                    className="dark-grid-btn dark-grid-btn-edit"
                    disabled={selectedRowId === null || selectedRowId < 0}
                    onClick={() => {
                      if (selectedRowId !== null && selectedRowId >= 0) {
                        setEditData({ ...processedRows[selectedRowId] });
                        setEditingRowId(selectedRowId);
                      }
                    }}
                  >
                    ✏️ Editar Fila
                  </button>
                  <button
                    className="dark-grid-btn dark-grid-btn-add-column"
                    onClick={() => setIsAddColumnModalOpen(true)}
                  >
                    ➕ Añadir Columna
                  </button>
                  <button
                    className="dark-grid-btn dark-grid-btn-create"
                    onClick={() => navigate('/create-record', { state: { dbName, tableName } })}
                  >
                    ➕ Nuevo Registro
                  </button>
                </>
              ) : (
                <>
                  <button className="dark-grid-btn dark-grid-btn-cancel" onClick={handleCancelEdit}>
                    ❌ Cancelar
                  </button>
                  <button className="dark-grid-btn dark-grid-btn-save" onClick={handleSaveEdit}>
                    💾 Guardar
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="dark-grid-viewport">
            <table className="dark-grid-grid">
              <thead>
                <tr>
                  {tableData.columns.map(col => {
                    const isProtected = PROTECTED_COLUMNS.some(pCol => pCol.toLowerCase() === col.toLowerCase());
                    return (
                      <th key={col} className="dark-grid-th">
                        <div className="dark-grid-th-content">
                          {col}
                          {!isProtected && (
                            <button
                              className="dark-grid-th-delete"
                              title={`Eliminar columna "${col}"`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setColumnToDelete(col);
                                setShowDeleteColumnModal(true);
                              }}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {processedRows.map((row, idx) => {
                  const isSelected = selectedRowId === idx;
                  const isEditing = editingRowId === idx;
                  return (
                    <tr
                      key={idx}
                      onClick={(e) => handleRowClick(e, idx)}
                      onDoubleClick={(e) => handleRowDoubleClick(e, idx)}
                      className={`dark-grid-tr
                        ${isSelected ? "dark-grid-tr-selected" : ""}
                        ${isEditing ? "dark-grid-tr-editing" : ""}
                      `}
                    >
                      {tableData.columns.map(col => {
                        const isAuto = ["no", "no.", "id"].includes(col.toLowerCase());
                        const isImage = isImageColumn(col);
                        return (
                          <td key={`${idx}-${col}`} className="dark-grid-td">
                            {isEditing && !isAuto ? (
                              isImage ? (
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="dark-grid-input"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      // Convert file to base64
                                      const reader = new FileReader();
                                      reader.onload = (event) => {
                                        const base64 = event.target?.result as string;
                                        setEditData({ ...editData, [col]: base64 });
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              ) : (
                                <input
                                  className="dark-grid-input"
                                  value={editData[col] ?? ""}
                                  onChange={(e) => setEditData({ ...editData, [col]: e.target.value })}
                                />
                              )
                            ) : (
                              isImage && row[col] && typeof row[col] === 'string' && row[col].startsWith('data:image/') ? (
                                <img
                                  src={row[col]}
                                  alt={col}
                                  className="dark-grid-image-thumbnail"
                                  style={{ maxWidth: '50px', maxHeight: '50px', objectFit: 'cover' }}
                                />
                              ) : (
                                <span className="dark-grid-text">{row[col] ?? ""}</span>
                              )
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showDeleteModal && createPortal(
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Confirmar Eliminación de Fila</h3>
            </div>
            <div className="modal-body">
              <div className="modal-message">
                ¿Eliminar este registro permanentemente?
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="glass-button"
                onClick={handleConfirmDelete}
                style={{
                  background: 'var(--danger-color)',
                  color: 'white'
                }}
              >
                Eliminar
              </button>
              <button className="glass-button" onClick={() => setShowDeleteModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {isAddColumnModalOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>➕ Añadir Nueva Columna</h3>
            </div>
            <div className="modal-body">
              <div className="modal-form-group">
                <label className="modal-form-label">Nombre de la Columna</label>
                <input
                  type="text"
                  className="modal-form-input"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="Ej: Descripcion"
                />
              </div>
              <div className="modal-form-group">
                <label className="modal-form-label">Tipo de Columna</label>
                <select
                  className="modal-form-select"
                  value={newColumnType}
                  onChange={(e) => setNewColumnType(e.target.value)}
                >
                  <option value="text">Texto</option>
                  <option value="image">Imagen</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="glass-button"
                onClick={handleConfirmAddColumn}
                style={{
                  background: 'var(--primary-color)',
                  color: 'white'
                }}
              >
                Guardar
              </button>
              <button className="glass-button" onClick={() => setIsAddColumnModalOpen(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {showDeleteColumnModal && createPortal(
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Confirmar Eliminación de Columna</h3>
            </div>
            <div className="modal-body">
              <div className="modal-message">
                ¿Seguro que quieres eliminar la columna <strong>"{columnToDelete}"</strong>? Esta acción no se puede deshacer.
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="glass-button"
                onClick={handleConfirmDeleteColumn}
                style={{
                  background: 'var(--danger-color)',
                  color: 'white'
                }}
              >
                Eliminar
              </button>
              <button className="glass-button" onClick={() => setShowDeleteColumnModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
});

TablaSegura.displayName = 'TablaSegura';
export default TablaSegura;
