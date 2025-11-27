//se consulta la tabla seleccionada desde edit en el archivo hub_tablas.rs
use rusqlite::Result;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use tauri::State;
use base64::{Engine as _, engine::general_purpose};

use crate::database_manager::AppState;

/// Helper function to properly quote SQL identifiers (table names, column names)
/// Handles identifiers with spaces or special characters by wrapping in double quotes
/// and escaping any existing double quotes by doubling them
fn quote_identifier(identifier: &str) -> String {
    format!("\"{}\"", identifier.replace("\"", "\"\""))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TableData {
    /// Nombre de la tabla
    pub table_name: String,
    /// Columnas de la tabla
    pub columns: Vec<String>,
    /// Filas de datos
    pub rows: Vec<HashMap<String, Value>>,
}

#[tauri::command]
pub fn consulta_tabla(state: State<AppState>, db_name: String, table_name: String) -> Result<TableData, String> {
    // Determinar la ruta del archivo de base de datos
    let db_path = state.db_dir.join(format!("{}.db", db_name));
    let sqlite_path = state.db_dir.join(format!("{}.sqlite", db_name));

    let db_file = if db_path.exists() {
        db_path
    } else if sqlite_path.exists() {
        sqlite_path
    } else {
        return Err(format!("No se encontró la base de datos: {}", db_name));
    };

    // Abrir la conexión a la base de datos
    let conn = rusqlite::Connection::open(&db_file).map_err(|e| format!("Error al abrir la base de datos: {}", e))?;

    // Obtener las columnas de la tabla con sus tipos
    let mut stmt = conn.prepare(&format!("PRAGMA table_info({})", quote_identifier(&table_name)))
        .map_err(|e| format!("Error al preparar la consulta de columnas: {}", e))?;

    let columns_info: Vec<(String, String)> = stmt.query_map([], |row| {
        let name: String = row.get(1)?;
        let type_: String = row.get(2)?;
        Ok((name, type_))
    }).map_err(|e| format!("Error al ejecutar la consulta de columnas: {}", e))?
      .collect::<Result<Vec<(String, String)>, _>>()
      .map_err(|e| format!("Error al obtener columnas: {}", e))?;

    let columns: Vec<String> = columns_info.iter().map(|(name, _)| name.clone()).collect();

    // Consultar los datos de la tabla ordenados por "No." ascendente si existe la columna
    let has_no_column = columns.iter().any(|col| col == "No.");
    let order_clause = if has_no_column {
        format!(" ORDER BY CAST({} AS INTEGER) ASC", quote_identifier("No."))
    } else {
        String::new()
    };
    let query = format!("SELECT * FROM {}{}", quote_identifier(&table_name), order_clause);
    let mut stmt = conn.prepare(&query)
        .map_err(|e| format!("Error al preparar la consulta de datos: {}", e))?;

    let rows: Vec<HashMap<String, Value>> = stmt.query_map([], |row| {
        let mut map = HashMap::new();
        for (i, col_name) in columns.iter().enumerate() {
            let col_type = &columns_info[i].1;
            let value: rusqlite::Result<Value> = match row.get_ref(i) {
                Ok(rusqlite::types::ValueRef::Null) => Ok(Value::Null),
                Ok(rusqlite::types::ValueRef::Integer(i)) => Ok(Value::Number(i.into())),
                Ok(rusqlite::types::ValueRef::Real(f)) => Ok(Value::Number(serde_json::Number::from_f64(f).unwrap())),
                Ok(rusqlite::types::ValueRef::Text(s)) => Ok(Value::String(String::from_utf8_lossy(s).to_string())),
                Ok(rusqlite::types::ValueRef::Blob(b)) => {
                    if col_type == "BLOB" {
                        // Return base64 encoded data for BLOB columns (images)
                        let base64_data = general_purpose::STANDARD.encode(b);
                        Ok(Value::String(format!("data:image/png;base64,{}", base64_data)))
                    } else {
                        Ok(Value::String(format!("BLOB({} bytes)", b.len())))
                    }
                },
                Err(e) => Err(e),
            };
            if let Ok(val) = value {
                map.insert(col_name.clone(), val);
            }
        }
        Ok(map)
    }).map_err(|e| format!("Error al ejecutar la consulta de datos: {}", e))?
      .collect::<Result<Vec<HashMap<String, Value>>, _>>()
      .map_err(|e| format!("Error al obtener filas: {}", e))?;

    Ok(TableData {
        table_name,
        columns,
        rows,
    })
}
//se envia la consulta a el archivo consulta_tabla_front.tsx