import React from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import toast from 'react-hot-toast';
import { useTableCreation } from '../../context';
import styles from '../../styles/InventarioDashboard.module.css';

interface CreateTableModalProps {
  dbName: string;
  onRefresh: () => void;
}

const CreateTableModal: React.FC<CreateTableModalProps> = ({ dbName, onRefresh }) => {
  const { isModalOpen, tableName, setTableName, closeModal } = useTableCreation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableName.trim()) {
      toast.error('El nombre de la tabla no puede estar vacío.');
      return;
    }

    try {
      await invoke('create_table', { dbName, tableName: tableName.trim() });
      toast.success(`Tabla "${tableName.trim()}" creada con éxito.`);
      onRefresh();
      closeModal();
    } catch (error) {
      toast.error(`Error al crear la tabla: ${String(error)}`);
    }
  };

  if (!isModalOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h3>Crear Nueva Tabla</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ margin: '1rem 0' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#f1f5f9' }}>
              Nombre de la tabla:
            </label>
            <input
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="Ingrese el nombre de la tabla..."
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                background: 'rgba(15, 15, 25, 0.8)',
                color: '#f1f5f9',
                fontSize: '14px'
              }}
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={!tableName.trim()}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(37, 99, 235, 0.3)',
                color: '#ffffff',
                border: '1px solid rgba(37, 99, 235, 0.4)',
                borderRadius: '8px',
                cursor: tableName.trim() ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Crear Tabla
            </button>
            <button
              type="button"
              onClick={closeModal}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(107, 114, 128, 0.3)',
                color: '#ffffff',
                border: '1px solid rgba(107, 114, 128, 0.4)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTableModal;