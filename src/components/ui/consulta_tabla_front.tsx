// ===== IMPORTACIONES =====
// Importamos React y hooks necesarios para manejar estado y efectos
// POR QUÉ: Necesitamos poder guardar información y reaccionar a cambios
// CÓMO: useState guarda datos, useEffect ejecuta código cuando algo cambia
import React, { useState, useEffect, useMemo } from 'react';

// Importamos invoke de Tauri para comunicarnos con el backend
// POR QUÉ: Permitirá llamar funciones Rust desde nuestra app
// CÓMO: invoke('nombre_funcion', {parametros}) devuelve promesa con datos
import { invoke } from '@tauri-apps/api/tauri';

// ===== INTERFACES =====
// Define la estructura de los datos de la tabla
// POR QUÉ: TypeScript necesita saber qué esperar para evitar errores
// CÓMO: TableData tiene nombre, columnas y filas con valores de cualquier tipo
interface TableData {
  table_name: string;
  columns: string[];
  rows: Record<string, any>[];
}

// Define las props que recibe el componente
// POR QUÉ: Permite pasar información y funciones desde el componente padre
// CÓMO: Incluye nombre de DB, tabla, fila seleccionada, funciones de selección y guardado, y búsqueda
interface ConsultaTablaFrontProps {
   dbName: string;
   tableName: string;
   selectedRowId: number | null;
   onRowSelect: (rowId: number) => void;
   onSaveRow?: (rowId: number, updatedData: Record<string, any>) => void;
   searchTerm?: string;
   sortOrder?: string;
}

