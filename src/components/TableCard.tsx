import React, { useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import type { TableInfo } from "../pages/hub_tablas"; // Asegúrate de que esta ruta sea correcta

// Función auxiliar para obtener la ruta de la imagen, manejando la conversión de Tauri
// (Esto es necesario para que el navegador pueda mostrar las imágenes locales de la aplicación)
const getImageSrc = (imagePath: string | undefined, refreshKey: number) => {
  if (!imagePath) return null;
  // console.log("Ruta original:", imagePath); // Para depuración, puedes descomentar
  const converted = convertFileSrc(imagePath);
  // console.log("Ruta convertida:", converted); // Para depuración, puedes descomentar
  return `${converted}?v=${refreshKey}`;
};

// Definimos las propiedades que recibirá nuestro componente TableCard
interface TableCardProps {
  table: TableInfo; // Información de la tabla (nombre, ruta de imagen)
  dbName: string; // Nombre de la base de datos a la que pertenece la tabla
  uploadingImage: string | null; // Indica si se está subiendo una imagen para alguna tabla
  onEdit: (tableName: string) => void; // Función para manejar la edición de la tabla
  onDelete: (tableName: string) => void; // Función para manejar la eliminación de la tabla
  onUploadImage: (tableName: string) => Promise<void>; // Función para subir una imagen
  onDeleteImage: (tableName: string) => Promise<void>; // Función para eliminar la imagen
  refreshKey: number; // Clave para forzar el refresco de la caché de la imagen
}

const TableCard: React.FC<TableCardProps> = ({
  table,
  uploadingImage,
  onEdit,
  onDelete,
  onUploadImage,
  refreshKey, // Asegúrate de añadir refreshKey aquí
}) => {
  // Estado local para manejar si hubo un error al cargar la imagen
  // (Esto nos permite mostrar un placeholder si la imagen no se carga correctamente)
  const [imageLoadError, setImageLoadError] = useState(false);

  // Cada vez que la ruta de la imagen cambie, reiniciamos el estado de error
  // (Esto es útil si se sube una nueva imagen después de un error anterior)
  React.useEffect(() => {
    setImageLoadError(false);
  }, [table.image_path]);

  return (
    <div
      // Contenedor principal de la tarjeta, con estilos visuales y efecto al pasar el ratón
      className="bg-gray-800 rounded-lg shadow-sm overflow-hidden transform hover:-translate-y-1 transition-transform duration-200 border border-gray-700 cursor-pointer"
      onClick={() => onEdit(table.name)} // Al hacer clic en la tarjeta, se activa la edición de la tabla
    >
      {/* Área para mostrar la imagen o un placeholder si no hay imagen o hubo error */}
      <div className="w-full h-40 bg-gray-700 flex items-center justify-center text-gray-400 relative group overflow-hidden">
        {table.image_path && !imageLoadError ? (
          <>
            <img
              // Usamos getImageSrc para obtener una URL que el navegador pueda entender
              src={getImageSrc(table.image_path, refreshKey) || ""}
              alt={table.name}
              className="w-full h-full object-cover"
              // Si ocurre un error al cargar la imagen, activamos el estado de error
              onError={() => setImageLoadError(true)}
            // onLoad={() => console.log("Imagen cargada exitosamente:", table.name)} // Para depuración
            />
          </>
        ) : (
          // Contenido que se muestra si no hay imagen o hubo un error al cargarla
          <div className="text-center">
            {/* Icono genérico de imagen */}
            <svg
              className="w-12 h-12 mx-auto mb-2 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {/* Texto indicando si no hay imagen o hubo un error */}
            <p className="text-sm">
              {imageLoadError ? "Error al cargar" : "Sin imagen"}
            </p>
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Nombre de la tabla */}
        <h3 className="text-lg font-bold text-gray-100 mb-3">{table.name}</h3>

        {/* Botón para subir o cambiar imagen */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Evita que se active el clic de la tarjeta
            onUploadImage(table.name); // Llama a la función para subir imagen
          }}
          // Deshabilita el botón si ya se está subiendo una imagen para esta tabla
          disabled={uploadingImage === table.name}
          className="w-full mb-3 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {uploadingImage === table.name ? (
            // Si se está subiendo, muestra un spinner y texto "Subiendo..."
            <>
              {/* Spinner de carga */}
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Subiendo...
            </>
          ) : (
            // Si no se está subiendo, muestra el icono de imagen y el texto apropiado
            <>
              {/* Icono de imagen */}
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {/* Texto cambia si ya hay una imagen */}
              {table.image_path ? "Cambiar imagen" : "Subir imagen"}
            </>
          )}
        </button>

        {/* Contenedor de botones de acción (Editar y Borrar) */}
        <div className="flex gap-3 text-sm font-semibold">
          {/* Botón Editar */}
          <button
            onClick={(e) => {
              e.stopPropagation(); // Evita que se active el clic de la tarjeta
              onEdit(table.name); // Llama a la función para editar la tabla
            }}
            className="flex-1 text-blue-400 hover:text-blue-300 hover:underline"
          >
            Editar
          </button>
          {/* Botón Borrar */}
          <button
            onClick={(e) => {
              e.stopPropagation(); // Evita que se active el clic de la tarjeta
              onDelete(table.name); // Llama a la función para borrar la tabla
            }}
            className="flex-1 text-red-400 hover:text-red-300 hover:underline"
          >
            Borrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableCard;
