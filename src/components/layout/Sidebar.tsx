import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();

  return (
    <aside className="hidden md:flex h-full min-h-screen flex-col justify-between p-4 shadow-sm w-64 bg-white">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-center px-3 py-2">
          <div className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-lg md:text-xl lg:text-2xl">
            CD
          </div>
        </div>
        <nav className="flex flex-col gap-2 mt-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors duration-200 text-gray-600 hover:bg-gray-100 hover:text-gray-700">
            <span className="icon">🏠</span>
            <span className="text-sm font-medium">Inicio</span>
          </button>
          <button onClick={() => navigate("/pagina")} className="flex items-center gap-3 rounded-md px-3 py-2 text-gray-600 bg-gray-100">
            <span className="icon">⚙️</span>
            <span className="text-sm font-bold">Configuración</span>
          </button>
        </nav>
      </div>

    </aside>
  );
};

export default Sidebar;
