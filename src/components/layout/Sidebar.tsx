import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();// manda a llamar las rutas definidas en App.tsx

  return (
    <aside className="hidden md:flex h-full min-h-screen flex-col justify-between p-4 shadow-sm w-64 bg-gray-900 text-white">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-center px-3 py-2">
          <div className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-lg md:text-xl lg:text-2xl">
            IMG
          </div>
        </div>

        <nav className="flex flex-col gap-2 mt-4">
          <button
            onClick={() => navigate('/')}
            className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium
             text-gray-100 bg-gray-800/60 hover:bg-gray-700/90
             transition-all duration-200 ease-out
             focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900
             active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Ir a Inicio"
          >
            <span className="icon text-lg transition-transform duration-200 group-hover:scale-110">🏠</span>
            <span className="text-sm">Inicio</span>
          </button>


          <button  className="flex items-center gap-3 rounded-md px-3 py-2 text-gray-600 bg-gray-100">
            <span className="icon">📊</span>
            <span className="text-sm font-bold">Base de datos</span>
          </button>

          <button
            onClick={() => navigate('/about')}
            className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium
             text-gray-100 bg-gray-800/60 hover:bg-gray-700/90
             transition-all duration-200 ease-out
             focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900
             active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Acerca del sistema"
          >
            <span className="icon text-lg transition-transform duration-200 group-hover:scale-110">ℹ️</span>
            <span className="text-sm">Acerca de</span>
          </button>

        </nav>
      </div>

    </aside>
  );
};

export default Sidebar;
