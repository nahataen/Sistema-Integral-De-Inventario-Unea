import { useState, useEffect, useMemo } from "react";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import DatabaseTable from "../components/ui/DatabaseTable";
import type { Database } from "./types";
import { invoke } from "@tauri-apps/api/tauri";

const DatabaseDashboard = () => {
  const [searchValue, setSearchValue] = useState("");
  const [databases, setDatabases] = useState<Database[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Cargar bases de datos en el montaje
  useEffect(() => {
    (window as any).refreshDatabases = loadDatabases;
    return () => delete (window as any).refreshDatabases;
  }, []);

  const formatFileSize = (bytes: any): string => {
    if (bytes == null || bytes === "") return "-";
    if (typeof bytes === "string" && !isNaN(Number(bytes))) {
      bytes = parseFloat(bytes);
    }
    if (typeof bytes !== "number" || isNaN(bytes)) return "N/A";

    const units = ["B", "KB", "MB", "GB", "TB"];
    let size = bytes;
    let i = 0;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024;
      i++;
    }
    return `${size.toFixed(1)} ${units[i]}`;
  };

  const getSizeColor = (bytes: number): string => {
    if (isNaN(bytes)) return "text-slate-400";
    if (bytes < 1024 * 1024) return "text-blue-400";
    if (bytes < 100 * 1024 * 1024) return "text-yellow-400";
    return "text-red-400";
  };

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

  useEffect(() => {
    loadDatabases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredDatabases = useMemo(() => {
    return databases.filter((db) =>
      db.name.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [databases, searchValue]);

  const databasesWithFormattedSize = useMemo(() => {
    return filteredDatabases.map((db) => ({
      ...db,
      displaySize: formatFileSize(db.size),
      sizeColor: getSizeColor(db.size),
    }));
  }, [filteredDatabases]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      {/* Fondo oscuro al abrir menú en móvil */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-40 w-72 transform transition-transform duration-300 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <Sidebar />
      </aside>

      {/* Contenido principal */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Encabezado */}
        <header className="sticky top-0 z-20 border-b border-slate-700/30 bg-slate-900/80 backdrop-blur-xl">
          <Header
            searchValue={searchValue}
            setSearchValue={setSearchValue}
            onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            showMobileMenu
            aria-label="Menú principal"
          />
        </header>

        {/* Contenido */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-8 hub-main-scroll">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Contenedor principal */}
            <div className="rounded-2xl bg-slate-800/50 backdrop-blur-md border border-slate-700/40 shadow-xl hover:shadow-cyan-500/20 transition-all duration-300">
              {loading ? (
                // Skeleton Loader
                <div className="animate-pulse grid gap-3 p-6">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-6 bg-slate-700/40 rounded-lg"
                    ></div>
                  ))}
                  <div className="h-6 bg-slate-700/40 rounded-lg w-3/4"></div>
                </div>
              ) : databasesWithFormattedSize.length > 0 ? (
                <div className="p-4">
                  <div className="overflow-auto max-h-[75vh]">
                    <DatabaseTable
                      databases={databasesWithFormattedSize}
                      onRefresh={loadDatabases}
                    />
                  </div>
                </div>
              ) : (
                // Estado vacío
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                  <div className="bg-slate-700/30 rounded-full p-4">
                    <svg
                      className="w-10 h-10 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-200">
                    No se encontraron bases de datos
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Intenta ajustar tu búsqueda o crea una nueva base de datos
                  </p>
                </div>
              )}
            </div>

            {/* Footer informativo */}
            <footer className="flex flex-col sm:flex-row items-center justify-between text-slate-400 text-sm mt-4 border-t border-slate-700/40 pt-3">
              <p>
                {databasesWithFormattedSize.length}{" "}
                {databasesWithFormattedSize.length === 1
                  ? "base de datos encontrada"
                  : "bases de datos encontradas"}
              </p>

            </footer>
          </div>
        </main>
      </div>

      {/* Scrollbar estilizado */}
      <style>{`
        .hub-main-scroll {
          scrollbar-width: thin;
          scrollbar-color: #2563eb #1e293b;
        }
        .hub-main-scroll::-webkit-scrollbar {
          width: 10px;
        }
        .hub-main-scroll::-webkit-scrollbar-track {
          background: #1e293b;
        }
        .hub-main-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #2563eb, #1d4ed8);
          border-radius: 8px;
          border: 3px solid #1e293b;
          transition: background 0.3s;
        }
        .hub-main-scroll::-webkit-scrollbar-thumb:hover {
          background: #3b82f6;
        }
      `}</style>
    </div>
  );
};

export default DatabaseDashboard;
