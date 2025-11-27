import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/tauri';
import "../../styles/tabla.css";

interface ColumnInfo {
  name: string;
  type_: string;
  notnull: number;
}

// =========================================
// Tipos
// =========================================

interface TableData {
  table_name: string;
  columns: string[];
  rows: Record<string, any>[];
}

// =========================================
// Componente
// =========================================

const CreateRecordPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { dbName, tableName } = location.state as { dbName: string; tableName: string };

  // Estados
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newRecordData, setNewRecordData] = useState<Record<string, any>>({});
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
        Object.keys(r).forEach(k => x[k] = r[k] === null ? "" : r[k]);
        return x;
      });

      setTableData({ ...response, rows: sanitizedRows });

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

      // Inicializar datos del nuevo registro
      initializeNewRecordData({ ...response, rows: sanitizedRows }, types);
    } catch (e) {
      setError("No se pudieron cargar los datos.");
    } finally {
      setLoading(false);
    }
  }, [dbName, tableName]);

  // =========================================
  // Inicializar datos del nuevo registro
  // =========================================
  const initializeNewRecordData = useCallback((data: TableData, columnTypes: Record<string, string>) => {
    const defaults: Record<string, any> = {};

    // Generar ID autoincremental
    const idColumn = getIdColumn(data.columns);
    if (idColumn) {
      const maxId = data.rows.length > 0
        ? Math.max(...data.rows.map(row => {
            const val = row[idColumn];
            return typeof val === 'number' ? val : parseInt(String(val)) || 0;
          }))
        : 0;
      defaults[idColumn] = maxId + 1;
    }

    data.columns.forEach(col => {
      const lower = col.toLowerCase();
      if (lower === "zona") defaults[col] = "Centro/Noroeste";
      else if (lower === "campus") defaults[col] = "Florido";
      else if (columnTypes[col] === 'DATETIME') defaults[col] = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      else if (!defaults[col]) defaults[col] = "";
    });

    setNewRecordData(defaults);
  }, [columnTypes]);

  // =========================================
  // Obtener columna ID
  // =========================================
  const getIdColumn = useCallback((columns: string[]) => {
    const candidates = ["No", "no", "No.", "id", "ID", "rowid"];
    for (const c of candidates) {
      if (columns.includes(c)) return c;
    }
    return columns[0];
  }, []);

  // =========================================
  // Verificar si es columna de imagen
  // =========================================
  const isImageColumn = useCallback((columnName: string) => {
    return columnTypes[columnName] === "BLOB";
  }, [columnTypes]);

  // =========================================
  // Eventos
  // =========================================

  const handleSubmitNewRecord = useCallback(async () => {
    if (!tableData) return;

    const payload = { ...newRecordData };

    Object.keys(payload).forEach(k => {
      if (payload[k] === "") {
        if (columnNotNull[k] === 0) { // allows null
          payload[k] = null;
        } // else keep as "" for NOT NULL, let backend handle
      }
      // For image columns, extract base64 data from data URL
      if (isImageColumn(k) && typeof payload[k] === 'string' && payload[k].startsWith('data:image/')) {
        const base64Data = payload[k].split(',')[1]; // Remove "data:image/png;base64," prefix
        payload[k] = base64Data;
      }
    });

    const idColumn = getIdColumn(tableData.columns);
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
      // Navegar de vuelta después de crear
      navigate(-1);
    } catch (e) {
      alert(`Error: ${e}`);
    }
  }, [tableData, newRecordData, getIdColumn, dbName, tableName, navigate, isImageColumn]);

  const handleCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // =========================================
  // Render
  // =========================================

  if (loading) return <div className="tabla-safe-message">Cargando...</div>;
  if (error) return <div className="tabla-safe-message tabla-safe-message-error">{error}</div>;
  if (!tableData) return <div className="tabla-safe-message">Sin datos.</div>;

  return (
    <div className="create-record-container">
      <div className="create-record-wrapper">
        <div className="create-record-card">
          {/* Header */}
          <div className="create-record-header">
            <div className="header-content">
              <div className="icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </div>
              <div>
                <h2 className="header-title">Nuevo Registro</h2>
                <p className="header-subtitle">{tableData.table_name}</p>
              </div>
            </div>
          </div>

          {/* Form Body */}
          <div className="create-record-body">
            <div className="fields-grid">
              {tableData.columns.map(col => {
                const lower = col.toLowerCase();
                const isIdColumn = ["no", "no.", "id"].includes(lower);
                const locked = ["zona", "campus"].includes(lower) || isIdColumn || columnTypes[col] === 'DATETIME';
                const isImage = isImageColumn(col);

                return (
                  <div key={col} className="field-group">
                    <label className="field-label">
                      {col}
                      {locked && (
                        <span className="locked-badge">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z"/>
                          </svg>
                        </span>
                      )}
                    </label>
                    {isImage ? (
                      <input
                        type="file"
                        accept="image/*"
                        className={`field-input ${locked ? 'locked' : ''}`}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // Convert file to base64
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const base64 = event.target?.result as string;
                              setNewRecordData({ ...newRecordData, [col]: base64 });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        disabled={locked}
                      />
                    ) : columnTypes[col] === 'DATETIME' ? (
                      <input
                        type="datetime-local"
                        className={`field-input locked`}
                        value={newRecordData[col]?.slice(0,16) || ""}
                        disabled
                        placeholder="Campo bloqueado"
                      />
                    ) : (
                      <input
                        type="text"
                        className={`field-input ${locked ? 'locked' : ''}`}
                        value={newRecordData[col] ?? ""}
                        onChange={(e) => setNewRecordData({ ...newRecordData, [col]: e.target.value })}
                        disabled={locked}
                        placeholder={locked ? "Campo bloqueado" : `Ingrese ${col.toLowerCase()}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="create-record-footer">
            <button className="btn btn-cancel" onClick={handleCancel}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
              Cancelar
            </button>
            <button className="btn btn-create" onClick={handleSubmitNewRecord}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 13l4 4L19 7"/>
              </svg>
              Crear Registro
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .create-record-container {
           min-height: 100vh;
           max-height: 100vh;
           background: var(--bg-color);
           padding: clamp(1rem, 3vw, 2rem);
           display: flex;
           align-items: center;
           justify-content: center;
           overflow: hidden;
         }

        .create-record-wrapper {
          width: 100%;
          max-width: 900px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
        }

        .create-record-card {
           background: var(--surface-color);
           backdrop-filter: blur(15px);
           border: 1px solid var(--border-color);
           border-radius: 0.75rem;
           box-shadow: 0 4px 16px var(--shadow-color);
           overflow: hidden;
           animation: slideUp 0.4s ease-out;
           display: flex;
           flex-direction: column;
           max-height: 100%;
         }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .create-record-header {
           background: var(--surface-color);
           backdrop-filter: blur(12px);
           padding: clamp(1.5rem, 3vw, 2rem);
           border-bottom: 1px solid var(--border-color);
           flex-shrink: 0;
         }

        .header-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .icon-wrapper {
           width: 48px;
           height: 48px;
           background: var(--primary-color);
           border: 1px solid var(--border-color);
           border-radius: 12px;
           display: flex;
           align-items: center;
           justify-content: center;
           backdrop-filter: blur(10px);
           color: var(--primary-color);
         }

        .header-title {
           font-size: clamp(1.25rem, 3vw, 1.75rem);
           font-weight: 700;
           margin: 0;
           line-height: 1.2;
           color: var(--text-color);
         }

        .header-subtitle {
          font-size: clamp(0.875rem, 2vw, 1rem);
          margin: 0.25rem 0 0 0;
          color: var(--text-secondary-color);
        }

        .create-record-body {
          padding: clamp(1.5rem, 4vw, 2.5rem);
          overflow-y: auto;
          flex: 1 1 auto;
        }

        .create-record-body::-webkit-scrollbar {
          width: 8px;
        }

        .create-record-body::-webkit-scrollbar-track {
          background: var(--surface-color);
          border-radius: 4px;
        }

        .create-record-body::-webkit-scrollbar-thumb {
           background: var(--border-color);
           border-radius: 4px;
         }

         .create-record-body::-webkit-scrollbar-thumb:hover {
           background: var(--text-secondary-color);
         }

        .fields-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
          gap: clamp(1.25rem, 3vw, 1.75rem);
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .field-label {
           font-size: clamp(0.875rem, 1.5vw, 0.95rem);
           font-weight: 600;
           color: var(--text-color);
           display: flex;
           align-items: center;
           gap: 0.5rem;
         }

        .locked-badge {
          display: inline-flex;
          align-items: center;
          background: rgba(251, 191, 36, 0.15);
          color: #fbbf24;
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
          font-size: 0.75rem;
          border: 1px solid rgba(251, 191, 36, 0.3);
        }

        .field-input {
           width: 100%;
           padding: clamp(0.625rem, 2vw, 0.875rem);
           font-size: clamp(0.875rem, 1.5vw, 1rem);
           background: var(--surface-color);
           border: 1px solid var(--border-color);
           border-radius: 0.25rem;
           color: var(--text-color);
           transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
           font-family: inherit;
           backdrop-filter: blur(10px);
         }

         .field-input:focus {
           outline: none;
           background: var(--surface-color);
           border-color: var(--primary-color);
           box-shadow: 0 0 0 3px var(--primary-color);
         }

         .field-input.locked {
           background: var(--bg-color);
           color: var(--text-secondary-color);
           cursor: not-allowed;
           border-color: var(--border-color);
         }

        .field-input::placeholder {
          color: var(--text-secondary-color);
        }

        .create-record-footer {
           padding: clamp(1.25rem, 3vw, 1.75rem);
           background: var(--surface-color);
           backdrop-filter: blur(25px);
           display: flex;
           gap: clamp(0.75rem, 2vw, 1rem);
           justify-content: flex-end;
           border-top: 1px solid var(--border-color);
           flex-shrink: 0;
         }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: clamp(0.625rem, 2vw, 0.875rem) clamp(1.25rem, 3vw, 1.75rem);
          font-size: clamp(0.875rem, 1.5vw, 1rem);
          font-weight: 600;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .btn-cancel {
           background: var(--text-secondary-color);
           color: var(--text-color);
           border: 1px solid var(--border-color);
         }

         .btn-cancel:hover {
           background: var(--text-secondary-color);
           border-color: var(--border-color);
           transform: translateY(-1px);
           box-shadow: 0 4px 16px var(--shadow-color);
         }

        .btn-create {
           background: var(--primary-color);
           color: var(--text-color);
           border: 1px solid var(--border-color);
           box-shadow: 0 4px 12px var(--shadow-color);
         }

         .btn-create:hover {
           background: var(--primary-color);
           transform: translateY(-2px);
           box-shadow: 0 6px 20px var(--shadow-color);
         }

        .btn:active {
          transform: translateY(0);
        }

        @media (max-width: 640px) {
          .create-record-footer {
            flex-direction: column;
          }

          .btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default CreateRecordPage;