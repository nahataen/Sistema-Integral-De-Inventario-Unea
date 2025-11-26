use rusqlite::Result;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use tauri::State;
use crate::database_manager::AppState;
use base64::{Engine, engine::general_purpose::STANDARD};

#[derive(Debug, Serialize, Deserialize)]
pub struct RecordDetails {
    /// Nombre de la tabla
    pub table_name: String,
    /// Datos del registro
    pub record: HashMap<String, Value>,
}

/// Fetch detailed information for a specific record, including proper image handling
#[tauri::command]
pub fn get_record_details(
    state: State<AppState>,
    db_name: String,
    table_name: String,
    id_column: String,
    record_id: serde_json::Value,
) -> Result<RecordDetails, String> {
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

    // Get column information to know data types
    let mut pragma_stmt = conn.prepare(&format!("PRAGMA table_info(\"{}\")", table_name))
        .map_err(|e| format!("Error preparing PRAGMA query: {}", e))?;

    let columns_info: Vec<(String, String)> = pragma_stmt.query_map([], |row| {
        let name: String = row.get(1)?;
        let type_: String = row.get(2)?;
        Ok((name, type_))
    })
    .map_err(|e| format!("Error querying table info: {}", e))?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| format!("Error collecting column info: {}", e))?;

    let column_names: Vec<String> = columns_info.iter().map(|(name, _)| name.clone()).collect();

    // Query the specific record
    let query = format!("SELECT * FROM \"{}\" WHERE \"{}\" = ?", table_name, id_column);
    let mut stmt = conn.prepare(&query)
        .map_err(|e| format!("Error preparing record query: {}", e))?;

    let param: Box<dyn rusqlite::ToSql> = match record_id {
        serde_json::Value::String(s) => Box::new(s),
        serde_json::Value::Number(n) => {
            if let Some(i) = n.as_i64() {
                Box::new(i)
            } else if let Some(f) = n.as_f64() {
                Box::new(f)
            } else {
                return Err("Unsupported number type".to_string());
            }
        }
        _ => return Err("Unsupported record_id type".to_string()),
    };

    let record = stmt.query_row([&*param], |row| {
        let mut map = HashMap::new();
        for (i, col_name) in column_names.iter().enumerate() {
            let value: rusqlite::Result<Value> = match row.get_ref(i) {
                Ok(rusqlite::types::ValueRef::Null) => Ok(Value::Null),
                Ok(rusqlite::types::ValueRef::Integer(i)) => Ok(Value::Number(i.into())),
                Ok(rusqlite::types::ValueRef::Real(f)) => Ok(Value::Number(serde_json::Number::from_f64(f).unwrap())),
                Ok(rusqlite::types::ValueRef::Text(s)) => Ok(Value::String(String::from_utf8_lossy(s).to_string())),
                Ok(rusqlite::types::ValueRef::Blob(b)) => {
                    // For BLOB data (images), encode as base64
                    let base64_data = STANDARD.encode(b);
                    Ok(Value::String(base64_data))
                },
                Err(e) => Err(e),
            };
            if let Ok(val) = value {
                map.insert(col_name.clone(), val);
            }
        }
        Ok(map)
    })
    .map_err(|e| format!("Error fetching record: {}", e))?;

    Ok(RecordDetails {
        table_name,
        record,
    })
}