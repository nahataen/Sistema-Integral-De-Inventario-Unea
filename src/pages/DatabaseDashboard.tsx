// ==========================================
// SECCIÓN DE IMPORTACIONES
// ==========================================

import { useState, useEffect } from "react"; // Hooks de React para manejar estado y efectos
import Sidebar from "../components/layout/Sidebar"; // Componente de barra lateral
import Header from "../components/layout/Header"; // Componente de encabezado
import DatabaseTable from "../components/ui/DatabaseTable"; // Componente para mostrar la tabla de bases de datos
import type { Database } from "./types"; // importa el archivo de index.ts dentro de types  la interfaz Database que tiene nombre, estado, tamaño, última modificación y ruta
import { invoke } from "@tauri-apps/api/tauri"; // Función para llamar comandos del backend de Tauri

// ==========================================
// DEFINICIÓN DEL COMPONENTE
// ==========================================

const DatabaseDashboard = () => {
  // ==========================================
  // VARIABLES DE ESTADO
  // ==========================================

  const [searchValue, setSearchValue] = useState(""); // Valor del campo de búsqueda
  const [databases, setDatabases] = useState<Database[]>([]); // Estado para almacenar las bases de datos
  const [loading, setLoading] = useState(true); // Estado para mostrar carga mientras se obtienen datos

  // ==========================================
  // EFECTOS DE REACT
  // ==========================================

  // Exponer función para refrescar desde Header
  useEffect(() => {
    // @ts-ignore
    window.refreshDatabases = loadDatabases; // Hace que la función loadDatabases sea accesible globalmente para el Header
  }, []);

  // ==========================================
  // FUNCIONES DEL COMPONENTE
  // ==========================================

  // Función para cargar las bases de datos desde el backend
  const loadDatabases = async () => {
    try {
      setLoading(true); // Muestra indicador de carga
      const databasesList = await invoke<Database[]>("list_databases"); // Llama al comando del backend para listar bases de datos
      setDatabases(databasesList); // Actualiza el estado con la lista obtenida
    } catch (error) {
      console.error("Error al cargar bases de datos:", error); // Manejo de errores
      setDatabases([]); // En caso de error, establece lista vacía
    } finally {
      setLoading(false); // Oculta indicador de carga
    }
  };

  // Cargar bases de datos al iniciar el componente
  useEffect(() => {
    loadDatabases(); // Ejecuta la carga inicial de bases de datos
  }, []);

  // ==========================================
  // LÓGICA DE FILTRADO
  // ==========================================

  // Filtrar bases de datos según el valor de búsqueda
  const filteredDatabases = databases.filter(db =>
    db.name.toLowerCase().includes(searchValue.toLowerCase()) // Filtra por nombre, ignorando mayúsculas/minúsculas
  );

  // ==========================================
  // SECCIÓN DE RENDERIZADO
  // ==========================================

  return (
    <div>
      {/* Contenedor principal con fondo gris oscuro */}
      <div className="flex min-h-screen bg-gray-800">
        {/* Barra lateral del layout */}
        <Sidebar />
        {/* Área principal que ocupa el resto del espacio */}
        <div className="flex-1 flex flex-col">
          {/* Pasa el valor de búsqueda y la función para actualizarla al Header */}
          <Header
            searchValue={searchValue}
            setSearchValue={setSearchValue}
          />
          {/* Contenido principal con padding y scroll */}
          <main className="flex-1 p-4 overflow-auto">
            {loading ? (
              /* Muestra mensaje de carga si está cargando */
              <div className="text-center text-white">Cargando bases de datos...</div>
            ) : (
              /* Si no está cargando, muestra la tabla con las bases de datos filtradas y la función de refresco */
              <DatabaseTable
                databases={filteredDatabases}
                onRefresh={loadDatabases}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// EXPORTACIÓN DEL COMPONENTE
// ==========================================

export default DatabaseDashboard;
