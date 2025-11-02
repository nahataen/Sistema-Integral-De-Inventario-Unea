import { lazy, Suspense } from "react"; // Importamos lazy y Suspense para la carga perezosa
import { Routes, Route } from "react-router-dom";

// Importamos los componentes de página de forma perezosa (lazy loading)
// Esto significa que su código solo se cargará cuando sean necesarios
const DatabaseDashboard = lazy(() => import("./pages/DatabaseDashboard"));
const Configuracion = lazy(() => import("./pages/Configuracion"));
const Pagina = lazy(() => import("./pages/pagina"));
const AboutPage = lazy(() => import("./pages/about"));
const EditarFila = lazy(() => import("./pages/editar_fila"));
const InventarioDashboard = lazy(() => import("./pages/hub_tablas")); // Hub de tablas

function App() {
  return (
    // Suspense muestra un contenido de "fallback" (alternativo) mientras los componentes perezosos se cargan
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
      </Routes>
    </Suspense>
  );
}

export default App;
