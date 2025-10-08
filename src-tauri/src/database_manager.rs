/// Módulo para gestión de bases de datos SQLite
///
/// Este módulo proporciona funcionalidades para:
/// - Listar bases de datos disponibles en el directorio de la aplicación
/// - Importar bases de datos desde ubicaciones externas
/// - Exportar bases de datos a ubicaciones elegidas por el usuario
/// - Eliminar bases de datos permanentemente
///
/// Todas las funciones están diseñadas para trabajar con archivos .db y .sqlite
/// y están expuestas como comandos Tauri para ser llamadas desde el frontend.

/* ============================================================================
        Importaciones necesarias para el manejo de bases de datos
   ============================================================================ */
use tauri::State;                    // Para acceder al estado de la aplicación
use rusqlite::Result;               // Para manejo de resultados de operaciones con SQLite
use serde::{Deserialize, Serialize}; // Para serializar/deserializar datos (JSON)
use std::fs;                        // Para operaciones de archivos (leer, escribir, copiar, eliminar)
use std::path::PathBuf;             // Para trabajar con rutas de archivos de forma segura
use std::process;                   // Para ejecutar comandos del sistema
use chrono::{TimeDelta, Utc};       // Para manejo de fechas y tiempos

/* ============================================================================
     Estructura que representa la información de una base de datos
             Esta estructura se envía al frontend como JSON
   ============================================================================ */
#[derive(Debug, Serialize, Deserialize)]
pub struct DatabaseInfo {
    /// Nombre de la base de datos (sin extensión)
    pub name: String,
    /// Estado actual: "En uso" o "Inactivo"
    pub status: String,
    /// Tamaño del archivo en formato legible (ej: "5.2 MB")
    pub size: String,
    /// Fecha de última modificación en formato YYYY-MM-DD
    pub last_mod: String,
    /// Ruta completa del archivo en el sistema
    pub path: String,
}

/* ============================================================================
   Estado global de la aplicación
   Mantiene información sobre el directorio de bases de datos y cuál está activa
   ============================================================================ */
#[derive(Debug)]
pub struct AppState {
    /// Directorio donde se almacenan las bases de datos
    pub db_dir: PathBuf,
    /// Nombre de la base de datos actualmente activa (puede ser None)
    pub active_db: Option<String>,
}

/* ============================================================================
   Lista todas las bases de datos disponibles en el directorio de la aplicación
   Esta función es llamada desde el frontend para mostrar la tabla de bases de datos
   ============================================================================ */
#[tauri::command]
pub fn list_databases(state: State<AppState>) -> Result<Vec<DatabaseInfo>, String> {
    // Vector para almacenar la información de todas las bases de datos encontradas
    let mut dbs = Vec::new();

    // Crear el directorio si no existe (primera ejecución)
    if !state.db_dir.exists() {
        fs::create_dir_all(&state.db_dir).map_err(|e| e.to_string())?;
    }

    // Leer todos los archivos en el directorio de bases de datos
    for entry in fs::read_dir(&state.db_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        // Verificar que el archivo tenga extensión .db o .sqlite
        if let Some(ext) = path.extension().and_then(|s| s.to_str()) {
            if ext == "db" || ext == "sqlite" {
                // Obtener metadatos del archivo (tamaño, fecha de modificación)
                let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;

                // Calcular tamaño en MB
                let size = (metadata.len() as f64 / 1_048_576.0).round(); // MB

                // Calcular tiempo transcurrido desde la última modificación
                let last_mod = metadata
                    .modified()
                    .map_err(|e| e.to_string())?
                    .elapsed()
                    .map_err(|e| e.to_string())?
                    .as_secs();

                // Determinar el estado: "En uso" si es la base de datos activa
                let status = if Some(path.file_name().unwrap().to_str().unwrap()) == state.active_db.as_deref() {
                    "En uso".to_string()
                } else {
                    "Inactivo".to_string()
                };

                // Crear estructura con toda la información de la base de datos
                dbs.push(DatabaseInfo {
                    name: path.file_stem().unwrap().to_str().unwrap().to_string(),
                    status,
                    size: format!("{:.0} MB", size),
                    last_mod: Utc::now()
                        .checked_sub_signed(TimeDelta::new(last_mod as i64, 0).expect("Invalid TimeDelta creation"))
                        .map_or_else(|| "N/A".to_string(), |d| d.format("%Y-%m-%d").to_string()),
                    path: path.to_string_lossy().to_string(),
                });
            }
        }
    }

    // Retornar la lista de bases de datos encontradas
    Ok(dbs)
}

/* ============================================================================
   Importa una base de datos desde una ubicación externa al directorio de la aplicación
   Esta función copia el archivo seleccionado por el usuario a la carpeta de bases de datos
   ============================================================================ */
