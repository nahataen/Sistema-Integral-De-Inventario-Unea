/// =========================================================================
/// Módulo: Gestión de Bases de Datos SQLite
///
/// Funcionalidades:
/// - Listar bases de datos disponibles en el directorio de la aplicación
/// - Importar bases de datos desde ubicaciones externas
/// - Exportar bases de datos a ubicaciones elegidas por el usuario
/// - Eliminar bases de datos permanentemente
/// - Abrir el directorio de bases de datos en el explorador nativo
///
/// Todas las funciones trabajan con archivos `.db` y `.sqlite`
/// y están expuestas como comandos Tauri para el frontend.
/// =========================================================================

/* =========================================================================
   Importaciones necesarias
   ========================================================================= */
use tauri::State;                     // Acceso al estado global de la app
use rusqlite::Result;                  // Manejo de resultados de SQLite
use serde::{Deserialize, Serialize};   // Serialización / deserialización JSON
use std::fs;                           // Operaciones con archivos
use std::path::PathBuf;                // Manejo seguro de rutas
use std::process::Command;             // Ejecución de comandos del sistema (CORREGIDO)
use chrono::{TimeDelta, Utc};          // Manejo de fechas y tiempos

/* =========================================================================
   Estructuras de datos
   ========================================================================= */

/// Información de una base de datos que se envía al frontend en formato JSON
#[derive(Debug, Serialize, Deserialize)]
pub struct DatabaseInfo {
    /// Nombre de la base de datos (sin extensión)
    pub name: String,
    /// Estado actual: "En uso" o "Inactivo"
    pub status: String,
    /// Tamaño del archivo formateado automáticamente (ej: "512 KB", "10 MB")
    pub size: String,
    /// Fecha de última modificación (YYYY-MM-DD)
    pub last_mod: String,
    /// Ruta completa del archivo
    pub path: String,
}

/// Estado global de la aplicación
#[derive(Debug)]
pub struct AppState {
    /// Directorio donde se almacenan las bases de datos
    pub db_dir: PathBuf,
    /// Base de datos actualmente activa
    pub active_db: Option<String>,
}

/* =========================================================================
   Funciones auxiliares (NUEVA - para corregir tamaños)
   ========================================================================= */

/// Formatea bytes a unidad legible para humanos con precisión inteligente
fn format_file_size(bytes: u64) -> String {
    const UNITS: &[&str] = &["B", "KB", "MB", "GB", "TB"];
    let mut size = bytes as f64;
    let mut unit_index = 0;

    // Convertir a la unidad apropiada
    while size >= 1024.0 && unit_index < UNITS.len() - 1 {
        size /= 1024.0;
        unit_index += 1;
    }

    // Determinar precisión según el tamaño
    let precision = match unit_index {
        0 => 0, // Bytes: sin decimales
        _ if size < 10.0 => 2, // < 10: 2 decimales
        _ => 1, // ≥ 10: 1 decimal
    };

    format!("{:.prec$} {}", size, UNITS[unit_index], prec = precision)
}

/* =========================================================================
   Funciones expuestas como comandos Tauri
   ========================================================================= */

/// Listar todas las bases de datos disponibles
#[tauri::command]
pub fn list_databases(state: State<AppState>) -> Result<Vec<DatabaseInfo>, String> {
    let mut dbs = Vec::new();

    // Crear directorio si no existe
    if !state.db_dir.exists() {
        fs::create_dir_all(&state.db_dir).map_err(|e| e.to_string())?;
    }

    // Iterar sobre los archivos en el directorio
    for entry in fs::read_dir(&state.db_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        // Solo archivos con extensión .db o .sqlite
        if let Some(ext) = path.extension().and_then(|s| s.to_str()) {
            if ext == "db" || ext == "sqlite" {
                let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
                let file_size_bytes = metadata.len();

                // Calcular fecha de modificación
                let modified_duration = metadata.modified()
                    .map_err(|e| e.to_string())?
                    .elapsed()
                    .map_err(|e| e.to_string())?
                    .as_secs();

                // Determinar estado
                let file_name = path.file_name().unwrap().to_str().unwrap();
                let status = if Some(file_name) == state.active_db.as_deref() {
                    "En uso".to_string()
                } else {
                    "Inactivo".to_string()
                };

                dbs.push(DatabaseInfo {
                    name: path.file_stem().unwrap().to_str().unwrap().to_string(),
                    status,
                    size: format_file_size(file_size_bytes), // ✅ CORREGIDO: formateo inteligente
                    last_mod: Utc::now()
                        .checked_sub_signed(TimeDelta::seconds(modified_duration as i64))
                        .map_or_else(|| "N/A".to_string(), |d| d.format("%Y-%m-%d").to_string()),
                    path: path.to_string_lossy().to_string(),
                });
            }
        }
    }

    Ok(dbs)
}

