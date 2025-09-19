import { BrowserRouter, Routes, Route } from "react-router-dom";
import DatabaseDashboard from "./pages/DatabaseDashboard";
import Configuracion from "./pages/Configuracion";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DatabaseDashboard />} />
        <Route path="/configuracion" element={<Configuracion />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
