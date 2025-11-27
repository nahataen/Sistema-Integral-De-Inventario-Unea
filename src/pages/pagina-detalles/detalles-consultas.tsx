import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/tauri';
import toast, { Toaster } from 'react-hot-toast';
import { generateBulkPDF } from '../../utils/pdfGenerator';
import "../../styles/tabla.css";
import styles from './detalles-consultas.module.css';

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
  const [imageModal, setImageModal] = useState<{ src: string; isOpen: boolean }>({ src: '', isOpen: false });

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
    return columnTypes[columnName]?.toUpperCase() === "BLOB";
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

  const openImageModal = (imageSrc: string) => {
    setImageModal({ src: imageSrc, isOpen: true });
  };

  const closeImageModal = () => {
    setImageModal({ src: '', isOpen: false });
  };

  const generatePDF = async () => {
    try {
      if (!recordDetails) {
        throw new Error("No hay detalles del registro");
      }
      const recordItem = {
        id: recordId,
        data: recordDetails.record
      };
      await generateBulkPDF(tableName, [recordItem], columnTypes);
      toast.success('PDF generado y descargado exitosamente');
    } catch (e) {
      toast.error('Error al generar PDF: ' + String(e));
      console.error(e);
    }
  };

  const renderFieldValue = (columnName: string, value: any) => {
    if (isImageColumn(columnName) && value) {
      let imageSrc = '';
      if (typeof value === 'string') {
        imageSrc = value.startsWith('data:image/') ? value : `data:image/png;base64,${value}`;
      } else {
        imageSrc = `data:image/png;base64,${value}`;
      }

      return (
        <div className={styles.imageContainer}>
          <img
            src={imageSrc}
            alt={columnName}
            className={styles.imagePreview}
            onClick={() => openImageModal(imageSrc)}
            style={{ cursor: 'pointer' }}
          />
          <div className={styles.imageOverlay}>
            <button
              onClick={(e) => { e.stopPropagation(); openImageModal(imageSrc); }}
              className={`${styles.imageBtn} ${styles.imageBtnView}`}
              title="Ver imagen completa"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); downloadImage(imageSrc, `${columnName}.png`); }}
              className={`${styles.imageBtn} ${styles.imageBtnDownload}`}
              title="Descargar imagen"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>
        </div>
      );
    }

    const displayValue = value;
    const isTextField = String(displayValue).length > 0;

    return (
      <div className={styles.textFieldContainer}>
        <span className={styles.fieldValue}>{String(displayValue)}</span>
        {isTextField && (
          <button
            onClick={() => copyToClipboard(String(displayValue))}
            className={styles.copyBtn}
            title="Copiar al portapapeles"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        )}
      </div>
    );
  };

  if (loading) return <div className={styles.darkGridMessage}>Cargando detalles...</div>;
  if (error) return <div className={`${styles.darkGridMessage} ${styles.darkGridMessageError}`}>{error}</div>;
  if (!recordDetails) return <div className={styles.darkGridMessage}>No se encontraron detalles.</div>;

  // === LÓGICA DE FILTRADO Y ORDENAMIENTO ===

  const imageFields = Object.entries(recordDetails.record).filter(
    ([key, value]) => isImageColumn(key) && value !== null && value !== undefined
  );

  // 1. Filtramos (quitamos nulos/imagenes)
  // 2. Ordenamos (sort) para que ID/NO. aparezcan primero
  const textFields = Object.entries(recordDetails.record)
    .filter(([key, value]) => !isImageColumn(key) && value !== null && value !== undefined)
    .sort(([keyA], [keyB]) => {
      const kA = keyA.toLowerCase();
      const kB = keyB.toLowerCase();

      // Lista de claves que queremos al principio
      const priorityKeys = ['id', 'no.', 'no', 'número', 'numero'];

      const isAPriority = priorityKeys.includes(kA);
      const isBPriority = priorityKeys.includes(kB);

      // Si A es prioridad y B no, A va primero (-1)
      if (isAPriority && !isBPriority) return -1;
      // Si B es prioridad y A no, B va primero (1)
      if (!isAPriority && isBPriority) return 1;
      // Si ambos son prioridad o ninguno lo es, mantenemos el orden original (0)
      return 0;
    });

  const hasImages = imageFields.length > 0;

  return (
    <div className={styles.detallesContainer}>
      <div className={styles.detallesWrapper}>
        <div className={styles.detallesCard}>
          <div className={styles.detallesHeader}>
            <div className={styles.headerContent}>
              <div className={styles.iconWrapper}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                </svg>
              </div>
              <div>
                <h2 className={styles.headerTitle}>Detalles del Registro</h2>
                <p className={styles.headerSubtitle}>{recordDetails.table_name}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button onClick={generatePDF} className={styles.btnPdf} aria-label="Generar PDF">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Generar PDF</span>
              </button>
              <button onClick={() => navigate(-1)} className={styles.btnVolver} aria-label="Volver">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Volver</span>
              </button>
            </div>
          </div>

          <div className={styles.detallesContent}>
            {hasImages ? (
              <div className={styles.fieldsGrid}>
                <div className={styles.leftColumn}>
                  {imageFields.map(([key, value]) => (
                    <div key={key} className={styles.fieldCard}>
                      <div className={styles.fieldHeader}>
                        <h3 className={styles.fieldTitle}>{key}</h3>
                      </div>
                      <div className={styles.fieldContent}>
                        {renderFieldValue(key, value)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.rightColumn}>
                  {textFields.map(([key, value]) => (
                    <div key={key} className={styles.fieldCard}>
                      <div className={styles.fieldHeader}>
                        <h3 className={styles.fieldTitle}>{key}</h3>
                      </div>
                      <div className={styles.fieldContent}>
                        {renderFieldValue(key, value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.singleColumnGrid}>
                 {textFields.map(([key, value]) => (
                    <div key={key} className={styles.fieldCard}>
                      <div className={styles.fieldHeader}>
                        <h3 className={styles.fieldTitle}>{key}</h3>
                      </div>
                      <div className={styles.fieldContent}>
                        {renderFieldValue(key, value)}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {imageModal.isOpen && (
        <div className={styles.imageModalOverlay} onClick={closeImageModal}>
          <button onClick={closeImageModal} className={styles.imageModalClose}>✕</button>
          <div className={styles.imageModalContent} onClick={(e) => e.stopPropagation()}>
            <img src={imageModal.src} alt="Vista completa" className={styles.imageModalImage} />
          </div>
        </div>
      )}

      <Toaster position="bottom-center" containerStyle={{ zIndex: 99999 }} />
    </div>
  );
};

export default DetallesConsultas;