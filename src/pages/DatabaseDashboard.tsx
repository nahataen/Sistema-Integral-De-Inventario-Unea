import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import DatabaseTable from "../components/ui/DatabaseTable";
import type { Database } from "./types"; // porque está en la misma carpeta pages

const initialDatabases: Database[] = [
  { name: "Base de Datos 1", lastModified: "2024-02-10", size: "2.5 GB", fileName: "db1.db", status: "active" },
  { name: "Base de Datos 2", lastModified: "2024-03-22", size: "15 GB", fileName: "db2.db", status: "active" },
  { name: "Base de Datos 3", lastModified: "2024-04-05", size: "500 MB", fileName: "db3.db", status: "inactive" },
  { name: "Base de Datos 4", lastModified: "2024-05-18", size: "8 GB", fileName: "db4.db", status: "active" },
];

const DatabaseDashboard = () => {
  const [searchValue, setSearchValue] = useState("");
  const [databases, setDatabases] = useState<Database[]>([]);

  const initDatabases = async () => {
    let dir = "";
    try {
      const { appDataDir } = await import("@tauri-apps/api/path");
      dir = await appDataDir();
    } catch {
      console.warn("No se pudo cargar @tauri-apps/api/path, usando ruta ficticia");
      dir = "/ruta/ficticia/"; // fallback para desarrollo en navegador
    }

    // Crear rutas multiplataforma y conservar status
    const dbsWithPath = initialDatabases.map(db => ({
      ...db,
      path: `${dir}${db.fileName}`,
    }));
    setDatabases(dbsWithPath);
  };

  useEffect(() => {
    initDatabases();
  }, []);

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
            <DatabaseTable databases={filteredDatabases} onRefresh={initDatabases} />
          </main>
        </div>
      </div>
    </div>
  );
};

export default DatabaseDashboard;
