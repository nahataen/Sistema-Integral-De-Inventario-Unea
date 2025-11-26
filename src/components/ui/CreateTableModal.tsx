import React from 'react';
import { createPortal } from 'react-dom';
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

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>Crear Nueva Tabla</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="modal-form-group">
              <label className="modal-form-label">
                Nombre de la tabla:
              </label>
              <input
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="Ingrese el nombre de la tabla..."
                className="modal-form-input"
                autoFocus
              />
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="submit"
              disabled={!tableName.trim()}
              className="glass-button"
              style={{
                background: 'var(--primary-color)',
                color: 'white',
                cursor: tableName.trim() ? 'pointer' : 'not-allowed',
                opacity: tableName.trim() ? 1 : 0.6
              }}
            >
              Crear Tabla
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="glass-button"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default CreateTableModal;