
import { invoke } from "@tauri-apps/api/tauri";
import { open } from "@tauri-apps/api/dialog";

interface HeaderProps {
  searchValue: string;
  setSearchValue: (value: string) => void;
}

const Header = ({ searchValue, setSearchValue }: HeaderProps) => {
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
    <header className="flex items-center justify-between px-4 md:px-10 py-3 sticky top-0 z-10 bg-gray-800">
      <div className="flex items-center gap-4 flex-1">
        <label className="relative flex-1 max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
          <input
            className="w-full border py-2 pl-10 pr-4 text-sm rounded-md focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
            placeholder="Buscar"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </label>
      </div>

      <div className="flex items-center gap-2">
      

        <button
          onClick={handleImport}
          className="px-4 py-2 bg-blue-600 text-white rounded-md font-bold hover:bg-blue-700"
        >
          Importar
        </button>
      </div>
    </header>
  );
};

export default Header;
