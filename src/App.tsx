import React, { lazy, Suspense } from "react"; // Importamos lazy y Suspense para la carga perezosa
import { Routes, Route } from "react-router-dom";
import { ThemeProvider, useTheme } from "./context";

// Importamos los componentes de página de forma perezosa (lazy loading)
// Esto significa que su código solo se cargará cuando sean necesarios
const DatabaseDashboard = lazy(() => import("./pages/dashboard/DatabaseDashboard"));
const Configuracion = lazy(() => import("./pages/settings/Configuracion"));
const Pagina = lazy(() => import("./pages/database/pagina"));
const AboutPage = lazy(() => import("./pages/home/about"));
const EditarFila = lazy(() => import("./pages/database/editar_fila"));
const InventarioDashboard = lazy(() => import("./pages/database/hub_tablas")); // Hub de tablas
const CreateRecordPage = lazy(() => import("./pages/create-record/CreateRecordPage"));
const DetallesConsultas = lazy(() => import("./pages/pagina-detalles/detalles-consultas"));

const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 50,
        padding: '12px',
        borderRadius: '50%',
        border: '1px solid var(--border-color)',
        cursor: 'pointer',
        background: 'var(--surface-color)',
        color: 'var(--text-color)',
        boxShadow: isDark ? 'var(--shadow)' : 'none',
        backdropFilter: isDark ? 'blur(10px)' : 'none',
        transition: 'all 0.2s ease'
      }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
};

function App() {
  return (
    <ThemeProvider>
      <ThemeToggle />
      {/* Suspense muestra un contenido de "fallback" (alternativo) mientras los componentes perezosos se cargan */}
      <Suspense
        fallback={
          <div className="flex justify-center items-center h-screen bg-gray-900 text-gray-100 text-xl">
            Cargando aplicación...
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<DatabaseDashboard />} />
          <Route path="/configuracion" element={<Configuracion />} />
          <Route path="/pagina" element={<Pagina />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/hub_tablas" element={<InventarioDashboard />} />
          <Route path="/editar_fila" element={<EditarFila />} />
          <Route path="/create-record" element={<CreateRecordPage />} />
          <Route path="/detalles-consultas" element={<DetallesConsultas />} />
        </Routes>
      </Suspense>
    </ThemeProvider>
  );
}

export default App;
