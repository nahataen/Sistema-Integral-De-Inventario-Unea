// src/pages/DatabaseDashboard.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

interface DatabaseDashboardProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const DatabaseDashboard = ({ isDarkMode, toggleTheme }: DatabaseDashboardProps) => {
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();

  const databases = [
    { name: "Base de Datos 1", lastModified: "2024-02-10", size: "2.5 GB", path: "/fictitious/folder/path" },
    { name: "Base de Datos 2", lastModified: "2024-03-22", size: "15 GB", path: "/fictitious/folder/path" },
    { name: "Base de Datos 3", lastModified: "2024-04-05", size: "500 MB", path: "/fictitious/folder/path" },
    { name: "Base de Datos 4", lastModified: "2024-05-18", size: "8 GB", path: "/fictitious/folder/path" },
    { name: "Base de Datos 5", lastModified: "2024-06-30", size: "1.2 GB", path: "/fictitious/folder/path" },
    { name: "Base de Datos 6", lastModified: "2024-07-12", size: "25 GB", path: "/fictitious/folder/path" },
    { name: "Base de Datos 7", lastModified: "2024-08-25", size: "3 GB", path: "/fictitious/folder/path" },
    { name: "Base de Datos 8", lastModified: "2024-09-08", size: "12 GB", path: "/fictitious/folder/path" },
    { name: "Base de Datos 9", lastModified: "2024-10-14", size: "100 MB", path: "/fictitious/folder/path" },
    { name: "Base de Datos 10", lastModified: "2024-11-27", size: "35 GB", path: "/fictitious/folder/path" }
  ];