#[tauri::command]
pub fn import_database(state: State<AppState>, filepath: String) -> Result<(), String> {
    // PASO 1: Validar que el archivo origen existe y es accesible
    let source_path = PathBuf::from(&filepath);
    if !source_path.exists() {
        return Err(format!("El archivo fuente no existe: {}", filepath));
    }

    if !source_path.is_file() {
        return Err(format!("La ruta especificada no es un archivo: {}", filepath));
    }

    // PASO 2: Extraer el nombre del archivo de forma segura
    let file_name = source_path
        .file_name()
        .ok_or_else(|| format!("Nombre de archivo inválido: {}", filepath))?
        .to_string_lossy()
        .to_string();

    // Log para debugging (aparece en la consola de la aplicación)
    println!("Intentando importar archivo: {} -> {}", filepath, file_name);

    // PASO 3: Crear el directorio de destino si no existe
    if !state.db_dir.exists() {
        fs::create_dir_all(&state.db_dir)
            .map_err(|e| format!("No se pudo crear el directorio de destino: {}", e))?;
    }

    // PASO 4: Construir la ruta completa de destino
    let new_path = state.db_dir.join(&file_name);

    // PASO 5: Verificar que no exista un archivo con el mismo nombre
    if new_path.exists() {
        return Err(format!("Ya existe un archivo con el nombre: {}", file_name));
    }

    // PASO 6: Copiar el archivo desde la ubicación origen al directorio de la aplicación
    fs::copy(&source_path, &new_path)
        .map_err(|e| format!("Error al copiar el archivo desde '{}' a '{}': {}", source_path.display(), new_path.display(), e))?;

    // Importación completada exitosamente
    Ok(())
}

/* ============================================================================
   Exporta una base de datos desde el directorio de la aplicación a una ubicación externa
   El usuario selecciona dónde guardar el archivo exportado
   ============================================================================ */
#[tauri::command]
pub fn export_database(state: State<AppState>, name: String, target_path: String) -> Result<(), String> {
    // INTENTAR AMBAS EXTENSIONES: Buscar el archivo con extensión .db o .sqlite
    let db_path = state.db_dir.join(format!("{}.db", name));
    let sqlite_path = state.db_dir.join(format!("{}.sqlite", name));

    // Determinar cuál archivo existe realmente
    let source_path = if db_path.exists() {
        db_path
    } else if sqlite_path.exists() {
        sqlite_path
    } else {
        return Err(format!("No se encontró la base de datos: {}", name));
    };

    // Copiar el archivo desde el directorio de la aplicación a la ubicación elegida por el usuario
    fs::copy(source_path, target_path).map_err(|e| format!("Error al exportar: {}", e))?;

    // Exportación completada exitosamente
    Ok(())
}

/*============================================================================
     Elimina permanentemente una base de datos del directorio de la aplicación
     El usuario debe confirmar la eliminación antes de proceder
  ============================================================================*/
#[tauri::command]
pub fn delete_database(state: State<AppState>, name: String, confirmed: bool) -> Result<(), String> {
    // Si no está confirmado, no proceder con la eliminación
    if !confirmed {
        return Err("Eliminación cancelada por el usuario".to_string());
    }

    // INTENTAR AMBAS EXTENSIONES: Buscar el archivo con extensión .db o .sqlite
    let db_path = state.db_dir.join(format!("{}.db", name));
    let sqlite_path = state.db_dir.join(format!("{}.sqlite", name));

    // Determinar cuál archivo existe realmente para eliminarlo
    let file_to_delete = if db_path.exists() {
        db_path
    } else if sqlite_path.exists() {
        sqlite_path
    } else {
        return Err(format!("No se encontró la base de datos: {}", name));
    };

    // Eliminar el archivo del sistema de archivos
    fs::remove_file(file_to_delete).map_err(|e| format!("Error al eliminar: {}", e))?;

    // Eliminación completada exitosamente
    Ok(())
}

/*============================================================================
      Abre el directorio que contiene una base de datos en el explorador de archivos
      Utiliza comandos específicos de cada plataforma para abrir el directorio
   ============================================================================*/
#[tauri::command]
pub fn open_directory(path: String) -> Result<(), String> {
    let dir_path = PathBuf::from(&path);

    // Verificar que el directorio existe
    if !dir_path.exists() {
        return Err(format!("El directorio no existe: {}", path));
    }

    if !dir_path.is_dir() {
        return Err(format!("La ruta no es un directorio: {}", path));
    }

    // Ejecutar el comando apropiado según la plataforma
    #[cfg(target_os = "windows")]
    {
        process::Command::new("cmd")
            .args(&["/c", "start", "", &dir_path.to_string_lossy()])
            .spawn()
            .map_err(|e| format!("Error al abrir el explorador de archivos: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        process::Command::new("open")
            .arg(&dir_path)
            .spawn()
            .map_err(|e| format!("Error al abrir Finder: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        process::Command::new("xdg-open")
            .arg(&dir_path)
            .spawn()
            .map_err(|e| format!("Error al abrir el administrador de archivos: {}", e))?;
    }

    Ok(())
}