/// Importar una base de datos desde una ubicación externa
#[tauri::command]
pub fn import_database(state: State<AppState>, filepath: String) -> Result<(), String> {
    let source_path = PathBuf::from(&filepath);

    // Validación de existencia y tipo de archivo
    if !source_path.exists() {
        return Err(format!("El archivo fuente no existe: {}", filepath));
    }
    if !source_path.is_file() {
        return Err(format!("La ruta especificada no es un archivo: {}", filepath));
    }

    let file_name = source_path.file_name()
        .ok_or_else(|| format!("Nombre de archivo inválido: {}", filepath))?
        .to_string_lossy()
        .to_string();

    println!("Intentando importar archivo: {} -> {}", filepath, file_name);

    if !state.db_dir.exists() {
        fs::create_dir_all(&state.db_dir).map_err(|e| format!("No se pudo crear el directorio de destino: {}", e))?;
    }

    let new_path = state.db_dir.join(&file_name);
    if new_path.exists() {
        return Err(format!("Ya existe un archivo con el nombre: {}", file_name));
    }

    fs::copy(&source_path, &new_path)
        .map_err(|e| format!("Error al copiar el archivo desde '{}' a '{}': {}", source_path.display(), new_path.display(), e))?;

    Ok(())
}

/// Exportar una base de datos a una ubicación externa
#[tauri::command]
pub fn export_database(state: State<AppState>, name: String, target_path: String) -> Result<(), String> {
    let db_path = state.db_dir.join(format!("{}.db", name));
    let sqlite_path = state.db_dir.join(format!("{}.sqlite", name));
    let source_path = if db_path.exists() { db_path } else if sqlite_path.exists() { sqlite_path }
                      else { return Err(format!("No se encontró la base de datos: {}", name)); };

    fs::copy(source_path, target_path).map_err(|e| format!("Error al exportar: {}", e))?;
    Ok(())
}

/// Eliminar permanentemente una base de datos
#[tauri::command]
pub fn delete_database(state: State<AppState>, name: String, confirmed: bool) -> Result<(), String> {
    if !confirmed {
        return Err("Eliminación cancelada por el usuario".to_string());
    }

    let db_path = state.db_dir.join(format!("{}.db", name));
    let sqlite_path = state.db_dir.join(format!("{}.sqlite", name));
    let file_to_delete = if db_path.exists() { db_path } else if sqlite_path.exists() { sqlite_path }
                         else { return Err(format!("No se encontró la base de datos: {}", name)); };

    fs::remove_file(file_to_delete).map_err(|e| format!("Error al eliminar: {}", e))?;
    Ok(())
}


/// Abre el directorio que contiene una base de datos en el explorador de archivos
#[tauri::command]
pub fn open_directory(path: String) -> Result<(), String> {
    let dir_path = PathBuf::from(&path);

    if !dir_path.exists() {
        return Err(format!("El directorio no existe: {}", path));
    }
    if !dir_path.is_dir() {
        return Err(format!("La ruta no es un directorio: {}", path));
    }

    #[cfg(target_os = "windows")]
    Command::new("cmd")
        .args(&["/c", "start", "", &dir_path.to_string_lossy()])
        .spawn()
        .map_err(|e| format!("Error al abrir el explorador de archivos: {}", e))?;

    #[cfg(target_os = "macos")]
    Command::new("open")
        .arg(&dir_path)
        .spawn()
        .map_err(|e| format!("Error al abrir Finder: {}", e))?;

    #[cfg(target_os = "linux")]
    Command::new("xdg-open")
        .arg(&dir_path)
        .spawn()
        .map_err(|e| format!("Error al abrir el administrador de archivos: {}", e))?;

    Ok(())
}