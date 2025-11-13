import { invoke } from "@tauri-apps/api/tauri";
import { open } from "@tauri-apps/api/dialog";
import styles from "./Header.module.css";

interface HeaderProps {
  searchValue: string;
  setSearchValue: (value: string) => void;
  onMenuClick?: () => void;
  showMobileMenu?: boolean;
}

const Header = ({ searchValue, setSearchValue, onMenuClick, showMobileMenu = false }: HeaderProps) => {
  const handleImport = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "SQLite Database", extensions: ["sqlite", "db"] }],
      });

      if (selected && typeof selected === "string") {
        await invoke("import_database", { filepath: selected });
        alert("✅ Base de datos importada con éxito");
        // Refresh the database list in the parent component
        // @ts-ignore
        if (window.refreshDatabases) {
          // @ts-ignore
          window.refreshDatabases();
        }
      }
    } catch (error) {
      console.error("Error al importar:", error);
      let errorMessage = 'Error desconocido';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        // Handle Tauri invoke errors
        errorMessage = error as any;
      }

      alert(`❌ Error al importar la base de datos: ${errorMessage}`);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        {/* Mobile menu button */}
        {showMobileMenu && (
          <button
            onClick={onMenuClick}
            className={styles.menuButton}
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        <label className={styles.searchContainer}>
          <span className={styles.searchIcon}>
            🔍
          </span>
          <input
            className={styles.searchInput}
            placeholder="Buscar"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </label>
      </div>

      <div className={styles.headerRight}>
        <button
          onClick={handleImport}
          className={styles.importButton}
        >
          Importar
        </button>
      </div>
    </header>
  );
};

export default Header;
