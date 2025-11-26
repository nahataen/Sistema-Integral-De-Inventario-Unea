use rusqlite::Connection;
use tauri::State;
use crate::database_manager::AppState;

/// Check if a column with the given name exists in the specified table
#[tauri::command]
pub fn check_column_exists(
    state: State<AppState>,
    db_name: String,
    table_name: String,
    column_name: String,
) -> Result<bool, String> {
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

    let conn = Connection::open(&db_file)
        .map_err(|e| format!("Error opening database: {}", e))?;

    // Use PRAGMA table_info to get column information
    let query = format!("PRAGMA table_info(\"{}\")", table_name);
    let mut stmt = conn.prepare(&query)
        .map_err(|e| format!("Error preparing query: {}", e))?;

    let columns = stmt.query_map([], |row| {
        let name: String = row.get(1)?;
        Ok(name)
    })
    .map_err(|e| format!("Error querying table info: {}", e))?
    .collect::<Result<Vec<String>, _>>()
    .map_err(|e| format!("Error collecting columns: {}", e))?;

    // Check if the column exists
    Ok(columns.contains(&column_name))
}