// ===== COMPONENTE PRINCIPAL =====
const ConsultaTablaFront: React.FC<ConsultaTablaFrontProps> = ({
  dbName,
  tableName,
  selectedRowId,
  onRowSelect,
  onSaveRow,
  searchTerm = ''
}) => {

  // ===== BLOQUE 1: ESTADOS =====
  // Guardamos los datos de la tabla
  const [tableData, setTableData] = useState<TableData | null>(null);
  // Estado de carga
  const [loading, setLoading] = useState(true);
  // Estado de error
  const [error, setError] = useState<string | null>(null);
  // Fila que está siendo editada
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  // Datos editables de la fila
  const [editData, setEditData] = useState<Record<string, any>>({});

  // Estados para el filtrado y ordenamiento
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showFilterControls, setShowFilterControls] = useState<boolean>(false);

  // ===== BLOQUE 2: CARGA DE DATOS =====
  // useEffect ejecuta fetchTableData al cambiar dbName o tableName
  useEffect(() => {
    const fetchTableData = async () => {
      try {
        // Llamamos a la función Rust para traer datos de la tabla
        const data: TableData = await invoke('consulta_tabla', { dbName, tableName });

        // Reemplazamos valores nulos por cadena vacía para mejor visualización
        for (let i = 0; i < data.rows.length; i++) {
          for (const key in data.rows[i]) {
            if (data.rows[i][key] === null) {
              data.rows[i][key] = '';
            }
          }
        }

        // Guardamos los datos en el estado
        setTableData(data);
      } catch (err) {
        // Capturamos errores y los mostramos
        console.error('Error al consultar la tabla:', err);
        setError('Error al cargar los datos de la tabla');
      } finally {
        // Siempre dejamos de mostrar carga
        setLoading(false);
      }
    };

    // Solo cargamos si hay nombre de tabla
    if (tableName) {
      fetchTableData();
    }
  }, [dbName, tableName]);


  // Guardar cambios de edición
  const handleSaveEdit = () => {
    if (editingRowId !== null && onSaveRow) {
      // Llamamos a la función del padre para guardar cambios
      onSaveRow(editingRowId, editData);
    }
    // Limpiamos estados de edición
    setEditingRowId(null);
    setEditData({});
  };

  // Cancelar edición
  const handleCancelEdit = () => {
    setEditingRowId(null);
    setEditData({});
  };

  // Cambios en los inputs de edición
  const handleInputChange = (column: string, value: string) => {
    // Actualizamos solo la columna que cambió
    setEditData(prev => ({
      ...prev,
      [column]: value
    }));
  };

  // ===== BLOQUE 4: FUNCIONES DE FILTRADO Y ORDENAMIENTO =====
  // Función para ordenar los datos según la columna y dirección seleccionadas
  const sortData = (data: Record<string, any>[], column: string, direction: 'asc' | 'desc') => {
    if (!column) return data;

    return [...data].sort((a, b) => {
      const valueA = a[column];
      const valueB = b[column];

      // Manejo de valores nulos o vacíos
      if (valueA === null || valueA === '') return direction === 'asc' ? -1 : 1;
      if (valueB === null || valueB === '') return direction === 'asc' ? 1 : -1;

      // Intentar ordenar como números si ambos valores son numéricos
      if (!isNaN(Number(valueA)) && !isNaN(Number(valueB))) {
        return direction === 'asc'
          ? Number(valueA) - Number(valueB)
          : Number(valueB) - Number(valueA);
      }

      // Ordenamiento alfabético por defecto
      const stringA = String(valueA).toLowerCase();
      const stringB = String(valueB).toLowerCase();

      if (direction === 'asc') {
        return stringA < stringB ? -1 : stringA > stringB ? 1 : 0;
      } else {
        return stringA > stringB ? -1 : stringA < stringB ? 1 : 0;
      }
    });
  };

  // ===== BLOQUE 5: FILTRADO Y ORDENAMIENTO DE FILAS =====
  // Usamos useMemo para optimizar el rendimiento al filtrar y ordenar
  const processedRows = useMemo(() => {
    if (!tableData) return [];

    // Primero filtramos según searchTerm
    let filtered = tableData.rows.filter(row => {
      if (!searchTerm.trim()) {
        return true;
      }

      const searchLower = searchTerm.toLowerCase();

      // Revisamos si alguna columna contiene el término de búsqueda
      return tableData.columns.some(column => {
        const cellValue = row[column];
        return cellValue !== null && String(cellValue).toLowerCase().includes(searchLower);
      });
    });

    // Luego aplicamos el ordenamiento si hay una columna seleccionada
    if (sortColumn) {
      filtered = sortData(filtered, sortColumn, sortDirection);
    }

    return filtered;
  }, [tableData, searchTerm, sortColumn, sortDirection]);

  // ===== BLOQUE 6: RENDERIZADO CONDICIONAL =====
  // Mostrar carga mientras se obtienen datos
  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-8">
        <div className="flex items-center justify-center">
          <p className="text-gray-100">Cargando datos de la tabla...</p>
        </div>
      </div>
    );
  }

  // Mostrar error si ocurrió
  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-8">
        <div className="flex items-center justify-center">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  // Mostrar mensaje si no hay datos
  if (!tableData) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-8">
        <div className="flex items-center justify-center">
          <p className="text-gray-400">No se encontraron datos de la tabla.</p>
        </div>
      </div>
    );
  }

