import { Routes, Route } from "react-router-dom";
import DatabaseDashboard from "./pages/DatabaseDashboard";
import Configuracion from "./pages/Configuracion";
import Pagina from "./pages/pagina";


function App() {
  return (
    <Routes>
      <Route path="/" element={<DatabaseDashboard />} />
      <Route path="/configuracion" element={<Configuracion />} />
      <Route path="/pagina" element={<Pagina />} />
    </Routes>
  );
}

export default App;