  const filteredDatabases = databases.filter((db) =>
    db.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div
      className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden"
      style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      <style>{`
        :root {
          --primary-color: #0d7ff2;
          --secondary-color: #e7edf4;
          --text-primary: #0d141c;
          --text-secondary: #49739c;
        }
        .dark {
          --primary-color: #0d7ff2;
          --secondary-color: #2a2a2a;
          --text-primary: #ffffff;
          --text-secondary: #b0b0b0;
        }
        .dark body {
          background-color: #1a1a1a;
          color: #ffffff;
        }
        .dark aside,
        .dark header,
        .dark main,
        .dark table,
        .dark thead,
        .dark tbody,
        .dark .bg-white,
        .dark .bg-gray-50 {
          background-color: #1a1a1a !important;
        }
        .dark .border-gray-200 {
          border-color: #404040;
        }
        .dark tbody tr {
          border-color: #404040;
        }
        .dark .logo {
          filter: brightness(0) invert(1);
        }
        .dark .grow {
          background-color: #1a1a1a;
        }
        .icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          font-size: 20px;
          font-weight: normal;
        }
      `}</style>

      <div
        className={`flex h-full grow flex-row ${
          isDarkMode ? "bg-gray-900" : "bg-gray-50"
        } text-gray-800`}
      >
        {/* Sidebar */}
        <aside
          className={`hidden md:flex h-full min-h-screen flex-col justify-between p-4 shadow-sm w-64 ${
            isDarkMode ? "bg-gray-900" : "bg-white"
          }`}
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-center px-3 py-2">
              <div
                className={`w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-lg md:text-xl lg:text-2xl ${
                  isDarkMode ? "filter brightness-0 invert" : ""
                }`}
              >
                CD
              </div>
            </div>
            <nav className="flex flex-col gap-2 mt-4">
              <button
                onClick={() => navigate("/")}
                className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors duration-200 ${
                  isDarkMode
                    ? "text-gray-400 hover:bg-gray-700 hover:text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span className="icon">🏠</span>
                <span className="text-sm font-medium">Inicio</span>
              </button>
              <button
                onClick={() => navigate("/configuracion")}
                className={`flex items-center gap-3 rounded-md px-3 py-2 ${
                  isDarkMode
                    ? "text-white bg-gray-700"
                    : "text-gray-900 bg-gray-100"
                }`}
              >
                <span className="icon">⚙️</span>
                <span className="text-sm font-bold">Configuración</span>
              </button>
            </nav>
          </div>
          <div className="flex flex-col gap-1">
            <button
              onClick={toggleTheme}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 transition-colors duration-200 ${
                isDarkMode
                  ? "text-gray-400 hover:bg-gray-700 hover:text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <span className="icon">{isDarkMode ? "🌙" : "☀️"}</span>
              <span className="text-sm font-medium">
                {isDarkMode ? "Modo Oscuro" : "Modo Claro"}
              </span>
            </button>
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          {/* Header */}
          <header
            className={`flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200 px-4 md:px-10 py-3 sticky top-0 z-10 ${
              isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white"
            }`}
          >
            <div className="flex items-center gap-4 flex-1">
              {/* Mobile menu button */}
              <button className="md:hidden p-2 rounded-md hover:bg-gray-100">
                <span className="icon text-xl">☰</span>
              </button>

              <label className="relative flex-1 max-w-md">
                <span
                  className={`icon absolute left-3 top-1/2 -translate-y-1/2 ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  🔍
                </span>
                <input
                  className={`w-full border py-2 pl-10 pr-4 text-sm rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    isDarkMode
                      ? "border-gray-600 bg-gray-800 text-white placeholder:text-gray-400"
                      : "border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-500"
                  }`}
                  placeholder="Buscar"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
              </label>
            </div>
            <div className="flex items-center gap-2">
              <button className="hidden sm:flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden h-10 px-4 bg-white text-blue-600 border border-blue-600 text-sm font-bold leading-normal tracking-wide hover:bg-blue-50 transition-colors duration-200 rounded-md">
                <span className="truncate">Exportar</span>
              </button>
              <button className="flex min-w-[70px] sm:min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden h-10 px-3 sm:px-4 bg-blue-600 text-white text-sm font-bold leading-normal tracking-wide hover:bg-blue-700 transition-colors duration-200 rounded-md">
                <span className="truncate">Importar</span>
              </button>
            </div>
          </header>

          {/* Main Content */}
          <main
            className={`flex-1 p-4 md:p-6 border-l ${
              isDarkMode
                ? "bg-gray-900 border-gray-700"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="mx-auto max-w-7xl">
              <h2
                className={`text-2xl md:text-3xl font-bold tracking-tight ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Bases de Datos
              </h2>
              <div
                className={`mt-6 md:mt-8 overflow-x-auto border shadow-sm rounded-lg ${
                  isDarkMode
                    ? "border-gray-700 bg-gray-800"
                    : "border-gray-200 bg-white"
                }`}
              >
                <table className="w-full min-w-[640px]">
                  <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                    <tr>
                      <th
                        className={`px-4 md:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          isDarkMode ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        Nombre
                      </th>
                      <th
                        className={`hidden sm:table-cell px-4 md:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          isDarkMode ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        Última Modificación
                      </th>
                      <th
                        className={`px-4 md:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          isDarkMode ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        Tamaño
                      </th>
                      <th
                        className={`hidden lg:table-cell px-4 md:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          isDarkMode ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        Ruta
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y ${
                      isDarkMode ? "divide-gray-700" : "divide-gray-200"
                    }`}
                  >
                    {filteredDatabases.map((db, index) => (
                      <tr key={index}>
                        <td
                          className={`whitespace-nowrap px-4 md:px-6 py-4 text-sm font-medium ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center">
                            <span>{db.name}</span>
                            <span
                              className={`sm:hidden text-xs mt-1 ${
                                isDarkMode
                                  ? "text-gray-300"
                                  : "text-gray-600"
                              }`}
                            >
                              {db.lastModified}
                            </span>
                          </div>
                        </td>
                        <td
                          className={`hidden sm:table-cell whitespace-nowrap px-4 md:px-6 py-4 text-sm ${
                            isDarkMode ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {db.lastModified}
                        </td>
                        <td
                          className={`whitespace-nowrap px-4 md:px-6 py-4 text-sm ${
                            isDarkMode ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {db.size}
                        </td>
                        <td
                          className={`hidden lg:table-cell whitespace-nowrap px-4 md:px-6 py-4 text-sm ${
                            isDarkMode ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {db.path}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DatabaseDashboard;
