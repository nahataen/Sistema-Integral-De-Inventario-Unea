import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DatabaseDashboard from "./pages/DatabaseDashboard";
import Configuracion from "./pages/Configuracion";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <DatabaseDashboard
              isDarkMode={isDarkMode}
              toggleTheme={toggleTheme}
            />
          }
        />
        <Route path="/configuracion" element={<Configuracion />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
