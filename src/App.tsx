import { Routes, Route } from "react-router-dom";
import DatabaseDashboard from "./pages/DatabaseDashboard";
import Configuracion from "./pages/Configuracion";
import Pagina from "./pages/pagina";
import AboutPage from "./pages/about";
//hub tablas
import InventarioDashboard from "./pages/hub_tablas";
function App() {
  return (
    <Routes>
      <Route path="/" element={<DatabaseDashboard />} />
      <Route path="/configuracion" element={<Configuracion />} />
      <Route path="/pagina" element={<Pagina />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/hub_tablas" element={<InventarioDashboard />} />
    </Routes>
  );
}

export default App;
