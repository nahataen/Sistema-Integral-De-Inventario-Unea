use rusqlite::Result;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::State;
use crate::database_manager::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct TableInfo {
    pub name: String,
    pub image_path: Option<String>,
}

// Función auxiliar para normalizar rutas (compatible Windows y macOS)
fn normalize_path(path: PathBuf) -> String {
    // En Windows, eliminar el prefijo \\?\
    let path_str = path.to_string_lossy().to_string();

    #[cfg(target_os = "windows")]
    {
        path_str.replace("\\\\?\\", "").replace("\\", "/")
    }

    #[cfg(not(target_os = "windows"))]
    {
        path_str
    }
}

// Función auxiliar para obtener la ruta de la carpeta de imágenes
fn get_images_dir(state: &State<AppState>, db_name: &str) -> PathBuf {
    state.db_dir.join("images").join(db_name)
}

// Función auxiliar para obtener la ruta de imagen de una tabla
fn get_table_image_path(state: &State<AppState>, db_name: &str, table_name: &str) -> Option<String> {
    let images_dir = get_images_dir(state, db_name);

    // Buscar archivos con el nombre de la tabla y extensiones comunes
    let extensions = ["jpg", "jpeg", "png", "gif", "webp"];

    for ext in &extensions {
        let image_path = images_dir.join(format!("{}.{}", table_name, ext));
        if image_path.exists() {
            // Convertir a ruta absoluta y normalizarla
            if let Ok(absolute_path) = image_path.canonicalize() {
                return Some(normalize_path(absolute_path));
            }
        }
    }

    None
}

#[tauri::command]
pub fn create_table(state: State<AppState>, db_name: String, table_name: String) -> Result<(), String> {
    let db_path = state.db_dir.join(format!("{}.db", db_name));
    let sqlite_path = state.db_dir.join(format!("{}.sqlite", db_name));

    let db_file = if db_path.exists() {
        db_path
    } else if sqlite_path.exists() {
        sqlite_path
    } else {
        return Err(format!("No se encontró la base de datos: {}", db_name));
    };

    let conn = rusqlite::Connection::open(&db_file)
        .map_err(|e| format!("Error al abrir la base de datos: {}", e))?;

    // Check if table already exists
    let query = "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?";
    let mut stmt = conn.prepare(query)
        .map_err(|e| format!("Error al preparar la consulta: {}", e))?;
    let count: i64 = stmt.query_row([table_name.clone()], |row| row.get(0))
        .map_err(|e| format!("Error al ejecutar la consulta: {}", e))?;
    if count > 0 {
        return Err(format!("La tabla '{}' ya existe. Por favor, utilice otro nombre.", table_name));
    }

    // Create table with a basic structure: id as TEXT PRIMARY KEY
    let sql = format!("CREATE TABLE \"{}\" (id TEXT PRIMARY KEY)", table_name);
    conn.execute(&sql, [])
        .map_err(|e| format!("Error al crear la tabla: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn list_tables(state: State<AppState>, db_name: String) -> Result<Vec<TableInfo>, String> {
    let db_path = state.db_dir.join(format!("{}.db", db_name));
    let sqlite_path = state.db_dir.join(format!("{}.sqlite", db_name));

    let db_file = if db_path.exists() {
        db_path
    } else if sqlite_path.exists() {
        sqlite_path
    } else {
        return Err(format!("No se encontró la base de datos: {}", db_name));
    };

    let conn = rusqlite::Connection::open(&db_file)
        .map_err(|e| format!("Error al abrir la base de datos: {}", e))?;

    let mut stmt = conn
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        .map_err(|e| format!("Error al preparar la consulta: {}", e))?;

    let table_names = stmt
        .query_map([], |row| row.get(0))
        .map_err(|e| format!("Error al ejecutar la consulta: {}", e))?;

    let mut tables = Vec::new();

    for name_result in table_names {
        let name: String =
            name_result.map_err(|e| format!("Error al obtener nombre de tabla: {}", e))?;

        let image_path = get_table_image_path(&state, &db_name, &name);

        tables.push(TableInfo { name, image_path });
    }

    Ok(tables)
}

#[tauri::command]
pub fn delete_table(
    state: State<AppState>,
    db_name: String,
    table_name: String,
) -> Result<(), String> {
    let db_path = state.db_dir.join(format!("{}.db", db_name));
    let sqlite_path = state.db_dir.join(format!("{}.sqlite", db_name));

    let db_file = if db_path.exists() {
        db_path
    } else if sqlite_path.exists() {
        sqlite_path
    } else {
        return Err(format!("No se encontró la base de datos: {}", db_name));
    };

    let conn = rusqlite::Connection::open(&db_file)
        .map_err(|e| format!("Error al abrir la base de datos: {}", e))?;

    conn.execute(&format!("DROP TABLE IF EXISTS \"{}\"", table_name), [])
        .map_err(|e| format!("Error al eliminar la tabla: {}", e))?;

    // Eliminar imagen asociada si existe
    let images_dir = get_images_dir(&state, &db_name);
    let extensions = ["jpg", "jpeg", "png", "gif", "webp"];

    for ext in &extensions {
        let image_path = images_dir.join(format!("{}.{}", table_name, ext));
        if image_path.exists() {
            let _ = fs::remove_file(image_path);
        }
    }

    Ok(())
}

#[tauri::command]
pub fn upload_table_image(
    state: State<AppState>,
    db_name: String,
    table_name: String,
    image_path: String,
) -> Result<String, String> {
    // Crear el directorio de imágenes si no existe
    let images_dir = get_images_dir(&state, &db_name);
    fs::create_dir_all(&images_dir)
        .map_err(|e| format!("Error al crear directorio de imágenes: {}", e))?;

    // Obtener la extensión del archivo original
    let source_path = PathBuf::from(&image_path);
    let extension = source_path
        .extension()
        .and_then(|e| e.to_str())
        .ok_or("No se pudo determinar la extensión del archivo")?;

    // Eliminar imagen anterior si existe
    let extensions = ["jpg", "jpeg", "png", "gif", "webp"];
    for ext in &extensions {
        let old_image = images_dir.join(format!("{}.{}", table_name, ext));
        if old_image.exists() {
            let _ = fs::remove_file(old_image);
        }
    }

    // Copiar la nueva imagen
    let dest_path = images_dir.join(format!("{}.{}", table_name, extension));
    fs::copy(&source_path, &dest_path)
        .map_err(|e| format!("Error al copiar la imagen: {}", e))?;

    // Retornar ruta absoluta normalizada
    let absolute_path = dest_path.canonicalize()
        .map_err(|e| format!("Error al obtener ruta absoluta: {}", e))?;

    Ok(normalize_path(absolute_path))
}

#[tauri::command]
pub fn delete_table_image(
    state: State<AppState>,
    db_name: String,
    table_name: String,
) -> Result<(), String> {
    let images_dir = get_images_dir(&state, &db_name);
    let extensions = ["jpg", "jpeg", "png", "gif", "webp"];

    let mut deleted = false;
    for ext in &extensions {
        let image_path = images_dir.join(format!("{}.{}", table_name, ext));
        if image_path.exists() {
            fs::remove_file(image_path)
                .map_err(|e| format!("Error al eliminar la imagen: {}", e))?;
            deleted = true;
        }
    }

    if !deleted {
        return Err("No se encontró ninguna imagen para eliminar".to_string());
    }

    Ok(())
}