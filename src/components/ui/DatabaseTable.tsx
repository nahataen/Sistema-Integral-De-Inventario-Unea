import { invoke } from '@tauri-apps/api/tauri';
import { save } from '@tauri-apps/api/dialog';
import { dirname } from '@tauri-apps/api/path';
import { useState } from 'react';
import type { Database } from "../../types";
import { useNavigate } from "react-router-dom";
import styles from "./DatabaseTable.module.css";

interface DatabaseTableProps {
  databases: Database[];
  onRefresh: () => void;
}

const DatabaseTable = ({ databases, onRefresh }: DatabaseTableProps) => {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);

  if (databases.length === 0) {
    return (
      <div className={styles.emptyState}>
        No hay bases de datos disponibles.
      </div>
    );
  }

  const handleExport = async (name: string) => {
    try {
      const targetPath = await save({
        title: 'Guardar exportación',
        defaultPath: `${name}.db`,
        filters: [{
          name: 'Base de datos',
          extensions: ['db', 'sqlite']
        }]
      });
      if (targetPath) {
        await invoke('export_database', { name, targetPath });
        alert('Base de datos exportada con éxito');
      }
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar la base de datos');
    }
  };

  const handleDelete = (name: string) => {
    setDeleteCandidate(name);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (deleteCandidate) {
      try {
        await invoke('delete_database', { name: deleteCandidate, confirmed: true });
        onRefresh();
        alert('Base de datos eliminada con éxito');
      } catch (error) {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar la base de datos');
      }
    }
    setShowDeleteDialog(false);
    setDeleteCandidate(null);
  };

  return (
    <>
      <div className={styles.tableContainer}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th className={styles.tableHeader}>Nombre</th>
                <th className={`${styles.tableHeader} ${styles.tableHeaderDate}`}>Última Modificación</th>
                <th className={styles.tableHeader}>Tamaño</th>
                <th className={`${styles.tableHeader} ${styles.tableHeaderPath}`}>Ruta</th>
                <th className={`${styles.tableHeader} ${styles.tableHeaderCenter}`}>Acciones</th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {databases.map((db, index) => (
                <tr key={index} className={styles.tableRow}>
                  <td className={styles.tableCell}>
                    <div className={styles.tableCellName}>
                      <span className={styles.name}>{db.name}</span>
                      <span className={styles.date}>{db.last_mod}</span>
                    </div>
                  </td>

                  <td className={`${styles.tableCell} ${styles.tableCellDate}`}>
                    {db.last_mod}
                  </td>

                  <td className={styles.tableCell}>
                    {db.size}
                  </td>

                  <td className={`${styles.tableCell} ${styles.tableCellPath}`}>
                    <button
                      onClick={async () => {
                        try {
                          const dir = await dirname(db.path);
                          await invoke('open_directory', { path: dir });
                        } catch (error) {
                          console.error('Error al abrir el directorio:', error);
                          alert('Error al abrir el directorio: ' + error);
                        }
                      }}
                      className={styles.openButton}
                      title={db.path}
                    >
                      Abrir
                    </button>
                  </td>

                  <td className={`${styles.tableCell} ${styles.tableCellCenter}`}>
                    <div className={styles.tableCellActions}>
                      <button
                        className={styles.editButton}
                        onClick={() => navigate('/hub_tablas', { state: { dbName: db.name } })}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleExport(db.name)}
                        className={styles.exportButton}
                      >
                        Exportar
                      </button>
                      <button
                        onClick={() => handleDelete(db.name)}
                        className={styles.deleteButton}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showDeleteDialog && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Confirmar eliminación</h3>
            <p className={styles.modalText}>¿Estás seguro de eliminar "{deleteCandidate}"?</p>
            <div className={styles.modalButtons}>
              <button
                onClick={confirmDelete}
                className={styles.confirmButton}
              >
                Eliminar
              </button>
              <button
                onClick={() => setShowDeleteDialog(false)}
                className={styles.cancelButton}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DatabaseTable;