// ===== BLOQUE 7: RENDERIZADO DE TABLA =====
return (
  <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl border border-gray-600 overflow-hidden w-full max-w-full">

    {/* Header de la tabla */}
    <div className="p-2 sm:p-4 md:p-6 border-b border-gray-600 bg-gray-700">
      <div className="flex justify-between items-center">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white flex items-center">
          {/* Icono */}
          <svg className="w-6 h-6 mr-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {tableData.table_name}
        </h2>

        {/* Botón para mostrar/ocultar controles de filtrado */}
        <button
          onClick={() => setShowFilterControls(!showFilterControls)}
          className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filtrar y Ordenar
        </button>
      </div>

      {/* Controles de filtrado y ordenamiento */}
      {showFilterControls && (
        <div className="mt-4 p-4 bg-gray-800 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Selector de columna para ordenar */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ordenar por columna:
              </label>
              <select
                value={sortColumn}
                onChange={(e) => setSortColumn(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sin ordenamiento</option>
                {tableData.columns.map((column, index) => (
                  <option key={index} value={column}>
                    {column}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de dirección de ordenamiento */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Dirección:
              </label>
              <div className="flex space-x-4 mt-3">
                <label className="flex items-center text-white">
                  <input
                    type="radio"
                    value="asc"
                    checked={sortDirection === 'asc'}
                    onChange={() => setSortDirection('asc')}
                    className="mr-2"
                  />
                  Ascendente
                </label>
                <label className="flex items-center text-white">
                  <input
                    type="radio"
                    value="desc"
                    checked={sortDirection === 'desc'}
                    onChange={() => setSortDirection('desc')}
                    className="mr-2"
                  />
                  Descendente
                </label>
              </div>
            </div>

            {/* Botón para limpiar ordenamiento */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSortColumn('');
                  setSortDirection('asc');
                }}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Limpiar Ordenamiento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Tabla y scroll (el scroll horizontal solo se activará en pantallas md y superiores) */}
    {processedRows.length > 0 ? (
      <div className="relative">
        <div
          className="overflow-x-auto overflow-y-auto max-h-[300px] sm:max-h-[400px] min-h-[150px] sm:min-h-[200px] w-full scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 hover:scrollbar-thumb-gray-500"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#4B5563 #1F2937'
          }}
        >
          {/* ===== TABLA ===== */}
          {/*
            Mantenemos 'md:table-fixed' para anchos de columna uniformes
          */}
          <table className="w-full block md:table-fixed md:min-w-full">
            {/* Encabezado */}
            <thead className="hidden md:table-header-group bg-gray-700 sticky top-0 z-10">
              <tr className="md:table-row">
                <th className="px-4 sm:px-6 py-4 sm:py-5 text-center text-sm font-semibold text-gray-200 uppercase tracking-wider w-20 border-r border-gray-600">
                  <span className="sr-only">Seleccionar</span>
                </th>
                {tableData.columns.map((column, index) => (
                  <th
                    key={index}
                    /*
                      CAMBIO: 'text-left' -> 'text-center'
                      POR QUÉ: Para centrar el texto del encabezado.
                    */
                    className="px-1 sm:px-2 md:px-4 lg:px-6 py-1 sm:py-2 md:py-4 lg:py-5 text-center text-xs sm:text-sm font-semibold text-gray-200 uppercase tracking-wider border-r border-gray-600 last:border-r-0"
                  >
                    <div className="flex items-center justify-center"> {/* Añadido justify-center para alinear el span */}
                      {/*
                        CAMBIO: Añadido 'truncate'
                        POR QUÉ: Para cortar títulos largos con '...'
                      */}
                      <span className="truncate" title={column}>
                        {column}
                        {sortColumn === column && (
                          <span className="ml-1">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Cuerpo de la tabla */}
            <tbody className="bg-gray-900/50 block md:table-row-group">
              {processedRows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`
                    block md:table-row
                    mb-4 md:mb-0
                    rounded-lg md:rounded-none
                    overflow-hidden md:overflow-visible
                    shadow-lg md:shadow-none
                    border border-gray-700 md:border-0
                    md:border-b md:border-gray-600
                    group
                    ${selectedRowId === rowIndex ? '' : (rowIndex % 2 === 0 ? 'bg-gray-800/60' : 'bg-gray-700/60')}
                    md:hover:bg-blue-600 cursor-pointer
                    ${selectedRowId === rowIndex ? 'bg-blue-600' : ''}
                    ${editingRowId === rowIndex ? 'bg-yellow-900/40' : ''}
                  `}
                  onClick={() => editingRowId === null && onRowSelect(rowIndex)}
                >
                  {/* Selector de fila (Celda de Acciones) */}
                  <td className="block md:table-cell p-4 md:px-1 sm:px-2 md:px-4 lg:px-6 md:py-1 sm:py-2 md:py-4 lg:py-5 text-right md:text-center md:border-r md:border-gray-600 border-b md:border-b-0 border-gray-700">
                    {/* Contenido (Botones o Radio) */}
                    <div className="flex justify-end md:justify-center">
                      {editingRowId === rowIndex ? (
                        <div className="flex space-x-2 justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveEdit();
                            }}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors shadow-md"
                          >
                            ✓
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelEdit();
                            }}
                            className="px-3 py-1 text-xs bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-md"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <input
                          type="radio"
                          name="row-select"
                          checked={selectedRowId === rowIndex}
                          onChange={() => onRowSelect(rowIndex)}
                          className="w-4 h-4 text-blue-400 bg-gray-700 border-gray-600 focus:ring-blue-400 focus:ring-2"
                        />
                      )}
                    </div>
                  </td>

                  {/* Celdas de datos */}
                  {tableData.columns.map((column, colIndex) => (
                    <td
                      key={colIndex}
                      /*
                        CAMBIO: Añadido 'md:text-center'
                        POR QUÉ: Centra el texto en la celda solo en escritorio (md).
                        La vista móvil (tarjeta) mantiene su alineación por defecto (izquierda).
                      */
                      className={`
                        block md:table-cell
                        px-4 pt-2 pb-3 md:px-1 sm:px-2 md:px-4 lg:px-6
                        md:py-1 sm:py-2 md:py-4 lg:py-5
                        text-xs sm:text-sm text-gray-200
                        break-words
                        md:text-center
                        md:border-r md:border-gray-600 md:last:border-r-0
                        md:align-top
                        border-b md:border-b-0 border-gray-700 last:border-b-0
                        ${colIndex % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-700/30'}
                      `}
                    >
                      {/* Etiqueta visible solo en móvil (oculta en 'md' y superior) */}
                      <div className="md:hidden text-xs font-semibold text-gray-400 uppercase mb-1">
                        {column}
                      </div>

                      {/* Contenido (Input o Texto) */}
                      {editingRowId === rowIndex ? (
                        <input
                          type="text"
                          value={editData[column] || ''}
                          onChange={(e) => handleInputChange(column, e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm"
                          placeholder={column}
                        />
                      ) : (
                        <div
                          /*
                            CAMBIO: Reintroducido 'md:truncate'
                            POR QUÉ: Evita que la celda se haga muy alta (larga) en escritorio
                            cortando el texto con '...'. 'break-words' en el <td> se
                            sigue aplicando en móvil.
                          */
                          className="md:truncate cursor-help leading-relaxed"
                          title={row[column] !== null ? String(row[column]) : 'NULL'}
                        >
                          {row[column] !== null ? String(row[column]) : 'NULL'}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Estilos de scrollbar personalizados (sin cambios) */}
        <style dangerouslySetInnerHTML={{
          __html: `
            .scrollbar-thin::-webkit-scrollbar {
              width: 10px;
              height: 10px;
            }
            .scrollbar-thin::-webkit-scrollbar-track {
              background: #1F2937;
              border-radius: 6px;
            }
            .scrollbar-thin::-webkit-scrollbar-thumb {
              background: #4B5563;
              border-radius: 6px;
              border: 2px solid #1F2937;
              box-shadow: inset 0 0 5px rgba(0,0,0,0.3);
            }
            .scrollbar-thin::-webkit-scrollbar-thumb:hover {
              background: #6B7280;
            }
            .scrollbar-thin::-webkit-scrollbar-corner {
              background: #1F2937;
            }
          `
        }} />
      </div>
    ) : (

      // Mensaje si no hay filas filtradas (sin cambios)
      <div className="p-8 sm:p-12 text-center">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-gray-400 text-lg">
          {searchTerm.trim() ? `No se encontraron resultados para "${searchTerm}".` : 'La tabla está vacía.'}
        </p>
      </div>
    )}

    {/* Botón para editar fila seleccionada (sin cambios) */}
    {tableData && processedRows.length > 0 && (
      <div className="p-2 sm:p-4 md:p-6 border-t border-gray-600 bg-gradient-to-r from-gray-800 to-gray-900">
        <div className="flex justify-end">
          <button
            onClick={() => {
              if (selectedRowId !== null) {
                const event = new CustomEvent('editRow', { detail: { rowId: selectedRowId } });
                window.dispatchEvent(event);
              }
            }}
            disabled={selectedRowId === null}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-xs sm:text-sm md:text-base font-medium shadow-lg hover:shadow-xl"
          >
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar Fila Seleccionada
            </span>
          </button>
        </div>
      </div>
    )}
  </div>
);
};

// Exportamos el componente para usarlo en otros lados
export default ConsultaTablaFront;