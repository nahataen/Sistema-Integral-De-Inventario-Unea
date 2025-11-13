import { useNavigate, useLocation } from "react-router-dom";
import styles from "../../styles/editar_fila.module.css";

const EditarFila = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { rowId, tableName, dbName } = location.state || {};

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerFlex}>
            <button onClick={() => navigate(-1)} className={styles.backButton}>
              <svg className={styles.backIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </button>
            <h1 className={styles.title}>
              Editando fila {rowId !== undefined ? rowId + 1 : 'N/A'}
            </h1>
            <div className={styles.spacer}></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <div className={styles.contentBox}>
          <div className={styles.centerText}>
            <h2 className={styles.subtitle}>Hola</h2>
            <p className={styles.infoText}>
              Información de fila: ID {rowId !== undefined ? rowId + 1 : 'N/A'}<br/>
              Tabla: {tableName || 'N/A'}<br/>
              Base de datos: {dbName || 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditarFila;