use rusqlite::Result;
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::database_manager::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct ColumnInfo {
    /// Nombre de la columna
    pub name: String,
    /// Tipo de la columna (TEXT, BLOB, INTEGER, etc.)
    pub type_: String,
}

/// Get column information for a table, including data types
#[tauri::command]
pub fn get_column_info(
    state: State<AppState>,
    db_name: String,
    table_name: String,
) -> Result<Vec<ColumnInfo>, String> {
    // Open database connection
    let db_path = state.db_dir.join(format!("{}.db", db_name));
    let sqlite_path = state.db_dir.join(format!("{}.sqlite", db_name));

    let db_file = if db_path.exists() {
        db_path
    } else if sqlite_path.exists() {
        sqlite_path
    } else {
        return Err(format!("Database not found: {}", db_name));
    };

    let conn = rusqlite::Connection::open(&db_file)
        .map_err(|e| format!("Error opening database: {}", e))?;

    // Get column information using PRAGMA table_info
    let mut pragma_stmt = conn.prepare(&format!("PRAGMA table_info(\"{}\")", table_name))
        .map_err(|e| format!("Error preparing PRAGMA query: {}", e))?;

    let columns_info: Vec<ColumnInfo> = pragma_stmt.query_map([], |row| {
        let name: String = row.get(1)?;
        let type_: String = row.get(2)?;
        Ok(ColumnInfo { name, type_ })
    })
    .map_err(|e| format!("Error querying table info: {}", e))?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| format!("Error collecting column info: {}", e))?;

    Ok(columns_info)
}