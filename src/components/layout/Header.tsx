
import { invoke } from "@tauri-apps/api/tauri";
import { open, save } from "@tauri-apps/api/dialog";

interface HeaderProps {
  searchValue: string;
  setSearchValue: (value: string) => void;
}

const Header = ({ searchValue, setSearchValue }: HeaderProps) => {
  const handleImport = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "SQLite Database", extensions: ["db"] }],
      });

      if (selected && typeof selected === "string") {
        await invoke("import_database", { filePath: selected });
        alert("✅ Base de datos importada con éxito");
      }
    } catch (error) {
      console.error("Error al importar:", error);
      alert("❌ Error al importar la base de datos");
    }
  };

  const handleExport = async () => {
    try {
      const filePath = await save({
        filters: [{ name: "SQLite Database", extensions: ["db"] }],
        defaultPath: "database.db",
      });

      if (filePath) {
        await invoke("export_database", { filePath });
        alert("✅ Base de datos exportada con éxito");
      }
    } catch (error) {
      console.error("Error al exportar:", error);
      alert("❌ Error al exportar la base de datos");
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
          onClick={handleExport}
          className="hidden sm:flex px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-md font-bold hover:bg-blue-50"
        >
          Exportar
        </button>

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
