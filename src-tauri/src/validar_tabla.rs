use rusqlite::Connection;
use tauri::State;
use crate::database_manager::AppState;

/// Check if a table with the given name exists in the database
#[tauri::command]
pub fn check_table_exists(
    state: State<AppState>,
    db_name: String,
    table_name: String,
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

    // Query sqlite_master to check if table exists
    let query = "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?";
    let mut stmt = conn.prepare(query)
        .map_err(|e| format!("Error preparing query: {}", e))?;

    let count: i64 = stmt.query_row([table_name], |row| row.get(0))
        .map_err(|e| format!("Error executing query: {}", e))?;

    Ok(count > 0)
}