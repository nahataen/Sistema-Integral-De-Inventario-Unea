use rusqlite::Connection;
use std::collections::HashMap;
use tauri::State;

use crate::database_manager::AppState;
use crate::io_utils::{TableExport, rusqlite_to_json}; // Usa el módulo compartido

// Exporta la estructura y los datos de una tabla a un string JSON.
#[tauri::command]
pub fn export_table_to_json(
    state: State<AppState>,
    db_name: String,
    table_name: String,
) -> Result<String, String> {
    // Verificar que la base de datos existe antes de proceder
    let db_path = state.db_dir.join(format!("{}.db", db_name));
    let sqlite_path = state.db_dir.join(format!("{}.sqlite", db_name));

    let db_file = if db_path.exists() {
        db_path
    } else if sqlite_path.exists() {
        sqlite_path
    } else {
        return Err(format!("No se encontró la base de datos: {}", db_name));
    };

    let conn = Connection::open(&db_file).map_err(|e| e.to_string())?;

    // Obtiene la sentencia CREATE TABLE original.
    let create_statement: String = conn.query_row(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name=?1",
        &[&table_name],
        |row| row.get(0),
    ).map_err(|e| format!("No se pudo obtener la estructura de la tabla: {}", e))?;

    // Prepara la consulta para obtener todos los datos.
    let mut stmt = conn.prepare(&format!("SELECT * FROM \"{}\"", table_name))
        .map_err(|e| e.to_string())?;

    let column_names: Vec<String> = stmt.column_names().into_iter().map(|s| s.to_string()).collect();
    let mut rows = stmt.query([]).map_err(|e| e.to_string())?;
    let mut data = Vec::new();

    // Itera sobre cada fila y la convierte a un objeto JSON.
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let mut row_map = HashMap::new();
        for (i, col_name) in column_names.iter().enumerate() {
            let value = row.get_ref(i).unwrap().into();
            row_map.insert(col_name.clone(), rusqlite_to_json(value));
        }
        data.push(row_map);
    }

    let export_data = TableExport {
        table_name,
        create_statement,
        data,
    };

    // Serializa la estructura completa a un string JSON.
    serde_json::to_string_pretty(&export_data).map_err(|e| e.to_string())
}