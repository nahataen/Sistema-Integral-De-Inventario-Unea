import React, { useState, useEffect, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

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
    searchTerm?: string;
    sortOrder?: string;
    onTableUpdate?: () => void;
}

const ConsultaTablaFront: React.FC<ConsultaTablaFrontProps> = ({
   dbName,
   tableName,
   selectedRowId,
   onRowSelect,
   onSaveRow,
   searchTerm = '',
}) => {

  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [sortColumn] = useState<string>('');
  const [sortDirection] = useState<'asc' | 'desc'>('asc');
  // Note: Sorting functionality can be implemented later if needed

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

    // Asume que la primera columna es la clave primaria (PK).
    const pkColumn = tableData.columns[0];
    const pkValue = editData[pkColumn];

    if (pkValue === undefined) {
      alert(`Error: No se pudo encontrar el valor de la clave primaria ('${pkColumn}').`);
      return;
    }

    const updates = { ...editData };
    delete updates[pkColumn]; // Excluye la PK de los datos a actualizar.

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
<div className="table-container">
  <div className="table-header">
    <h2 className="table-title">{tableData.table_name}</h2>
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
            {tableData.columns.map((column) => (
              <td key={column} className="data-cell">
                {editingRowId === rowIndex ? (
                  <input
                    type="text"
                    value={editData[column] ?? ''}
                    onChange={(e) => handleInputChange(column, e.target.value)}
                    className="edit-input"
                    aria-label={`Editar ${column}`}
                  />
                ) : (
                  <div className="cell-content" title={String(row[column] ?? 'NULL')}>
                    {String(row[column] ?? 'NULL')}
                  </div>
                )}
              </td>
            ))}
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

  .table-title {
    color: white;
    font-weight: 700;
    line-height: 1.2;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: clamp(1rem, 2vw, 1.5rem);
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
    border-collapse: separate;
    border-spacing: 0;
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
    border-right: 1px solid var(--color-border);
    min-width: 120px;
  }

  .data-column:last-child,
  .data-cell:last-child {
    border-right: none;
  }

  .column-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 200px;
  }

  .table-row {
    border-bottom: 1px solid var(--color-border);
    cursor: pointer;
    transition: background-color 0.15s ease;
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
    border-right: 1px solid var(--color-border);
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

  .edit-button {
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

  .edit-button:hover:not(:disabled) {
    background-color: #1d4ed8;
    transform: translateY(-1px);
  }

  .edit-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .edit-button:active:not(:disabled) {
    transform: translateY(0);
  }

  .edit-controls {
    display: flex;
    gap: var(--spacing-md);
    align-items: center;
  }

  .btn-save,
  .btn-cancel {
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

  .btn-cancel {
    background-color: var(--color-danger);
  }

  .btn-cancel:hover {
    background-color: #b91c1c;
    transform: translateY(-1px);
  }

  .btn-save:active,
  .btn-cancel:active {
    transform: translateY(0);
  }

  @media (min-width: 480px) {
    .column-title {
      max-width: 250px;
    }

    .cell-content {
      max-width: 220px;
    }
  }

  @media (min-width: 640px) {
    .table-header {
      padding: var(--spacing-lg);
    }

    .table-title {
      font-size: 1.25rem;
    }

    .data-column {
      padding: var(--spacing-md);
      font-size: 1rem;
      min-width: 140px;
    }

    .data-cell {
      padding: var(--spacing-md);
      font-size: 1rem;
    }

    .table-footer {
      padding: var(--spacing-lg);
    }

    .edit-button {
      padding: var(--spacing-sm) var(--spacing-lg);
      font-size: 1rem;
    }

    .btn-save,
    .btn-cancel {
      font-size: 1rem;
    }
  }

  @media (min-width: 768px) {
    .table-header {
      padding: var(--spacing-xl);
    }

    .table-title {
      font-size: 1.5rem;
    }

    .edit-button {
      padding: var(--spacing-md) var(--spacing-xl);
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
`}</style>
  </>
  );

};

export default ConsultaTablaFront;