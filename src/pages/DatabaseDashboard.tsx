import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import DatabaseTable from "../components/ui/DatabaseTable";

interface Database {
  name: string;
  lastModified: string;
  size: string;
  fileName: string; // solo nombre del archivo
  path?: string;    // ruta completa generada dinámicamente
}

const initialDatabases: Database[] = [
  { name: "Base de Datos 1", lastModified: "2024-02-10", size: "2.5 GB", fileName: "db1.db" },
  { name: "Base de Datos 2", lastModified: "2024-03-22", size: "15 GB", fileName: "db2.db" },
  { name: "Base de Datos 3", lastModified: "2024-04-05", size: "500 MB", fileName: "db3.db" },
  { name: "Base de Datos 4", lastModified: "2024-05-18", size: "8 GB", fileName: "db4.db" },
];

const DatabaseDashboard = () => {
  const [searchValue, setSearchValue] = useState("");
  const [databases, setDatabases] = useState<Database[]>([]);

  useEffect(() => {
    const init = async () => {
      // Import dinámico de Tauri solo en ambiente Tauri
      let dir = "";
      try {
        const { appDataDir } = await import("@tauri-apps/api/path");
        dir = await appDataDir();
      } catch {
        console.warn("No se pudo cargar @tauri-apps/api/path, usando ruta ficticia");
        dir = "/ruta/ficticia/"; // fallback para desarrollo en navegador
      }

      // Crear rutas multiplataforma para cada DB
      const dbsWithPath = initialDatabases.map(db => ({
        ...db,
        path: `${dir}${db.fileName}`,
      }));
      setDatabases(dbsWithPath);
    };

    init();
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
            <DatabaseTable databases={filteredDatabases} />
          </main>
        </div>
      </div>
    </div>
  );
};

export default DatabaseDashboard;
