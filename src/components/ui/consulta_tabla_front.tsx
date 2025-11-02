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
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl border border-gray-600 w-full">
      <div className="p-6 border-b border-gray-600 bg-gray-700">
        <h2 className="text-2xl font-bold text-white">{tableData.table_name}</h2>
      </div>

      <div className="overflow-x-auto max-h-[400px] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        <table className="min-w-full">
          <thead className="bg-gray-700 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-200 w-20 border-r border-gray-600">Acción</th>
              {tableData.columns.map((column) => (
                <th key={column} className="px-6 py-4 text-center text-sm font-semibold text-gray-200 border-r border-gray-600 last:border-r-0">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-gray-900/50">
            {processedRows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`border-b border-gray-600 group ${selectedRowId === rowIndex ? 'bg-blue-600' : 'hover:bg-blue-600/40'}`}
                onClick={() => editingRowId === null && onRowSelect(rowIndex)}
              >
                <td className="px-6 py-4 text-center border-r border-gray-600">
                  {editingRowId === rowIndex ? (
                    <div className="flex justify-center space-x-2">
                      <button onClick={handleSaveEdit} className="px-3 py-1 text-xs bg-green-600 rounded-full hover:bg-green-700">Guardar</button>
                      <button onClick={handleCancelEdit} className="px-3 py-1 text-xs bg-red-600 rounded-full hover:bg-red-700">Cancelar</button>
                    </div>
                  ) : (
                    <input type="radio" name="row-select" checked={selectedRowId === rowIndex} onChange={() => onRowSelect(rowIndex)} />
                  )}
                </td>
                {tableData.columns.map((column) => (
                  <td key={column} className="px-6 py-4 text-sm text-gray-200 text-center border-r border-gray-600 last:border-r-0">
                    {editingRowId === rowIndex ? (
                      <input
                        type="text"
                        value={editData[column] ?? ''}
                        onChange={(e) => handleInputChange(column, e.target.value)}
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white"
                      />
                    ) : (
                      <div className="truncate" title={String(row[column] ?? 'NULL')}>{String(row[column] ?? 'NULL')}</div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-6 border-t border-gray-600 bg-gray-800">
        <div className="flex justify-end">
          <button
            onClick={() => {
              if (selectedRowId !== null) {
                const selectedRow = processedRows[selectedRowId];
                setEditData({ ...selectedRow });
                setEditingRowId(selectedRowId);
              }
            }}
            disabled={selectedRowId === null || editingRowId !== null}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            Editar Fila Seleccionada
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsultaTablaFront;