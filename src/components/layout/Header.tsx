import { invoke } from "@tauri-apps/api/tauri";
import { open } from "@tauri-apps/api/dialog";

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
    <header className="flex items-center justify-between px-3 sm:px-4 md:px-6 lg:px-10 py-2 sm:py-3 sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md">
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-1 min-w-0">
        {/* Mobile menu button */}
        {showMobileMenu && (
          <button
            onClick={onMenuClick}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors lg:hidden"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        <label className="relative flex-1 max-w-xs sm:max-w-md">
          <span className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm sm:text-base">
            🔍
          </span>
          <input
            className="w-full border border-slate-600/50 py-1.5 sm:py-2 pl-8 sm:pl-10 pr-3 sm:pr-4 text-xs sm:text-sm rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-slate-800/50 text-white placeholder-slate-400 backdrop-blur-sm"
            placeholder="Buscar"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </label>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={handleImport}
          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white text-xs sm:text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Importar
        </button>
      </div>
    </header>
  );
};

export default Header;
