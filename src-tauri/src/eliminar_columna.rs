
use rusqlite::{Connection, Result};
use tauri::State;

// Importar AppState para acceder al directorio de la base de datos.
use crate::database_manager::AppState;
/// Helper function to quote identifiers containing spaces or special characters for SQLite.
/// Identifiers are quoted with double quotes if they contain spaces or non-alphanumeric characters (except underscores).
fn quote_identifier(identifier: &str) -> String {
    if identifier.chars().any(|c| c.is_whitespace() || (!c.is_alphanumeric() && c != '_')) {
        format!("\"{}\"", identifier)
    } else {
        identifier.to_string()
    }
}

/// Lista de columnas protegidas que no pueden ser eliminadas.
const PROTECTED_COLUMNS: [&str; 3] = ["ID", "Zona", "Campus"];

/// Función expuesta a Tauri para eliminar una columna de una tabla específica.
///
/// # Argumentos
/// - `state`: El estado de la aplicación Tauri.
/// - `db_name`: El nombre de la base de datos a modificar.
/// - `table_name`: El nombre de la tabla de la que se eliminará la columna.
/// - `column_name`: El nombre de la columna a eliminar.
///
#[tauri::command]
pub fn delete_column(
    state: State<AppState>,
    db_name: String,
    table_name: String,
    column_name: String,
) -> Result<(), String> {
    // 1. Validar que la columna no esté protegida.
    // Se compara en mayúsculas para ser insensible a mayúsculas/minúsculas.
    if PROTECTED_COLUMNS.iter().any(|&protected| protected.eq_ignore_ascii_case(&column_name)) {
        return Err(format!("La columna '{}' está protegida y no se puede eliminar.", column_name));
    }

    // 2. Construir la ruta completa al archivo de la base de datos.
    let db_path = state.db_dir.join(format!("{}.db", db_name));
    let sqlite_path = state.db_dir.join(format!("{}.sqlite", db_name));

    let db_file = if db_path.exists() {
        db_path
    } else if sqlite_path.exists() {
        sqlite_path
    } else {
        return Err(format!("No se encontró la base de datos: {}", db_name));
    };

    // 3. Abrir la conexión con la base de datos.
    let conn = Connection::open(&db_file)
        .map_err(|e| format!("Error al abrir la base de datos: {}", e))?;

    // 4. Construir la sentencia SQL para eliminar la columna.
    //    SQLite introdujo DROP COLUMN en la versión 3.35.0. Esto podría fallar en versiones antiguas.
    let sql = format!(
        "ALTER TABLE \"{}\" DROP COLUMN {}",
        table_name,
        quote_identifier(&column_name)
    );

    // 5. Ejecutar la sentencia SQL.
    conn.execute(&sql, [])
        .map_err(|e| format!("Error al eliminar la columna '{}': {}. Es posible que su versión de SQLite no soporte DROP COLUMN.", column_name, e))?;

    Ok(())
}
