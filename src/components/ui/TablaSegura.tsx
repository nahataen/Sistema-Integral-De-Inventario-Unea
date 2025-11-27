import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/tauri';
import toast from 'react-hot-toast';
import { LuTrash2, LuPencil, LuPlus, LuX, LuSave } from 'react-icons/lu';
import "../../styles/tabla.css";

// =========================================
// Tipos y Constantes
// =========================================

const PROTECTED_COLUMNS = ["ID", "Zona", "Campus", "No", "NO", "no", "No.", "NO.", "no."];

interface TableData {
  table_name: string;
  columns: string[];
  rows: Record<string, any>[];
}

interface ColumnInfo {
  name: string;
  type_: string;
  notnull: number;
}

interface ConsultaTablaFrontProps {
  dbName: string;
  tableName: string;
  selectedRowId: number | null;
  onRowSelect: (rowId: number) => void;
  onSaveRow?: (
    pk: { name: string; value: any },
    updatedData: Record<string, any>,
    columnTypes?: Record<string, string>,
    columnNotNull?: Record<string, number>
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
  const [dataVersion, setDataVersion] = useState(0); // Force re-renders

  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Record<string, any>>({});

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState('text');

  const [showDeleteColumnModal, setShowDeleteColumnModal] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState<string | null>(null);

  const [columnTypes, setColumnTypes] = useState<Record<string, string>>({});
  const [columnNotNull, setColumnNotNull] = useState<Record<string, number>>({});


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
        Object.keys(r).forEach(k => {
          // Preserve null values for display - convert to empty string only for text input display
          x[k] = r[k];
        });
        return x;
      });

      const newTableData = { ...response, rows: sanitizedRows };
      setTableData(newTableData);
      setDataVersion(prev => prev + 1);

      // Fetch column types
      const columnInfo: ColumnInfo[] = await invoke("get_column_info", { dbName, tableName });
      const types: Record<string, string> = {};
      const notNull: Record<string, number> = {};
      columnInfo.forEach(col => {
        types[col.name] = col.type_;
        notNull[col.name] = col.notnull;
      });
      setColumnTypes(types);
      setColumnNotNull(notNull);
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

    if (!searchTerm.trim()) {
      return tableData.rows;
    }

    const lower = searchTerm.toLowerCase();
    return tableData.rows.filter(row =>
      tableData.columns.some(col =>
        String(row[col] === null ? "" : row[col]).toLowerCase().includes(lower)
      )
    );
  }, [tableData?.rows, tableData?.columns, searchTerm, dataVersion]);

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

  const isDateTimeColumn = useCallback((columnName: string) => {
    return columnTypes[columnName]?.toUpperCase() === "DATETIME";
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

    // Validate that no required fields are empty
    const emptyFields: string[] = [];
    Object.keys(payload).forEach(k => {
      // For image columns, extract base64 data from data URL
      if (isImageColumn(k) && typeof payload[k] === 'string' && payload[k].startsWith('data:image/')) {
        const base64Data = payload[k].split(',')[1]; // Remove "data:image/png;base64," prefix
        payload[k] = base64Data;
      } else if (payload[k] === "" || payload[k] === null) {
        // Check if this is a required field (not null constraint)
        if (columnNotNull[k] === 1) {
          emptyFields.push(k);
        }
      }
    });

    // If there are empty required fields, show error and don't save
    if (emptyFields.length > 0) {
      toast.error(`No se pueden dejar valores nulos en los campos: ${emptyFields.join(', ')}`);
      return;
    }

    // Filter out null values for NOT NULL columns to prevent constraint violations
    Object.keys(payload).forEach(k => {
      if (payload[k] === null && columnNotNull[k] === 1) {
        delete payload[k];
      }
    });

    try {
      const ok = await onSaveRow(pk, payload, columnTypes, columnNotNull);

      if (ok) {
        // Add a small delay to ensure database transaction completes
        await new Promise(resolve => setTimeout(resolve, 200));
        await fetchTableData();
        setEditingRowId(null);
        toast.success("Fila guardada exitosamente.");
      } else {
        toast.error("No se pudo guardar la fila.");
      }
    } catch (e) {
      toast.error(`Error al guardar: ${e}`);
    }
  }, [editingRowId, editData, onSaveRow, getRowPK, fetchTableData, isImageColumn, columnNotNull]);

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

  // === AQUÍ ESTÁ LA VALIDACIÓN DE COLUMNA DUPLICADA ===
  const handleConfirmAddColumn = useCallback(async () => {
    const trimmedName = newColumnName.trim();

    // 1. Validar que no esté vacío
    if (!trimmedName) {
      return toast.error("El nombre de la columna no puede estar vacío.");
    }

    // 2. Validar duplicados (Case Insensitive)
    if (tableData?.columns) {
        const columnExists = tableData.columns.some(
            col => col.toLowerCase() === trimmedName.toLowerCase()
        );

        if (columnExists) {
            return toast.error(`La columna "${trimmedName}" ya existe. Por favor, usa otro nombre.`);
        }
    }

    try {
      await invoke('add_new_column', {
        dbName,
        tableName,
        columnName: trimmedName,
        columnType: newColumnType,
      });
      toast.success(`Columna "${trimmedName}" añadida exitosamente.`);
      await fetchTableData();
      setIsAddColumnModalOpen(false);
      setNewColumnName('');
      setNewColumnType('text');
    } catch (e) {
      toast.error(`Error al añadir columna: ${e}`);
    }
  }, [dbName, tableName, newColumnName, newColumnType, fetchTableData, tableData]); // Se añade tableData a las dependencias

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 className="dark-grid-title">{tableData.table_name}</h2>
              <span style={{ fontSize: '12px', color: '#666' }}>(v{dataVersion})</span>
            </div>
            <div className="dark-grid-actions">
              {editingRowId === null ? (
                <>
                  <button
                    className="dark-grid-btn dark-grid-btn-delete"
                    disabled={selectedRowId === null || selectedRowId < 0}
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <LuTrash2 size={16} />
                    Eliminar Fila
                  </button>
                  <button
                    className="dark-grid-btn dark-grid-btn-edit"
                    disabled={selectedRowId === null || selectedRowId < 0}
                    onClick={() => {
                      if (selectedRowId !== null && selectedRowId >= 0) {
                        const rowData = processedRows[selectedRowId];
                        setEditData({ ...rowData });
                        setEditingRowId(selectedRowId);
                      }
                    }}
                  >
                    <LuPencil size={16} />
                    Editar Fila
                  </button>
                  <button
                    className="dark-grid-btn dark-grid-btn-add-column"
                    onClick={() => setIsAddColumnModalOpen(true)}
                  >
                    <LuPlus size={16} />
                    Añadir Columna
                  </button>
                  <button
                    className="dark-grid-btn dark-grid-btn-create"
                    onClick={() => navigate('/create-record', { state: { dbName, tableName } })}
                  >
                    <LuPlus size={16} />
                    Nuevo Registro
                  </button>
                </>
              ) : (
                <>
                  <button className="dark-grid-btn dark-grid-btn-cancel" onClick={handleCancelEdit}>
                    <LuX size={16} />
                    Cancelar
                  </button>
                  <button className="dark-grid-btn dark-grid-btn-save" onClick={handleSaveEdit}>
                    <LuSave size={16} />
                    Guardar
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
                    const isProtected = PROTECTED_COLUMNS.some(pCol => pCol.toLowerCase() === col.toLowerCase()) && columnTypes[col] !== 'DATETIME';
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
                  // Create a stable key using primary key if available
                  const pk = getRowPK(idx);
                  const rowKey = pk ? `${pk.name}-${pk.value}` : `row-${idx}`;

                  return (
                    <tr
                      key={rowKey}
                      onClick={(e) => handleRowClick(e, idx)}
                      onDoubleClick={(e) => handleRowDoubleClick(e, idx)}
                      className={`dark-grid-tr
                        ${isSelected ? "dark-grid-tr-selected" : ""}
                        ${isEditing ? "dark-grid-tr-editing" : ""}
                      `}
                    >
                      {tableData.columns.map(col => {
                        const isAuto = ["no", "no.", "id", "fecha"].includes(col.toLowerCase());
                        const isImage = isImageColumn(col);
                        return (
                          <td key={`${idx}-${col}`} className="dark-grid-td">
                            {isEditing && !isAuto && !isDateTimeColumn(col) ? (
                              isImage ? (
                                <input
                                  key={`edit-${editingRowId}-${col}`}
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
                                  key={`edit-${editingRowId}-${col}`}
                                  className="dark-grid-input"
                                  value={editData[col] ?? ""}
                                  onChange={(e) => setEditData({ ...editData, [col]: e.target.value })}
                                />
                              )
                            ) : (
                              isImage && row[col] && typeof row[col] === 'string' && row[col] !== null && row[col].startsWith('data:image/') ? (
                                <img
                                  src={row[col]}
                                  alt={col}
                                  className="dark-grid-image-thumbnail"
                                  style={{ maxWidth: '50px', maxHeight: '50px', objectFit: 'cover' }}
                                />
                              ) : (
                                <span className="dark-grid-text">{row[col] === null ? "" : row[col]}</span>
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
              <h3><LuPlus size={20} style={{ marginRight: '0.5rem' }} /> Añadir Nueva Columna</h3>
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
                  <option value="datetime">Fecha</option>
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