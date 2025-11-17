import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/tauri';
import "../../styles/tabla.css";

// =========================================
// Tipos
// =========================================

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
    } finally {
      setLoading(false);
    }
  }, [dbName, tableName]);

  // =========================================
  // Filtrado
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

  // =========================================
  // Obtener PK
  // =========================================
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
  // Obtener columna ID
  // =========================================
  const getIdColumn = useCallback(() => {
    if (!tableData?.columns) return null;
    const candidates = ["No", "no", "No.", "id", "ID", "rowid"];
    for (const c of candidates) {
      if (tableData.columns.includes(c)) return c;
    }
    return tableData.columns[0];
  }, [tableData?.columns]);

  // =========================================
  // Eventos
  // =========================================

  const handleRowClick = useCallback((e: React.MouseEvent, index: number) => {
    const tag = (e.target as HTMLElement).tagName;
    if (["INPUT", "BUTTON", "TEXTAREA"].includes(tag)) return;
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
    if (!pk) return alert("Error: PK no encontrada.");

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
      } else {
        alert("No se pudo guardar.");
      }
    } catch (e) {
      alert(`Error: ${e}`);
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
        setIsModalOpen(false);
        onRowSelect(-1);
      }
    } catch (e) {
      alert(`Error: ${e}`);
    }
  }, [selectedRowId, onDeleteRow, getRowPK, fetchTableData, onRowSelect]);


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

          {/* Toolbar */}
          <div className="tabla-safe-toolbar">
            <h2 className="tabla-safe-title">{tableData.table_name}</h2>

            <div className="tabla-safe-actions">
              {editingRowId === null ? (
                <>
                  <button
                    className="tabla-safe-btn tabla-safe-btn-delete"
                    disabled={selectedRowId === null || selectedRowId < 0}
                    onClick={() => { setShowDeleteModal(true); setIsModalOpen(true); }}
                  >
                    🗑️ Eliminar
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
                    ✏️ Editar
                  </button>

                  <button
                    className="tabla-safe-btn tabla-safe-btn-create"
                    onClick={() => navigate('/create-record', { state: { dbName, tableName } })}
                  >
                    ➕ Nuevo
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

          {/* Tabla */}
          <div className="tabla-safe-viewport">
            <table className="tabla-safe-grid">
              <thead>
                <tr>
                  {tableData.columns.map(col => (
                    <th key={col} className="tabla-safe-th">{col}</th>
                  ))}
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
                                onChange={(e) =>
                                  setEditData({ ...editData, [col]: e.target.value })
                                }
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


      {/* ========================= MODAL ELIMINAR ========================= */}
      {showDeleteModal && (
        <div className="tabla-safe-overlay">
          <div className="tabla-safe-modal tabla-safe-modal-delete">
            <div className="tabla-safe-modal-header">
              <h3>Confirmar Eliminación</h3>
            </div>

            <div className="tabla-safe-modal-body">
              <p>¿Eliminar este registro permanentemente?</p>
            </div>

            <div className="tabla-safe-modal-footer">
              <button
                className="tabla-safe-btn tabla-safe-btn-cancel"
                onClick={() => { setShowDeleteModal(false); setIsModalOpen(false); }}
              >
                Cancelar
              </button>
              <button
                className="tabla-safe-btn tabla-safe-btn-delete"
                onClick={handleConfirmDelete}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
});

TablaSegura.displayName = 'TablaSegura';

export default TablaSegura;
