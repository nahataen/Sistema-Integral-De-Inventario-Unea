import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
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

interface ConsultaTablaFrontProps {
  dbName: string;
  tableName: string;
  selectedRowId: number | null;
  onRowSelect: (rowId: number) => void;
  onSaveRow?: (
    pk: { name: string; value: any },
    updatedData: Record<string, any>
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

  // =========================================
  // Eventos
  // =========================================

  const handleRowClick = useCallback((e: React.MouseEvent, index: number) => {
    const tag = (e.target as HTMLElement).tagName;
    if (["INPUT", "BUTTON", "TEXTAREA", "SELECT"].includes(tag)) return;
    if (index >= 0) onRowSelect(index);
  }, [onRowSelect]);

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
    });

    try {
      const ok = await onSaveRow(pk, payload);
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
  }, [editingRowId, editData, onSaveRow, getRowPK, fetchTableData]);

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

  if (loading) return <div className="tabla-safe-message">Cargando...</div>;
  if (error) return <div className="tabla-safe-message tabla-safe-message-error">{error}</div>;
  if (!tableData) return <div className="tabla-safe-message">Sin datos.</div>;

  return (
    <>
      <div className="tabla-safe-wrapper">
        <div className="tabla-safe">
          <div className="tabla-safe-toolbar">
            <h2 className="tabla-safe-title">{tableData.table_name}</h2>
            <div className="tabla-safe-actions">
              {editingRowId === null ? (
                <>
                  <button
                    className="tabla-safe-btn tabla-safe-btn-delete"
                    disabled={selectedRowId === null || selectedRowId < 0}
                    onClick={() => setShowDeleteModal(true)}
                  >
                    🗑️ Eliminar Fila
                  </button>
                  <button
                    className="tabla-safe-btn tabla-safe-btn-edit"
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
                    className="tabla-safe-btn tabla-safe-btn-add-column"
                    onClick={() => setIsAddColumnModalOpen(true)}
                  >
                    ➕ Añadir Columna
                  </button>
                  <button
                    className="tabla-safe-btn tabla-safe-btn-create"
                    onClick={() => navigate('/create-record', { state: { dbName, tableName } })}
                  >
                    ➕ Nuevo Registro
                  </button>
                </>
              ) : (
                <>
                  <button className="tabla-safe-btn tabla-safe-btn-cancel" onClick={handleCancelEdit}>
                    ❌ Cancelar
                  </button>
                  <button className="tabla-safe-btn tabla-safe-btn-save" onClick={handleSaveEdit}>
                    💾 Guardar
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="tabla-safe-viewport">
            <table className="tabla-safe-grid">
              <thead>
                <tr>
                  {tableData.columns.map(col => {
                    const isProtected = PROTECTED_COLUMNS.some(pCol => pCol.toLowerCase() === col.toLowerCase());
                    return (
                      <th key={col} className="tabla-safe-th">
                        {col}
                        {!isProtected && (
                          <button
                            className="tabla-safe-th-delete"
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
                      className={`tabla-safe-tr
                        ${isSelected ? "tabla-safe-tr-selected" : ""}
                        ${isEditing ? "tabla-safe-tr-editing" : ""}
                      `}
                    >
                      {tableData.columns.map(col => {
                        const isAuto = ["no", "no.", "id"].includes(col.toLowerCase());
                        return (
                          <td key={`${idx}-${col}`} className="tabla-safe-td">
                            {isEditing && !isAuto ? (
                              <input
                                className="tabla-safe-input"
                                value={editData[col] ?? ""}
                                onChange={(e) => setEditData({ ...editData, [col]: e.target.value })}
                              />
                            ) : (
                              <span className="tabla-safe-text">{row[col] ?? ""}</span>
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
      {showDeleteModal && (
        <div className="tabla-safe-overlay">
          <div className="tabla-safe-modal">
            <h3>Confirmar Eliminación de Fila</h3>
            <p>¿Eliminar este registro permanentemente?</p>
            <div className="tabla-safe-modal-footer">
              <button className="tabla-safe-btn tabla-safe-btn-cancel" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
              <button className="tabla-safe-btn tabla-safe-btn-delete" onClick={handleConfirmDelete}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
      {isAddColumnModalOpen && (
        <div className="tabla-safe-overlay">
          <div className="tabla-safe-modal">
            <h3>Añadir Nueva Columna</h3>
            <div className="tabla-safe-modal-body">
              <label>Nombre de la Columna</label>
              <input type="text" className="tabla-safe-input" value={newColumnName} onChange={(e) => setNewColumnName(e.target.value)} placeholder="Ej: Descripcion"/>
              <label>Tipo de Columna</label>
              <select className="tabla-safe-input" value={newColumnType} onChange={(e) => setNewColumnType(e.target.value)}>
                <option value="text">Texto</option>
                <option value="image">Imagen</option>
              </select>
            </div>
            <div className="tabla-safe-modal-footer">
              <button className="tabla-safe-btn tabla-safe-btn-cancel" onClick={() => setIsAddColumnModalOpen(false)}>Cancelar</button>
              <button className="tabla-safe-btn tabla-safe-btn-save" onClick={handleConfirmAddColumn}>Guardar</button>
            </div>
          </div>
        </div>
      )}
      {showDeleteColumnModal && (
        <div className="tabla-safe-overlay">
          <div className="tabla-safe-modal">
            <h3>Confirmar Eliminación de Columna</h3>
            <p>¿Seguro que quieres eliminar la columna <strong>"{columnToDelete}"</strong>? Esta acción no se puede deshacer.</p>
            <div className="tabla-safe-modal-footer">
              <button className="tabla-safe-btn tabla-safe-btn-cancel" onClick={() => setShowDeleteColumnModal(false)}>Cancelar</button>
              <button className="tabla-safe-btn tabla-safe-btn-delete" onClick={handleConfirmDeleteColumn}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

TablaSegura.displayName = 'TablaSegura';
export default TablaSegura;
