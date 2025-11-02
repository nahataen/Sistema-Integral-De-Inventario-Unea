use rusqlite::{Connection, Result, ToSql};
use rusqlite::types::Value;
use tauri::State;
use std::collections::HashMap;
use crate::database_manager::AppState;

// Convierte un valor JSON de Serde a un valor SQL de Rusqlite.
fn convert_json_to_sql(json_value: &serde_json::Value) -> Result<Value, String> {
    match json_value {
        serde_json::Value::Null => Ok(Value::Null),
        serde_json::Value::Bool(b) => Ok(Value::Integer(if *b { 1 } else { 0 })),
        serde_json::Value::Number(n) => {
            if let Some(i) = n.as_i64() {
                Ok(Value::Integer(i))
            } else if let Some(f) = n.as_f64() {
                Ok(Value::Real(f))
            } else {
                Err("Número no soportado".to_string())
            }
        }
        serde_json::Value::String(s) => Ok(Value::Text(s.clone())),
        _ => Err(format!("Tipo de dato no soportado para conversión: {:?}", json_value)),
    }
}

// Comando de Tauri para actualizar una fila en cualquier tabla.
#[tauri::command]
pub fn update_table_row(
    state: State<AppState>,
    db_name: String,
    table_name: String,
    pk_column: String,
    pk_value: serde_json::Value,
    updates: HashMap<String, serde_json::Value>,
) -> Result<bool, String> {
    if updates.is_empty() {
        return Err("No hay datos para actualizar.".to_string());
    }

    // Determina la ruta del archivo de la base de datos.
    let db_path = state.db_dir.join(format!("{}.db", db_name));
    let sqlite_path = state.db_dir.join(format!("{}.sqlite", db_name));
    let db_file = if db_path.exists() {
        db_path
    } else if sqlite_path.exists() {
        sqlite_path
    } else {
        return Err(format!("Base de datos no encontrada: {}", db_name));
    };

    let conn = Connection::open(&db_file)
        .map_err(|e| format!("Error al abrir la base de datos: {}", e))?;

    // Construye la cláusula SET de la consulta SQL.
    let set_clause: Vec<String> = updates
        .keys()
        .map(|k| format!("\"{}\" = ?", k))
        .collect();

    // Construye la consulta SQL completa.
    let sql = format!(
        "UPDATE \"{}\" SET {} WHERE \"{}\" = ?",
        table_name,
        set_clause.join(", "),
        pk_column
    );

    // Prepara los parámetros para la consulta.
    let mut params: Vec<Value> = Vec::new();
    for key in updates.keys() {
        let value = &updates[key];
        params.push(convert_json_to_sql(value)?);
    }
    params.push(convert_json_to_sql(&pk_value)?);

    let params_refs: Vec<&dyn ToSql> = params.iter().map(|v| v as &dyn ToSql).collect();

    // Ejecuta la consulta de actualización.
    let rows_affected = conn.execute(&sql, params_refs.as_slice())
        .map_err(|e| format!("Error al ejecutar UPDATE: {}", e))?;

    if rows_affected == 0 {
        return Err(format!("No se encontró ninguna fila con {} = {:?}", pk_column, pk_value));
    }

    Ok(true)
}

// Estructura para el comando de ejecución de SQL genérico.
#[derive(Debug, serde::Deserialize)]
pub struct ExecuteSqlParams {
    pub db_name: String,
    pub sql: String,
    pub params: Vec<String>,
}

// Comando de Tauri para ejecutar una consulta SQL genérica.
#[tauri::command]
pub fn execute_sql(
    state: State<AppState>,
    params: ExecuteSqlParams,
) -> Result<bool, String> {
    let db_path = state.db_dir.join(format!("{}.db", params.db_name));
    let sqlite_path = state.db_dir.join(format!("{}.sqlite", params.db_name));

    let db_file = if db_path.exists() {
        db_path
    } else if sqlite_path.exists() {
        sqlite_path
    } else {
        return Err(format!("Base de datos no encontrada: {}", params.db_name));
    };

    let conn = Connection::open(&db_file)
        .map_err(|e| format!("Error al abrir la base de datos: {}", e))?;

    conn.execute(&params.sql, rusqlite::params_from_iter(&params.params))
        .map_err(|e| format!("Error al ejecutar SQL: {}", e))?;

    Ok(true)
}