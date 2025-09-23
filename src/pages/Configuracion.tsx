import { useNavigate } from "react-router-dom";
const Configuracion = () => {
const navigate = useNavigate();
return (
    <div className="flex h-screen flex-col items-center justify-center bg-white">
      <h1 className="text-2xl font-bold text-gray-900">
        Configuración
      </h1>
      <button
        onClick={() => navigate("/")}
        className="mt-4 rounded-md bg-green-600 px-4 py-2 text-white transition-colors duration-200 hover:bg-blue-700"
      >
        Regresar al Dashboard
      </button>
    </div>
  );
};
export default Configuracion;
