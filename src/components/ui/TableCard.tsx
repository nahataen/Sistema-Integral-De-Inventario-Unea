import React, { useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import type { TableInfo } from "../../pages/database/hub_tablas";

// Función auxiliar para obtener la ruta de la imagen, manejando la conversión de Tauri
const getImageSrc = (imagePath: string | undefined, refreshKey: number) => {
  if (!imagePath) return null;
  const converted = convertFileSrc(imagePath);
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
  onExport: (tableName: string) => Promise<void>; // Función para exportar la tabla
  refreshKey: number; // Clave para forzar el refresco de la caché de la imagen
}

const TableCard: React.FC<TableCardProps> = ({
  table,
  uploadingImage,
  onEdit,
  onDelete,
  onUploadImage,
  onExport,
  refreshKey,
}) => {
  // Estado local para manejar si hubo un error al cargar la imagen
  const [imageLoadError, setImageLoadError] = useState(false);

  // Cada vez que la ruta de la imagen cambie, reiniciamos el estado de error
  React.useEffect(() => {
    setImageLoadError(false);
  }, [table.image_path]);

  return (
    <div
      // Contenedor principal de la tarjeta con estilo glassmorphism
      className="glass-card"
      style={{
        borderRadius: '0.75rem',
        overflow: 'hidden',
        transform: 'translateY(0)',
        transition: 'all 0.2s ease',
        cursor: 'pointer'
      }}
      onClick={() => onEdit(table.name)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Área para mostrar la imagen o un placeholder */}
      <div style={{
        width: '100%',
        height: '160px',
        background: 'var(--secondary-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-secondary-color)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {table.image_path && !imageLoadError ? (
          <img
            src={getImageSrc(table.image_path, refreshKey) || ""}
            alt={table.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={() => setImageLoadError(true)}
          />
        ) : (
          <div style={{ textAlign: 'center' }}>
            <svg
              style={{
                width: '48px',
                height: '48px',
                margin: '0 auto 8px',
                opacity: 0.5
              }}
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
            <p style={{ fontSize: '14px', margin: 0 }}>
              {imageLoadError ? "Error al cargar" : "Sin imagen"}
            </p>
          </div>
        )}
      </div>

      <div style={{ padding: '16px' }}>
        {/* Nombre de la tabla */}
        <h3 style={{
          fontSize: '18px',
          fontWeight: '700',
          color: 'var(--text-color)',
          marginBottom: '12px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%'
        }}>
          {table.name}
        </h3>

        {/* Botón para subir o cambiar imagen */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUploadImage(table.name);
          }}
          disabled={uploadingImage === table.name}
          className="glass-button"
          style={{
            width: '100%',
            marginBottom: '12px',
            padding: '8px 12px',
            background: uploadingImage === table.name ? 'var(--text-secondary-color)' : 'var(--primary-color)',
            color: uploadingImage === table.name ? 'var(--text-color)' : 'white',
            fontSize: '14px',
            fontWeight: '600',
            borderRadius: '8px',
            cursor: uploadingImage === table.name ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            if (uploadingImage !== table.name) {
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (uploadingImage !== table.name) {
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          {uploadingImage === table.name ? (
            <>
              <svg
                style={{
                  animation: 'spin 1s linear infinite',
                  width: '16px',
                  height: '16px'
                }}
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  style={{ opacity: 0.25 }}
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  style={{ opacity: 0.75 }}
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Subiendo...
            </>
          ) : (
            <>
              <svg
                style={{ width: '16px', height: '16px' }}
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
              {table.image_path ? "Cambiar imagen" : "Subir imagen"}
            </>
          )}
        </button>

        {/* Contenedor de botones de acción */}
        <div style={{
          display: 'flex',
          gap: '12px',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(table.name);
            }}
            style={{
              flex: 1,
              color: 'var(--primary-color)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textDecoration: 'underline'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--accent-color)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--primary-color)';
            }}
          >
            Editar
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExport(table.name);
            }}
            style={{
              flex: 1,
              color: 'var(--success-color)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textDecoration: 'underline'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--success-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--success-color)';
            }}
          >
            Exportar
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(table.name);
            }}
            style={{
              flex: 1,
              color: 'var(--danger-color)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textDecoration: 'underline'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--danger-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--danger-color)';
            }}
          >
            Borrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableCard;
