import { useState, useEffect, useMemo } from "react";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import DatabaseTable from "../../components/ui/DatabaseTable";
import type { Database } from "../../types";
import { invoke } from "@tauri-apps/api/tauri";
import styles from "./DatabaseDashboard.module.css";

const DatabaseDashboard = () => {
  const [searchValue, setSearchValue] = useState("");
  const [databases, setDatabases] = useState<Database[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Cargar bases de datos en el montaje
  useEffect(() => {
    (window as any).refreshDatabases = loadDatabases;
    return () => {
      delete (window as any).refreshDatabases;
    };
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

  const getSizeColor = (bytes: any): string => {
    if (typeof bytes !== "number" || isNaN(bytes)) return "text-slate-400";
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
    <div className={styles.container}>
      {/* Fondo oscuro al abrir menú en móvil */}
      {isMobileMenuOpen && (
        <div
          className={styles.overlay}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${isMobileMenuOpen ? styles.sidebarOpen : ""} ${styles.sidebarRelative}`}
      >
        <Sidebar />
      </aside>

      {/* Contenido principal */}
      <div className={styles.main}>
        {/* Encabezado */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <Header
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              showMobileMenu
              aria-label="Menú principal"
            />
          </div>
        </header>

        {/* Contenido */}
        <main className={`${styles.content} ${styles.scrollContainer}`}>
          <div className={styles.contentGrid}>
            {/* Contenedor principal */}
            <div className={styles.card}>
              {loading ? (
                // Skeleton Loader
                <div className={styles.loading}>
                  {[...Array(5)].map((_, i) => (
                    <div key={i}></div>
                  ))}
                  <div></div>
                </div>
              ) : databasesWithFormattedSize.length > 0 ? (
                <div className={styles.tableWrapper}>
                  <DatabaseTable
                    databases={databasesWithFormattedSize}
                    onRefresh={loadDatabases}
                  />
                </div>
              ) : (
                // Estado vacío
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>
                    <svg
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
                  <h3 className={styles.emptyTitle}>
                    No se encontraron bases de datos
                  </h3>
                  <p className={styles.emptyText}>
                    Intenta ajustar tu búsqueda o crea una nueva base de datos
                  </p>
                </div>
              )}
            </div>

            {/* Footer informativo */}
            <footer className={styles.footer}>
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
          scrollbar-color: var(--primary-color) var(--surface-color);
        }
        .hub-main-scroll::-webkit-scrollbar {
          width: 10px;
        }
        .hub-main-scroll::-webkit-scrollbar-track {
          background: var(--surface-color);
        }
        .hub-main-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, var(--primary-color), var(--accent-color));
          border-radius: 8px;
          border: 3px solid var(--surface-color);
          transition: background 0.3s;
        }
        .hub-main-scroll::-webkit-scrollbar-thumb:hover {
          background: var(--primary-color);
        }
      `}</style>
    </div>
  );
};

export default DatabaseDashboard;