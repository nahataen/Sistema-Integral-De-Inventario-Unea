// ==========================================
// SECCIÓN DE IMPORTACIONES
// ==========================================

import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import DatabaseTable from "../components/ui/DatabaseTable";
import type { Database } from "./types";
import { invoke } from "@tauri-apps/api/tauri";

// ==========================================
// DEFINICIÓN DEL COMPONENTE
// ==========================================

const DatabaseDashboard = () => {
  // ==========================================
  // VARIABLES DE ESTADO
  // ==========================================

  const [searchValue, setSearchValue] = useState("");
  const [databases, setDatabases] = useState<Database[]>([]);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // EFECTOS DE REACT
  // ==========================================

  useEffect(() => {
    // @ts-ignore
    window.refreshDatabases = loadDatabases;
  }, []);

  // ==========================================
  // FUNCIONES DEL COMPONENTE
  // ==========================================

  // FUNCIÓN MEJORADA PARA FORMATEAR TAMAÑOS
  const formatFileSize = (bytes: any): string => {
    // DEPURACIÓN: Ver qué tipo y valor recibimos
    console.log("formatFileSize input:", typeof bytes, bytes);

    // Manejar casos especiales y valores inválidos
    if (bytes === null || bytes === undefined || bytes === '') {
      console.warn("Size es null/undefined/vacío, usando '-'");
      return '-';
    }

    // Si ya es un string formateado (ej: "10MB"), devolverlo directamente
    if (typeof bytes === 'string') {
      console.log("Size ya es string:", bytes);

      // Si es un string numérico, convertirlo
      const numValue = parseFloat(bytes);
      if (!isNaN(numValue) && /\d/.test(bytes)) {
        console.log("String convertible a número:", numValue);
        return formatFileSize(numValue);
      }

      return bytes; // Ya está formateado
    }

    // Si no es un número válido
    if (typeof bytes !== 'number' || isNaN(bytes)) {
      console.warn("Size no es un número válido:", bytes);
      return 'N/A';
    }

    // Convertir bytes a formato legible
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    const result = `${size.toFixed(1)} ${units[unitIndex]}`;
    console.log("Size formateado:", result);
    return result;
  };

  // FUNCIONE PARA DETERMINAR COLOR SEGÚN TAMAÑO
  const getSizeColor = (bytes: any): string => {
    if (typeof bytes !== 'number' || isNaN(bytes)) return 'text-slate-400';

    if (bytes < 1024 * 1024) return 'text-blue-400'; // < 1MB
    if (bytes < 100 * 1024 * 1024) return 'text-yellow-400'; // < 100MB
    return 'text-red-400'; // >= 100MB
  };

  const loadDatabases = async () => {
    try {
      setLoading(true);
      const databasesList = await invoke<Database[]>("list_databases");

      // DEPURACIÓN: Ver la estructura exacta de los datos
      console.log("Datos recibidos del backend:", databasesList);

      // Verificar si existe la propiedad size y sus valores
      databasesList.forEach((db, index) => {
        console.log(`DB ${index}:`, {
          name: db.name,
          size: db.size,
          sizeType: typeof db.size,
          allKeys: Object.keys(db)
        });
      });

      setDatabases(databasesList);
    } catch (error) {
      console.error("Error al cargar bases de datos:", error);
      setDatabases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabases();
  }, []);

  // ==========================================
  // LÓGICA DE FILTRADO
  // ==========================================

  const filteredDatabases = databases.filter(db =>
    db.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  // ==========================================
  // PREPARACIÓN DE DATOS CON FORMATO DE TAMAÑO
  // ==========================================

  const databasesWithFormattedSize = filteredDatabases.map((db, index) => {
    const formatted = formatFileSize(db.size);
    const color = getSizeColor(db.size);

    console.log(`DB ${db.name} - Final: size=${db.size}, display=${formatted}, color=${color}`);

    return {
      ...db,
      displaySize: formatted,
      sizeColor: color
    };
  });

  // ==========================================
  // SECCIÓN DE RENDERIZADO
  // ==========================================

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Sidebar */}
      <div className="relative z-20">
        <Sidebar />
      </div>

      {/* Contenedor principal */}
      <div className="flex-1 flex flex-col bg-slate-900/60 backdrop-blur-sm">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-slate-700/30 bg-slate-900/80 backdrop-blur-md">
          <Header
            searchValue={searchValue}
            setSearchValue={setSearchValue}
          />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Card container */}
            <div className="rounded-2xl bg-slate-800/50 backdrop-blur-md border border-slate-700/30 shadow-2xl transition-all duration-300 hover:shadow-cyan-500/10">
              {loading ? (
                /* Estado de carga */
                <div className="flex flex-col items-center justify-center py-20 px-6">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-slate-600 border-t-cyan-400 animate-spin"></div>
                    <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-t-indigo-400 animate-spin" style={{ animationDuration: '1.5s' }}></div>
                  </div>
                  <p className="mt-4 text-slate-300 font-medium">Cargando bases de datos...</p>
                </div>
              ) : databasesWithFormattedSize.length > 0 ? (
                /* Tabla */
                <div className="p-4 lg:p-6">
                  <DatabaseTable
                    databases={databasesWithFormattedSize}
                    onRefresh={loadDatabases}
                  />
                </div>
              ) : (
                /* Estado vacío */
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-200 mb-1">No se encontraron bases de datos</h3>
                  <p className="text-slate-400 text-sm">Intenta ajustar tu búsqueda o crea una nueva base de datos</p>
                </div>
              )}
            </div>

            {/* Footer informativo */}
            <div className="flex items-center justify-between text-slate-400 text-sm">
              <p>{databasesWithFormattedSize.length} {databasesWithFormattedSize.length === 1 ? 'base de datos' : 'bases de datos'} encontrada{databasesWithFormattedSize.length === 1 ? '' : 's'}</p>
              <p className="text-slate-500">Total: {formatFileSize(databases.reduce((acc, db) => {
                const size = typeof db.size === 'number' && !isNaN(db.size) ? db.size : 0;
                return acc + size;
              }, 0))}</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DatabaseDashboard;