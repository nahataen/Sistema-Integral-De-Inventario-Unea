import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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

      // Inicializar datos del nuevo registro
      initializeNewRecordData({ ...response, rows: sanitizedRows });
    } catch (e) {
      setError("No se pudieron cargar los datos.");
    } finally {
      setLoading(false);
    }
  }, [dbName, tableName]);

  // =========================================
  // Inicializar datos del nuevo registro
  // =========================================
  const initializeNewRecordData = useCallback((data: TableData) => {
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
      else if (!defaults[col]) defaults[col] = "";
    });

    setNewRecordData(defaults);
  }, []);

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
  // Eventos
  // =========================================

  const handleSubmitNewRecord = useCallback(async () => {
    if (!tableData) return;

    const payload = { ...newRecordData };

    Object.keys(payload).forEach(k => {
      if (payload[k] === "") payload[k] = null;
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
  }, [tableData, newRecordData, getIdColumn, dbName, tableName, navigate]);

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
                const locked = ["zona", "campus"].includes(lower) || isIdColumn;

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
                    <input
                      type="text"
                      className={`field-input ${locked ? 'locked' : ''}`}
                      value={newRecordData[col] ?? ""}
                      onChange={(e) => setNewRecordData({ ...newRecordData, [col]: e.target.value })}
                      disabled={locked}
                      placeholder={locked ? "Campo bloqueado" : `Ingrese ${col.toLowerCase()}`}
                    />
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
           background: rgba(10, 10, 15, 0.8);
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
           background: rgba(15, 15, 25, 0.6);
           backdrop-filter: blur(15px);
           border: 1px solid rgba(255, 255, 255, 0.1);
           border-radius: 0.75rem;
           box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
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
           background: rgba(20, 20, 30, 0.7);
           backdrop-filter: blur(12px);
           padding: clamp(1.5rem, 3vw, 2rem);
           border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
           background: rgba(37, 99, 235, 0.2);
           border: 1px solid rgba(37, 99, 235, 0.3);
           border-radius: 12px;
           display: flex;
           align-items: center;
           justify-content: center;
           backdrop-filter: blur(10px);
           color: #2563eb;
         }

        .header-title {
           font-size: clamp(1.25rem, 3vw, 1.75rem);
           font-weight: 700;
           margin: 0;
           line-height: 1.2;
           color: #e2e8f0;
         }

        .header-subtitle {
          font-size: clamp(0.875rem, 2vw, 1rem);
          margin: 0.25rem 0 0 0;
          color: rgba(255, 255, 255, 0.7);
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
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }

        .create-record-body::-webkit-scrollbar-thumb {
           background: rgba(255, 255, 255, 0.2);
           border-radius: 4px;
         }

         .create-record-body::-webkit-scrollbar-thumb:hover {
           background: rgba(255, 255, 255, 0.4);
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
           color: #e2e8f0;
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
           background: rgba(25, 25, 35, 0.7);
           border: 1px solid rgba(255, 255, 255, 0.1);
           border-radius: 0.25rem;
           color: #e2e8f0;
           transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
           font-family: inherit;
           backdrop-filter: blur(10px);
         }

         .field-input:focus {
           outline: none;
           background: rgba(30, 30, 40, 0.8);
           border-color: #3b82f6;
           box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
         }

         .field-input.locked {
           background: rgba(10, 10, 15, 0.3);
           color: rgba(255, 255, 255, 0.5);
           cursor: not-allowed;
           border-color: rgba(255, 255, 255, 0.05);
         }

        .field-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .create-record-footer {
           padding: clamp(1.25rem, 3vw, 1.75rem);
           background: rgba(20, 20, 30, 0.95);
           backdrop-filter: blur(25px);
           display: flex;
           gap: clamp(0.75rem, 2vw, 1rem);
           justify-content: flex-end;
           border-top: 1px solid rgba(255, 255, 255, 0.1);
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
           background: rgba(71, 85, 105, 0.3);
           color: white;
           border: 1px solid rgba(255, 255, 255, 0.1);
         }

         .btn-cancel:hover {
           background: rgba(71, 85, 105, 0.5);
           border-color: rgba(255, 255, 255, 0.2);
           transform: translateY(-1px);
           box-shadow: 0 4px 16px rgba(71, 85, 105, 0.3);
         }

        .btn-create {
           background: rgba(34, 197, 94, 0.3);
           color: white;
           border: 1px solid rgba(34, 197, 94, 0.3);
           box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
         }

         .btn-create:hover {
           background: rgba(34, 197, 94, 0.5);
           transform: translateY(-2px);
           box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
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