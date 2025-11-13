import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

const TablaSegura: React.FC<ConsultaTablaFrontProps> = ({
  dbName,
  tableName,
  selectedRowId,
  onRowSelect,
  onSaveRow,
  onDeleteRow,
  searchTerm = "",
}) => {

  // Estados
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Record<string, any>>({});

  const [showNewRecordModal, setShowNewRecordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newRecordData, setNewRecordData] = useState<Record<string, any>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  // =========================================
  // Evitar scroll cuando hay modal
  // =========================================
  useEffect(() => {
    document.body.style.overflow = isModalOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isModalOpen]);

  // =========================================
  // Obtener datos de la tabla
  // =========================================
  useEffect(() => {
    if (dbName && tableName) fetchTableData();
  }, [dbName, tableName]);

  const fetchTableData = async () => {
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
  };

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
  }, [tableData, searchTerm]);

  // =========================================
  // Obtener PK
  // =========================================
  const getRowPK = useCallback((rowIndex: number) => {
    if (!tableData) return null;
    if (!processedRows[rowIndex]) return null;

    const row = processedRows[rowIndex];

    let pk = tableData.columns[0];
    const candidates = ["No", "no", "No.", "id", "ID", "rowid"];
    for (const c of candidates) {
      if (tableData.columns.includes(c)) { pk = c; break; }
    }

    return { name: pk, value: row[pk] };
  }, [tableData, processedRows]);

  // =========================================
  // Obtener columna ID
  // =========================================
  const getIdColumn = useCallback(() => {
    if (!tableData) return null;
    const candidates = ["No", "no", "No.", "id", "ID", "rowid"];
    for (const c of candidates) {
      if (tableData.columns.includes(c)) return c;
    }
    return tableData.columns[0];
  }, [tableData]);

  // =========================================
  // Eventos
  // =========================================

  const handleRowClick = (e: React.MouseEvent, index: number) => {
    const tag = (e.target as HTMLElement).tagName;
    if (["INPUT", "BUTTON", "TEXTAREA"].includes(tag)) return;
    if (index >= 0) onRowSelect(index);
  };

  const handleCancelEdit = () => {
    setEditingRowId(null);
    setEditData({});
  };

  const handleSaveEdit = async () => {
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
  };

  const handleConfirmDelete = async () => {
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
  };

  const handleOpenNewRecordModal = () => {
    if (!tableData) return;

    const defaults: Record<string, any> = {};

    // Generar ID autoincremental
    const idColumn = getIdColumn();
    if (idColumn) {
      const maxId = tableData.rows.length > 0
        ? Math.max(...tableData.rows.map(row => {
            const val = row[idColumn];
            return typeof val === 'number' ? val : parseInt(String(val)) || 0;
          }))
        : 0;
      defaults[idColumn] = maxId + 1;
    }

    tableData.columns.forEach(col => {
      const lower = col.toLowerCase();
      if (lower === "zona") defaults[col] = "Centro/Noroeste";
      else if (lower === "campus") defaults[col] = "Florido";
      else if (!defaults[col]) defaults[col] = "";
    });

    setNewRecordData(defaults);
    setShowNewRecordModal(true);
    setIsModalOpen(true);
  };

  const handleSubmitNewRecord = async () => {
    if (!tableData) return;

    const payload = { ...newRecordData };

    Object.keys(payload).forEach(k => {
      if (payload[k] === "") payload[k] = null;
    });

    const idColumn = getIdColumn();
    if (!idColumn) {
      alert("Error: No se pudo determinar la columna ID");
      return;
    }

    try {
      await invoke("crear_registro_con_auto_incremento", {
        registro: {
          db_name: dbName,
          table_name: tableName,
          id_column: idColumn,
          data: payload
        }
      });
      await fetchTableData();
      setShowNewRecordModal(false);
      setIsModalOpen(false);
    } catch (e) {
      alert(`Error: ${e}`);
    }
  };

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
                    onClick={handleOpenNewRecordModal}
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

      {/* ========================= MODAL: Nuevo Registro ========================= */}
      {showNewRecordModal && (
        <div className="tabla-safe-overlay">
          <div className="tabla-safe-modal tabla-safe-modal-create">
            <div className="tabla-safe-modal-header">
              <h3>Nuevo Registro</h3>
            </div>

            <div className="tabla-safe-modal-body">
              <div className="tabla-safe-form-grid">
                {tableData.columns.map(col => {
                  const lower = col.toLowerCase();
                  const isIdColumn = ["no", "no.", "id"].includes(lower);
                  const locked = ["zona", "campus"].includes(lower) || isIdColumn;

                  return (
                    <div key={col} className="tabla-safe-field">
                      <label>{col}</label>
                      <input
                        className="tabla-safe-input"
                        value={newRecordData[col] ?? ""}
                        onChange={(e) =>
                          setNewRecordData({ ...newRecordData, [col]: e.target.value })
                        }
                        disabled={locked}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="tabla-safe-modal-footer">
              <button
                className="tabla-safe-btn tabla-safe-btn-cancel"
                onClick={() => { setShowNewRecordModal(false); setIsModalOpen(false); }}
              >
                Cancelar
              </button>
              <button
                className="tabla-safe-btn tabla-safe-btn-create"
                onClick={handleSubmitNewRecord}
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

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
};

export default TablaSegura;
