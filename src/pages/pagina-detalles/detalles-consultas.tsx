import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/tauri';
import toast from 'react-hot-toast';
import "../../styles/tabla.css";

interface RecordDetails {
  table_name: string;
  record: Record<string, any>;
}

interface ColumnInfo {
  name: string;
  type_: string;
}

const DetallesConsultas: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { dbName, tableName, recordId, idColumn } = location.state as {
    dbName: string;
    tableName: string;
    recordId: string;
    idColumn: string;
  };

  const [recordDetails, setRecordDetails] = useState<RecordDetails | null>(null);
  const [columnTypes, setColumnTypes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (dbName && tableName && recordId && idColumn) {
      fetchRecordDetails();
      fetchColumnTypes();
    }
  }, [dbName, tableName, recordId, idColumn]);

  const fetchRecordDetails = async () => {
    try {
      const details: RecordDetails = await invoke("get_record_details", {
        dbName,
        tableName,
        idColumn,
        recordId,
      });
      setRecordDetails(details);
    } catch (e) {
      setError("Error al cargar los detalles del registro.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchColumnTypes = async () => {
    try {
      const columnInfo: ColumnInfo[] = await invoke("get_column_info", { dbName, tableName });
      const types: Record<string, string> = {};
      columnInfo.forEach(col => {
        types[col.name] = col.type_;
      });
      setColumnTypes(types);
    } catch (e) {
      console.error("Error al cargar tipos de columna:", e);
    }
  };

  const isImageColumn = (columnName: string) => {
    return columnTypes[columnName] === "BLOB";
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copiado al portapapeles');
    } catch (err) {
      toast.error('Error al copiar');
    }
  };

  const downloadImage = (imageSrc: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTypeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'BLOB': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'TEXT': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'INTEGER': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'REAL': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };


  const renderFieldValue = (columnName: string, value: any) => {
    if (isImageColumn(columnName) && value && typeof value === 'string') {
      // For images, display as base64 image with overlay controls
      const imageSrc = value.startsWith('data:image/') ? value : `data:image/png;base64,${value}`;
      return (
        <div className="relative group">
          <div className="image-container">
            <img
              src={imageSrc}
              alt={columnName}
              className="image-preview"
            />
            <div className="image-overlay">
              <button
                onClick={() => window.open(imageSrc, '_blank')}
                className="image-btn image-btn-view"
                title="Ver imagen completa"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button
                onClick={() => downloadImage(imageSrc, `${columnName}.png`)}
                className="image-btn image-btn-download"
                title="Descargar imagen"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // For other fields, display as text with copy button
    const displayValue = value ?? "N/A";
    const isTextField = typeof displayValue === 'string' && displayValue.length > 0 && displayValue !== "N/A";

    return (
      <div className="text-field-container">
        <span className="field-value">{displayValue}</span>
        {isTextField && (
          <button
            onClick={() => copyToClipboard(displayValue)}
            className="copy-btn"
            title="Copiar al portapapeles"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        )}
      </div>
    );
  };

  if (loading) return <div className="dark-grid-message">Cargando detalles...</div>;
  if (error) return <div className="dark-grid-message dark-grid-message-error">{error}</div>;
  if (!recordDetails) return <div className="dark-grid-message">No se encontraron detalles.</div>;

  const imageFields = Object.entries(recordDetails.record).filter(([key]) => isImageColumn(key));
  const textFields = Object.entries(recordDetails.record).filter(([key]) => !isImageColumn(key));

  return (
    <div className="detalles-container">
      <div className="detalles-wrapper">
        <div className="detalles-card">
          {/* Header */}
          <div className="detalles-header">
            <div className="header-content">
              <div className="icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <div>
                <h2 className="header-title">Detalles del Registro</h2>
                <p className="header-subtitle">{recordDetails.table_name}</p>
              </div>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="btn-volver"
              aria-label="Volver"
            >
              <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="btn-text">Volver</span>
            </button>
          </div>

          {/* Content */}
          <div className="detalles-content">
            <div className="fields-grid">
              <div className="left-column">
                {imageFields.map(([key, value]) => (
                  <div key={key} className="field-card">
                    <div className="field-header">
                      <h3 className="field-title">{key}</h3>
                      <span className={`type-badge ${getTypeColor(columnTypes[key] || "Desconocido")}`}>
                        {columnTypes[key] || "Desconocido"}
                      </span>
                    </div>
                    <div className="field-content">
                      {renderFieldValue(key, value)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="right-column">
                {textFields.map(([key, value]) => (
                  <div key={key} className="field-card">
                    <div className="field-header">
                      <h3 className="field-title">{key}</h3>
                      <span className={`type-badge ${getTypeColor(columnTypes[key] || "Desconocido")}`}>
                        {columnTypes[key] || "Desconocido"}
                      </span>
                    </div>
                    <div className="field-content">
                      {renderFieldValue(key, value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .detalles-container {
          height: 100vh;
          overflow: hidden;
          background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);
          padding: clamp(1rem, 4vw, 2rem);
          display: flex;
          align-items: flex-start;
          justify-content: center;
        }

        .detalles-wrapper {
          width: 100%;
          max-width: 1200px;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .detalles-card {
          background: rgba(30, 30, 46, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .detalles-header {
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%);
          backdrop-filter: blur(15px);
          padding: clamp(2rem, 4vw, 2.5rem);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .icon-wrapper {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(147, 51, 234, 0.2) 100%);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(12px);
          color: #a78bfa;
          box-shadow: 0 8px 16px rgba(37, 99, 235, 0.15);
        }

        .header-title {
          font-size: clamp(1.5rem, 4vw, 2rem);
          font-weight: 800;
          margin: 0;
          line-height: 1.2;
          color: #f1f5f9;
          background: linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .header-subtitle {
          font-size: clamp(1rem, 2.5vw, 1.125rem);
          margin: 0.375rem 0 0 0;
          color: rgba(255, 255, 255, 0.75);
          font-weight: 500;
        }

        .btn-volver {
          display: inline-flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.75rem 1.5rem;
          background: rgba(71, 85, 105, 0.4);
          color: #e2e8f0;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: inherit;
          font-size: 0.875rem;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .btn-volver:hover {
          background: rgba(71, 85, 105, 0.6);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateX(-3px) scale(1.02);
          box-shadow: 0 8px 20px rgba(71, 85, 105, 0.3);
        }

        .detalles-content {
          padding: clamp(2rem, 5vw, 3rem);
          overflow-y: auto;
          flex: 1 1 auto;
          scroll-behavior: smooth;
        }

        .fields-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: clamp(1.5rem, 4vw, 2rem);
          overflow-x: auto;
        }

        @media (min-width: 768px) {
          .fields-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .left-column,
        .right-column {
          display: flex;
          flex-direction: column;
          gap: clamp(1.5rem, 4vw, 2rem);
        }

        .field-card {
          background: linear-gradient(135deg, rgba(45, 45, 65, 0.8) 0%, rgba(35, 35, 55, 0.8) 100%);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 1.5rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .field-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent 0%, rgba(147, 51, 234, 0.4) 50%, transparent 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .field-card:hover {
          border-color: rgba(255, 255, 255, 0.12);
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
        }

        .field-card:hover::before {
          opacity: 1;
        }

        .field-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
          gap: 0.75rem;
        }

        .field-title {
          font-size: 1rem;
          font-weight: 700;
          margin: 0;
          color: #f1f5f9;
          text-transform: capitalize;
          letter-spacing: -0.01em;
        }

        .type-badge {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.375rem 0.75rem;
          border-radius: 20px;
          border: 1px solid;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .field-content {
          min-height: 2.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .field-value {
          color: #cbd5e1;
          font-size: 0.95rem;
          font-weight: 500;
          word-break: break-word;
          flex: 1;
          line-height: 1.5;
        }

        .text-field-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
        }

        .copy-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 8px;
          color: #60a5fa;
          cursor: pointer;
          transition: all 0.2s ease;
          opacity: 0.7;
        }

        .copy-btn:hover {
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.4);
          color: #93c5fd;
          opacity: 1;
          transform: scale(1.05);
        }

        .image-container {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .image-preview {
          width: 100%;
          height: 200px;
          object-fit: contain;
          display: block;
          transition: transform 0.3s ease;
        }

        .image-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .image-container:hover .image-overlay {
          opacity: 1;
        }

        .image-container:hover .image-preview {
          transform: scale(1.05);
        }

        .image-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .image-btn:hover {
          background: rgba(255, 255, 255, 0.25);
          border-color: rgba(255, 255, 255, 0.4);
          transform: scale(1.1);
        }

        .image-btn-view:hover {
          background: rgba(37, 99, 235, 0.3);
          border-color: rgba(37, 99, 235, 0.5);
        }

        .image-btn-download:hover {
          background: rgba(34, 197, 94, 0.3);
          border-color: rgba(34, 197, 94, 0.5);
        }

        @media (max-width: 768px) {
          .detalles-header {
            flex-direction: column;
            gap: 1.5rem;
            align-items: flex-start;
            text-align: center;
          }

          .header-content {
            justify-content: center;
          }

          .fields-grid {
            gap: 1rem;
          }

          .field-card {
            padding: 1.25rem;
          }

          .field-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .type-badge {
            align-self: flex-end;
          }
        }

        @media (max-width: 480px) {
          .detalles-container {
            padding: 1rem;
          }

          .detalles-content {
            padding: 1.5rem;
          }

          .field-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .text-field-container {
            width: 100%;
          }
        }

        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
};

export default DetallesConsultas;