import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const EditarFila = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { rowId, tableName, dbName } = location.state || {};

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-400 hover:text-gray-300 transition-colors">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </button>
            <h1 className="text-3xl font-bold text-white">
              Editando fila {rowId !== undefined ? rowId + 1 : 'N/A'}
            </h1>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Hola</h2>
            <p className="text-gray-400">
              Información de fila: ID {rowId !== undefined ? rowId + 1 : 'N/A'}<br/>
              Tabla: {tableName || 'N/A'}<br/>
              Base de datos: {dbName || 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditarFila;