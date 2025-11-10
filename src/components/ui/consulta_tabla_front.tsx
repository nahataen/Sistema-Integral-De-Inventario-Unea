import React, { useState, useEffect, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { useNavigate } from 'react-router-dom';

// Define la estructura de los datos de la tabla.
interface TableData {
   table_name: string;
   columns: string[];
   rows: Record<string, any>[];
}

// Define las propiedades del componente.
interface ConsultaTablaFrontProps {
      dbName: string;
      tableName: string;
      selectedRowId: number | null;
      onRowSelect: (rowId: number) => void;
      onSaveRow?: (pk: { name: string, value: any }, updatedData: Record<string, any>) => Promise<boolean>;
      onDeleteRow?: (pk: { name: string, value: any }) => Promise<boolean>;
      searchTerm?: string;
      sortOrder?: string;
      onTableUpdate?: () => void;
      onBack?: () => void; // Nueva prop para navegación hacia atrás
}

const ConsultaTablaFront: React.FC<ConsultaTablaFrontProps> = ({
     dbName,
     tableName,
     selectedRowId,
     onRowSelect,
     onSaveRow,
     onDeleteRow,
     searchTerm = '',
     onBack,
}) => {
   const navigate = useNavigate();

   const [tableData, setTableData] = useState<TableData | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [editingRowId, setEditingRowId] = useState<number | null>(null);
   const [editData, setEditData] = useState<Record<string, any>>({});
   const [sortColumn] = useState<string>('');
   const [sortDirection] = useState<'asc' | 'desc'>('asc');
   // Note: Sorting functionality can be implemented later if needed

   // State for new record modal
    const [showNewRecordModal, setShowNewRecordModal] = useState(false);
    const [newRecordData, setNewRecordData] = useState<Record<string, any>>({});

    // State for delete confirmation modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Carga los datos de la tabla desde el backend.
  const fetchTableData = async () => {
    try {
      const data: TableData = await invoke('consulta_tabla', {
        dbName: dbName,
        tableName: tableName
      });

      // Reemplaza valores nulos con strings vacíos para la edición.
      for (let i = 0; i < data.rows.length; i++) {
        for (const key in data.rows[i]) {
          if (data.rows[i][key] === null) {
            data.rows[i][key] = '';
          }
        }
      }
      setTableData(data);
    } catch (err) {
      setError('Error al cargar los datos de la tabla');
    } finally {
      setLoading(false);
    }
  };

  // Efecto para la carga inicial de datos.
  useEffect(() => {
    if (tableName && dbName) {
      fetchTableData();
    } else {
      setLoading(false);
    }
  }, [dbName, tableName]);

  // Guarda la fila editada en la base de datos.
  const handleSaveEdit = async () => {
    if (editingRowId === null || !onSaveRow || !editData || !tableData?.columns.length) {
      alert('Error: Faltan datos necesarios para guardar.');
      return;
    }

    // Determina la columna de clave primaria (PK).
    let pkColumn = tableData.columns[0]; // Asume la primera por defecto
    let pkValue = editData[pkColumn];

    // Si la PK es "No." y está vacía, busca una alternativa
    if ((pkColumn.toLowerCase() === 'no.' || pkColumn.toLowerCase() === 'no') && (pkValue === '' || pkValue === null || pkValue === undefined)) {
      const possiblePkColumns = ['id', 'ID', 'pk', 'PK', 'rowid', 'ROWID'];
      for (const col of possiblePkColumns) {
        if (tableData.columns.includes(col) && editData[col] !== '' && editData[col] !== null && editData[col] !== undefined) {
          pkColumn = col;
          pkValue = editData[col];
          break;
        }
      }
    }

    if (pkValue === undefined) {
      alert(`Error: No se pudo encontrar el valor de la clave primaria.`);
      return;
    }

    const updates = { ...editData };
    delete updates[pkColumn]; // Excluye la PK de los datos a actualizar.

    // No permitir actualizar el campo "No." (auto-incrementable)
    delete updates['No.'];
    delete updates['no'];

    // Convierte strings vacíos a null para la base de datos.
    const cleanedUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      cleanedUpdates[key] = value === '' ? null : value;
    }

    try {
      const success = await onSaveRow({ name: pkColumn, value: pkValue }, cleanedUpdates);

      if (success) {
        await fetchTableData(); // Recarga los datos si el guardado fue exitoso.
        setEditingRowId(null);
        setEditData({});
      } else {
        alert('Error al guardar los cambios.');
      }
    } catch (error) {
      alert('Error al guardar los cambios: ' + String(error));
    }
  };

  // Cancela el modo de edición.
  const handleCancelEdit = () => {
    setEditingRowId(null);
    setEditData({});
  };

  // Abre el modal para nuevo registro.
  const handleOpenNewRecordModal = () => {
    // Inicializa el estado con valores vacíos para cada columna, pero prellena zona y campus
    const initialData: Record<string, any> = {};
    if (tableData) {
      tableData.columns.forEach(column => {
        if (column.toLowerCase() === 'zona') {
          initialData[column] = 'centro'; // Valor fijo para zona
        } else if (column.toLowerCase() === 'campus') {
          initialData[column] = 'florido'; // Valor fijo para campus
        } else if (column.toLowerCase() === 'no.' || column.toLowerCase() === 'no') {
          // No incluir la columna "No." en el formulario - será auto-incrementable
          return;
        } else {
          initialData[column] = '';
        }
      });
    }
    setNewRecordData(initialData);
    setShowNewRecordModal(true);
  };

  // Cierra el modal para nuevo registro.
  const handleCloseNewRecordModal = () => {
    setShowNewRecordModal(false);
    setNewRecordData({});
  };

  // Abre el modal de confirmación para eliminar fila.
  const handleOpenDeleteModal = () => {
    setShowDeleteModal(true);
  };

  // Cierra el modal de confirmación para eliminar fila.
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
  };

  // Confirma y ejecuta la eliminación de la fila seleccionada.
  const handleConfirmDelete = async () => {
    if (selectedRowId === null || !onDeleteRow) {
      alert('Error: No hay fila seleccionada o función de eliminación no disponible.');
      return;
    }

    const selectedRow = processedRows[selectedRowId];
    const pkColumn = tableData?.columns[0] || 'id'; // Usa 'id' como fallback si no hay columnas definidas
    let pkValue = selectedRow[pkColumn];

    // Si el valor de la PK es una cadena vacía, intenta usar el índice de la fila como ID
    if (pkValue === '' || pkValue === null || pkValue === undefined) {
      // Busca una columna que pueda ser la PK real (id, ID, pk, etc.)
      const possiblePkColumns = ['id', 'ID', 'pk', 'PK', 'rowid', 'ROWID'];
      let foundPkValue = null;

      for (const col of possiblePkColumns) {
        if (tableData?.columns.includes(col) && selectedRow[col] !== '' && selectedRow[col] !== null && selectedRow[col] !== undefined) {
          foundPkValue = selectedRow[col];
          console.log(`Usando columna alternativa ${col} con valor:`, foundPkValue);
          break;
        }
      }

      if (foundPkValue !== null) {
        pkValue = foundPkValue;
      } else {
        pkValue = selectedRowId + 1; // Último recurso: asume IDs secuenciales
        console.log('No se encontró PK alternativa, usando rowId + 1:', pkValue);
      }
    }

    console.log('Intentando eliminar fila:', { pkColumn, pkValue, selectedRow, originalPkValue: selectedRow[pkColumn] });

    // Intenta eliminar independientemente de si tiene datos registrados o no
    try {
      const success = await onDeleteRow({ name: pkColumn, value: pkValue });

      if (success) {
        await fetchTableData(); // Recarga los datos si la eliminación fue exitosa.
        setShowDeleteModal(false);
        onRowSelect(-1); // Deselecciona la fila
        alert('Fila eliminada exitosamente.');
      } else {
        alert('Error al eliminar la fila.');
      }
    } catch (error) {
      alert('Error al eliminar la fila: ' + String(error));
    }
  };

  // Maneja cambios en los inputs del nuevo registro.
  const handleNewRecordInputChange = (column: string, value: string) => {
    setNewRecordData(prev => {
      const originalValue = prev[column];
      let finalValue: any = value;

      // Intenta preservar el tipo numérico si el original era un número.
      if (typeof originalValue === 'number') {
        const parsedNumber = parseFloat(value);
        if (!isNaN(parsedNumber) && value.trim() !== '') {
          finalValue = parsedNumber;
        }
      }

      return { ...prev, [column]: finalValue };
    });
  };

  // Envía el nuevo registro al backend.
  const handleSubmitNewRecord = async () => {
    if (!tableData) return;

    // Convierte strings vacíos a null para la base de datos, pero mantiene zona y campus
    const cleanedData: Record<string, any> = {};
    for (const [key, value] of Object.entries(newRecordData)) {
      if (key.toLowerCase() === 'zona' || key.toLowerCase() === 'campus') {
        // Siempre incluye zona y campus, incluso si están vacíos (aunque no deberían estarlo)
        cleanedData[key] = value;
      } else {
        // Otros campos: vacío = null
        cleanedData[key] = value === '' ? null : value;
      }
    }

    // No incluir el campo "No." en los datos a enviar - será auto-generado por la BD
    delete cleanedData['No.'];
    delete cleanedData['no'];

    try {
      await invoke('crear_registro_con_auto_incremento', {
        dbName: dbName,
        tableName: tableName,
        data: cleanedData,
      });

      // Recarga los datos después de crear el registro.
      await fetchTableData();
      handleCloseNewRecordModal();
      alert('Registro creado exitosamente');
    } catch (error) {
      alert('Error al crear el registro: ' + String(error));
    }
  };

  // Maneja los cambios en los inputs de edición.
  const handleInputChange = (column: string, value: string) => {
    setEditData(prev => {
      const originalValue = prev[column];
      let finalValue: any = value;

      // Intenta preservar el tipo numérico si el original era un número.
      if (typeof originalValue === 'number') {
        const parsedNumber = parseFloat(value);
        if (!isNaN(parsedNumber) && value.trim() !== '') {
          finalValue = parsedNumber;
        }
      }

      return { ...prev, [column]: finalValue };
    });
  };

  // Lógica para ordenar y filtrar los datos mostrados.
  const processedRows = useMemo(() => {
    if (!tableData) return [];

    // Filtrado de datos.
    let filtered = tableData.rows.filter(row => {
      if (!searchTerm.trim()) return true;
      const searchLower = searchTerm.toLowerCase();
      return tableData.columns.some(column =>
        String(row[column] ?? '').toLowerCase().includes(searchLower)
      );
    });

    // Ordenamiento de datos.
    if (sortColumn) {
      filtered.sort((a, b) => {
        const valueA = a[sortColumn];
        const valueB = b[sortColumn];

        if (valueA === null || valueA === '') return sortDirection === 'asc' ? -1 : 1;
        if (valueB === null || valueB === '') return sortDirection === 'asc' ? 1 : -1;

        if (!isNaN(Number(valueA)) && !isNaN(Number(valueB))) {
          return sortDirection === 'asc'
            ? Number(valueA) - Number(valueB)
            : Number(valueB) - Number(valueA);
        }

        const stringA = String(valueA).toLowerCase();
        const stringB = String(valueB).toLowerCase();

        if (sortDirection === 'asc') {
          return stringA.localeCompare(stringB);
        } else {
          return stringB.localeCompare(stringA);
        }
      });
    }

    return filtered;
  }, [tableData, searchTerm, sortColumn, sortDirection]);

  if (loading) return <div className="p-8 text-center text-gray-100">Cargando datos...</div>;
  if (error) return <div className="p-8 text-center text-red-400">{error}</div>;
  if (!tableData) return <div className="p-8 text-center text-gray-400">No se encontraron datos.</div>;


  // Renderizado del componente.
  return (
    <>
      {/* Modal de confirmación para eliminar fila */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Confirmar eliminación</h3>
            <div className="modal-body">
              <p className="text-gray-300">¿Estás seguro de eliminar esta fila? Esta acción no se puede deshacer.</p>
            </div>
            <div className="modal-footer">
              <button onClick={handleConfirmDelete} className="btn-danger">
                <span aria-hidden="true">🗑️</span> Eliminar
              </button>
              <button onClick={handleCloseDeleteModal} className="btn-cancel">
                <span aria-hidden="true">✗</span> Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para nuevo registro */}
      {showNewRecordModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Crear Nuevo Registro</h3>
            <div className="modal-body">
              {tableData?.columns.map(column => {
                const isFixedField = column.toLowerCase() === 'zona' || column.toLowerCase() === 'campus';
                const isAutoIncrementField = column.toLowerCase() === 'no.' || column.toLowerCase() === 'no';

                // No mostrar el campo "No." en el formulario
                if (isAutoIncrementField) return null;

                return (
                  <div key={column} className="form-group">
                    <label className="form-label">{column}:</label>
                    <input
                      type="text"
                      value={newRecordData[column] ?? ''}
                      onChange={(e) => handleNewRecordInputChange(column, e.target.value)}
                      className="form-input"
                      placeholder={isFixedField ? 'Valor fijo' : `Ingrese ${column}`}
                      disabled={isFixedField} // Deshabilita zona y campus
                      readOnly={isFixedField} // Hace que sean solo lectura
                    />
                  </div>
                );
              })}
            </div>
            <div className="modal-footer">
              <button onClick={handleSubmitNewRecord} className="btn-save">
                <span aria-hidden="true">✓</span> Crear Registro
              </button>
              <button onClick={handleCloseNewRecordModal} className="btn-cancel">
                <span aria-hidden="true">✗</span> Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

<div className="table-container">
  <div className="table-header">
    <div className="header-content">

      <h2 className="table-title">{tableData.table_name}</h2>
    </div>
  </div>

  <div className="table-body-wrapper">
    <table className="data-table">
      <thead>
        <tr>
          {tableData.columns.map((column) => (
            <th key={column} className="data-column">
              <div className="column-title" title={column}>{column}</div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {processedRows.map((row, rowIndex) => (
          <tr
            key={rowIndex}
            className={`table-row ${selectedRowId === rowIndex ? 'selected' : ''}`}
            onClick={() => onRowSelect(rowIndex)}
          >
            {tableData.columns.map((column) => {
              const isAutoIncrementField = column.toLowerCase() === 'no.' || column.toLowerCase() === 'no';
              return (
                <td key={column} className="data-cell">
                  {editingRowId === rowIndex ? (
                    isAutoIncrementField ? (
                      // Campo de solo lectura para "No."
                      <div className="cell-content" title={String(row[column] ?? 'NULL')}>
                        {String(row[column] ?? 'NULL')}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={editData[column] ?? ''}
                        onChange={(e) => handleInputChange(column, e.target.value)}
                        className="edit-input"
                        aria-label={`Editar ${column}`}
                      />
                    )
                  ) : (
                    <div className="cell-content" title={String(row[column] ?? 'NULL')}>
                      {String(row[column] ?? 'NULL')}
                    </div>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>

<div className="table-footer">
    {editingRowId !== null ? (
      <div className="edit-controls">
        <button
          onClick={handleSaveEdit}
          className="btn-save"
          aria-label="Guardar cambios"
        >
          <span aria-hidden="true">✓</span> Guardar
        </button>
        <button
          onClick={handleCancelEdit}
          className="btn-cancel"
          aria-label="Cancelar edición"
        >
          <span aria-hidden="true">✗</span> Cancelar
        </button>
      </div>
    ) : (
      <div className="edit-controls">
           <button
          onClick={handleOpenDeleteModal}
          disabled={selectedRowId === null}
          className="delete-button"
        >
          Eliminar Fila Seleccionada
        </button>
        <button
          onClick={() => {
            if (selectedRowId !== null) {
              const selectedRow = processedRows[selectedRowId];
              setEditData({ ...selectedRow });
              setEditingRowId(selectedRowId);
            }
          }}
          disabled={selectedRowId === null}
          className="edit-button"
        >
          Editar Fila Seleccionada
        </button>

        <button
          onClick={handleOpenNewRecordModal}
          className="edit-button"
        >
          Nuevo Registro
        </button>
      </div>
    )}
  </div>
</div>

<style>{`
  :root {
    --color-bg-start: #1f2937;
    --color-bg-end: #111827;
    --color-header: #374151;
    --color-border: #4b5563;
    --color-text: #e5e7eb;
    --color-hover: rgba(37, 99, 235, 0.4);
    --color-selected: #2563eb;
    --color-success: #16a34a;
    --color-danger: #dc2626;
    --color-input-bg: #374151;
    --color-input-focus: #3b82f6;
    --shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    --spacing-xs: 0.5rem;
    --spacing-sm: 0.75rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.25rem;
    --spacing-xl: 1.5rem;
  }

  .table-container {
    width: 100%;
    max-width: 100%;
    display: flex;
    flex-direction: column;
    max-height: clamp(400px, 60vh, 900px);
    background: linear-gradient(135deg, var(--color-bg-start) 0%, var(--color-bg-end) 100%);
    border-radius: 12px;
    box-shadow: var(--shadow);
    border: 1px solid var(--color-border);
    overflow: hidden;
    position: relative;
  }

  .table-header {
    flex-shrink: 0;
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
    background-color: var(--color-header);
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .back-button {
    padding: var(--spacing-xs) var(--spacing-sm);
    background-color: var(--color-selected);
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    white-space: nowrap;
  }

  .back-button:hover {
    background-color: #1d4ed8;
    transform: translateY(-1px);
  }

  .back-button:active {
    transform: translateY(0);
  }

  .table-title {
    color: white;
    font-weight: 700;
    line-height: 1.2;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: clamp(1rem, 2vw, 1.5rem);
    flex: 1;
  }

  .table-body-wrapper {
    flex: 1;
    overflow: auto;
    min-height: 0;
    scrollbar-width: auto; /* Más grueso que 'thin' */
    scrollbar-color: var(--color-selected) var(--color-header);
  }

  /* Scrollbar más gruesa y visible para WebKit */
  .table-body-wrapper::-webkit-scrollbar {
    width: 18px; /* Más gruesa: era 10px */
    height: 18px; /* Más gruesa: era 10px */
  }

  .table-body-wrapper::-webkit-scrollbar-track {
    background: var(--color-header);
    /* Añadir borde para dar sensación de profundidad */
    border-left: 1px solid var(--color-border);
  }

  .table-body-wrapper::-webkit-scrollbar-thumb {
    background: var(--color-selected);
    border-radius: 9px; /* Aumentado proporcionalmente */
    /* Añadir borde para hacer el thumb más visible */
    border: 4px solid var(--color-header); /* Era 3px */
    /* Añadir sombra para mejor contraste */
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  }

  .table-body-wrapper::-webkit-scrollbar-thumb:hover {
    background: var(--color-input-focus);
  }

  /* Opcional: añadir botones de scroll para mejor UX */
  .table-body-wrapper::-webkit-scrollbar-button:single-button {
    display: block;
    height: 16px;
    width: 16px;
    background: var(--color-header);
    border: 1px solid var(--color-border);
  }

  .table-body-wrapper::-webkit-scrollbar-button:single-button:hover {
    background: var(--color-border);
  }

  .table-body-wrapper::-webkit-scrollbar-button:single-button:vertical:decrement {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23e5e7eb' d='M6 3L1 8h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: center;
  }

  .table-body-wrapper::-webkit-scrollbar-button:single-button:vertical:increment {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23e5e7eb' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: center;
  }

  .data-table {
    width: 100%;
    min-width: fit-content;
    border-collapse: collapse;
    border: 1px solid var(--color-border);
  }

  .data-table thead {
    position: sticky;
    top: 0;
    z-index: 2;
    background-color: var(--color-header);
  }

  .data-column {
    padding: var(--spacing-sm);
    text-align: center;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
    border: 1px solid var(--color-border);
    min-width: 120px;
  }

  .column-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 200px;
  }

  .table-row {
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .table-row:nth-child(even) {
    background-color: rgba(255, 255, 255, 0.03);
  }

  .table-row:hover {
    background-color: var(--color-hover);
  }

  .table-row.selected {
    background-color: var(--color-selected);
  }

  .data-cell {
    padding: var(--spacing-sm);
    text-align: center;
    font-size: 0.875rem;
    color: var(--color-text);
    border: 1px solid var(--color-border);
  }

  .cell-content {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 180px;
  }

  .edit-input {
    width: 100%;
    padding: 8px 12px;
    background-color: var(--color-input-bg);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    color: white;
    font-size: 0.875rem;
    box-sizing: border-box;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .edit-input:focus {
    outline: none;
    border-color: var(--color-input-focus);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  }

  .edit-input::placeholder {
    color: #9ca3af;
  }

  .table-footer {
    flex-shrink: 0;
    padding: var(--spacing-md);
    border-top: 1px solid var(--color-border);
    background-color: var(--color-header);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--spacing-sm);
  }

  .edit-button,
  .delete-button {
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: var(--color-selected);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    white-space: nowrap;
  }

  .edit-button:hover:not(:disabled),
  .delete-button:hover:not(:disabled) {
    background-color: #1d4ed8;
    transform: translateY(-1px);
  }

  .delete-button {
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: var(--color-danger);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    white-space: nowrap;
  }

  .delete-button:hover:not(:disabled) {
    background-color: #b91c1c;
    transform: translateY(-1px);
  }

  .edit-button:disabled,
  .delete-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .edit-button:active:not(:disabled),
  .delete-button:active:not(:disabled) {
    transform: translateY(0);
  }

  .edit-controls {
    display: flex;
    gap: var(--spacing-md);
    align-items: center;
  }

  .btn-save,
  .btn-cancel,
  .btn-danger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: 0.875rem;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    color: white;
    font-weight: 500;
    transition: all 0.2s ease;
    gap: var(--spacing-xs);
    white-space: nowrap;
  }

  .btn-save {
    background-color: var(--color-success);
  }

  .btn-save:hover {
    background-color: #15803d;
    transform: translateY(-1px);
  }

  .btn-danger {
    background-color: var(--color-danger);
  }

  .btn-danger:hover {
    background-color: #b91c1c;
    transform: translateY(-1px);
  }

  .btn-cancel {
    background-color: var(--color-danger);
  }

  .btn-cancel:hover {
    background-color: #b91c1c;
    transform: translateY(-1px);
  }

  .btn-save:active,
  .btn-danger:active,
  .btn-cancel:active {
    transform: translateY(0);
  }

  /* Mobile: max-width 479px */
  @media (max-width: 479px) {
    .table-container {
      border-radius: 8px;
      max-height: clamp(300px, 50vh, 600px);
    }

    .table-header {
      padding: var(--spacing-sm);
    }

    .table-title {
      font-size: 1rem;
    }

    .data-column {
      padding: var(--spacing-xs);
      font-size: 0.75rem;
      min-width: 100px;
    }

    .column-title {
      max-width: 120px;
    }

    .data-cell {
      padding: var(--spacing-xs);
      font-size: 0.75rem;
    }

    .cell-content {
      max-width: 120px;
    }

    .edit-input {
      padding: 6px 8px;
      font-size: 0.75rem;
    }

    .table-footer {
      padding: var(--spacing-sm);
      flex-direction: column;
      align-items: stretch;
      gap: var(--spacing-sm);
    }

    .edit-controls {
      flex-direction: column;
      width: 100%;
      gap: var(--spacing-sm);
    }

    .edit-button,
    .delete-button,
    .btn-save,
    .btn-cancel {
      width: 100%;
      justify-content: center;
      padding: var(--spacing-sm);
      font-size: 0.875rem;
    }

    .modal-content {
      width: 95%;
      max-width: none;
      border-radius: 8px;
    }

    .modal-title {
      font-size: 1rem;
      padding: var(--spacing-md);
    }

    .modal-body {
      padding: var(--spacing-md);
    }

    .modal-footer {
      padding: var(--spacing-md);
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .form-input {
      font-size: 0.875rem;
    }
  }

  /* Small tablet: 480px to 639px */
  @media (min-width: 480px) and (max-width: 639px) {
    .column-title {
      max-width: 200px;
    }

    .cell-content {
      max-width: 180px;
    }

    .table-footer {
      flex-direction: column;
      align-items: stretch;
    }

    .edit-controls {
      flex-direction: column;
      width: 100%;
    }

    .edit-button,
    .delete-button,
    .btn-save,
    .btn-cancel {
      width: 100%;
      justify-content: center;
    }

    .modal-content {
      width: 90%;
    }
  }

  /* Tablet: 640px to 767px */
  @media (min-width: 640px) and (max-width: 767px) {
    .table-header {
      padding: var(--spacing-lg);
    }

    .table-title {
      font-size: 1.125rem;
    }

    .data-column {
      padding: var(--spacing-md);
      font-size: 0.875rem;
      min-width: 130px;
    }

    .data-cell {
      padding: var(--spacing-md);
      font-size: 0.875rem;
    }

    .table-footer {
      padding: var(--spacing-lg);
    }

    .edit-button,
    .delete-button {
      padding: var(--spacing-sm) var(--spacing-lg);
      font-size: 0.875rem;
    }

    .btn-save,
    .btn-cancel {
      font-size: 0.875rem;
    }

    .modal-content {
      width: 85%;
    }
  }

  /* Desktop: 768px+ */
  @media (min-width: 768px) {
    .table-header {
      padding: var(--spacing-xl);
    }

    .table-title {
      font-size: 1.5rem;
    }

    .edit-button,
    .delete-button {
      padding: var(--spacing-md) var(--spacing-xl);
    }

    .modal-content {
      width: 90%;
      max-width: 600px;
    }
  }

  @media (hover: none) {
    .table-row:hover {
      background-color: transparent;
    }

    .table-row:active {
      background-color: var(--color-hover);
    }
  }

  @media print {
    .table-container {
      max-height: none;
      box-shadow: none;
    }

    .table-body-wrapper {
      overflow: visible;
    }
  }

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: linear-gradient(135deg, var(--color-bg-start) 0%, var(--color-bg-end) 100%);
    border-radius: 12px;
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow);
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .modal-title {
    color: white;
    font-weight: 700;
    font-size: 1.25rem;
    margin: 0;
    padding: var(--spacing-lg);
    border-bottom: 1px solid var(--color-border);
    background-color: var(--color-header);
  }

  .modal-body {
    padding: var(--spacing-lg);
    overflow-y: auto;
    flex: 1;
  }

  .form-group {
    margin-bottom: var(--spacing-md);
  }

  .form-label {
    display: block;
    color: var(--color-text);
    font-weight: 600;
    margin-bottom: var(--spacing-xs);
    font-size: 0.875rem;
  }

  .form-input {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: var(--color-input-bg);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    color: white;
    font-size: 0.875rem;
    box-sizing: border-box;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .form-input:focus:not(:disabled) {
    outline: none;
    border-color: var(--color-input-focus);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  }

  .form-input:disabled {
    background-color: var(--color-header);
    color: var(--color-text);
    cursor: not-allowed;
    opacity: 0.8;
  }

  .form-input::placeholder {
    color: #9ca3af;
  }

  .modal-footer {
    padding: var(--spacing-lg);
    border-top: 1px solid var(--color-border);
    background-color: var(--color-header);
    display: flex;
    gap: var(--spacing-md);
    justify-content: flex-end;
  }
`}</style>
  </>
  );
};

export default ConsultaTablaFront;