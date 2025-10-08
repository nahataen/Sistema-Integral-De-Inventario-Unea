import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import DatabaseTable from "../components/ui/DatabaseTable";
import type { Database } from "./types"; // importa el archivo de index.ts dentro de types  la interfaz Database que tiene nombre, estado, tamaño, última modificación y ruta
import { invoke } from "@tauri-apps/api/tauri";

const DatabaseDashboard = () => {
  const [searchValue, setSearchValue] = useState("");
  const [databases, setDatabases] = useState<Database[]>([]); // Estado para almacenar las bases de datos
  const [loading, setLoading] = useState(true);

  // Exponer función para refrescar desde Header
  useEffect(() => {
    // @ts-ignore
    window.refreshDatabases = loadDatabases;
  }, []);

  // Función para cargar las bases de datos desde el backend
  const loadDatabases = async () => {
    try {
      setLoading(true);
      const databasesList = await invoke<Database[]>("list_databases");
      setDatabases(databasesList);
    } catch (error) {
      console.error("Error al cargar bases de datos:", error);
      setDatabases([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar bases de datos al iniciar el componente
  useEffect(() => {
    loadDatabases();
  }, []);

  // Filtrar bases de datos según el valor de búsqueda
  const filteredDatabases = databases.filter(db =>
    db.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div>
      <div className="flex min-h-screen bg-gray-800">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header
            searchValue={searchValue}
            setSearchValue={setSearchValue}
          />
          <main className="flex-1 p-4 overflow-auto">
            {loading ? (
              <div className="text-center text-white">Cargando bases de datos...</div>
            ) : (
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

export default DatabaseDashboard;
