import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { invoke } from '@tauri-apps/api/tauri';
import toast, { Toaster } from "react-hot-toast";
import TablaSegura from '../../components/ui/TablaSegura';
import '../../styles/estilosPaginatsx.css';


const Pagina = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tableName, dbName } = location.state || {};

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);

  const handleRowSelect = (rowId: number) => {
    const newSelectedId = selectedRowId === rowId ? null : rowId;
    setSelectedRowId(newSelectedId);
  };

  const handleSaveRow = async (pk: { name: string, value: any }, updatedData: Record<string, any>, columnTypes?: Record<string, string>, columnNotNull?: Record<string, number>): Promise<boolean> => {
    try {
      if (!dbName || !tableName) throw new Error('Nombre de base de datos o tabla no especificado.');
      if (!pk || pk.name === undefined || pk.value === undefined) throw new Error('Clave primaria inválida.');

      console.log('Updating row with data:', updatedData);

      const result = await invoke('update_table_row', {
        dbName: dbName.trim(),
        tableName: tableName.trim(),
        pkColumn: pk.name,
        pkValue: pk.value,
        updates: updatedData,
        columnTypes,
        columnNotNull,
      });

      console.log('Update result:', result);
      return true;
    } catch (error) {
      console.error('Error updating row:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Error al guardar: ${errorMessage}`);
      return false;
    }
  };

  const handleDeleteRow = async (pk: { name: string, value: any }): Promise<boolean> => {
    try {
      if (!dbName || !tableName) throw new Error('Nombre de base de datos o tabla no especificado.');
      if (!pk || pk.name === undefined || pk.value === undefined) throw new Error('Clave primaria inválida.');

      const result = await invoke('delete_table_row', {
        dbName: dbName.trim(),
        tableName: tableName.trim(),
        pkColumn: pk.name,
        pkValue: pk.value,
      });

      return result === true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert('Error al eliminar la fila:\n' + errorMessage);
      return false;
    }
  };

  return (
    <div className="pagina">
      <header className="pagina-header">
        <div className="pagina-header-content">
          <div className="pagina-header-row">
            <button
              onClick={() => navigate('/hub_tablas', { state: { dbName } })}
              className="btn-volver"
              aria-label="Volver a la selección de tablas"
            >
              <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="btn-text">Volver</span>
            </button>

            <h1 className="pagina-titulo">
              {tableName ? `Tabla: ${tableName}` : 'Sin tabla seleccionada'}
            </h1>


            <div className="pagina-header-space"></div>
          </div>
        </div>
      </header>

      <main className="pagina-main">
        <div className="search-container">
          <div className="search-wrapper">
            <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar registros por cualquier campo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              aria-label="Buscar registros"
            />
          </div>
        </div>

        {tableName && dbName ? (
          <div className="tabla-wrapper">
            <TablaSegura
              dbName={dbName}
              tableName={tableName}
              selectedRowId={selectedRowId}
              onRowSelect={handleRowSelect}
              onSaveRow={handleSaveRow}
              onDeleteRow={handleDeleteRow}
              searchTerm={searchTerm}
            />
          </div>
        ) : (
          <div className="no-tabla">
            <div className="no-tabla-icon">
              <svg className="icon-xl" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="no-tabla-text">No se especificó la base de datos o la tabla</p>
              <p className="no-tabla-subtext">Por favor, selecciona una tabla para continuar</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="btn-inicio"
            >
              <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Volver al inicio
            </button>
          </div>
        )}
      </main>

      <Toaster position="bottom-center" containerStyle={{ zIndex: 99999, bottom: '50px' }} />
    </div>
  );
};

export default Pagina;
