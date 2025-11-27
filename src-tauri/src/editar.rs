use rusqlite::{Connection, Result, ToSql};
use rusqlite::types::Value;
use tauri::State;
use std::collections::HashMap;
use serde_json;
use base64::{Engine as _, engine::general_purpose};
use crate::database_manager::AppState;

// Helper function to quote SQL identifiers (table names, column names) for SQLite
fn quote_identifier(s: &str) -> String {
    format!("\"{}\"", s)
}

// Convierte un valor JSON de Serde a un valor SQL de Rusqlite.
fn convert_json_to_sql(json_value: &serde_json::Value, column_type: Option<&String>) -> Result<Value, String> {
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
        serde_json::Value::String(s) => {
            // If it's a BLOB column and the string looks like base64, decode it
            if column_type.as_ref().map_or(false, |t| *t == "BLOB") {
                match general_purpose::STANDARD.decode(s) {
                    Ok(bytes) => Ok(Value::Blob(bytes)),
                    Err(_) => Ok(Value::Text(s.clone())), // Fallback to text if not valid base64
                }
            } else {
                Ok(Value::Text(s.clone()))
            }
        },
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
    column_types: Option<HashMap<String, String>>,
    _column_notnull: Option<HashMap<String, i32>>,
) -> Result<bool, String> {
    if updates.is_empty() {
        return Err("No hay datos para actualizar.".to_string());
    }

    // Use all updates directly since frontend validates null values
    let filtered_updates = updates;

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
    let set_clause: Vec<String> = filtered_updates
        .keys()
        .map(|k| format!("{} = ?", quote_identifier(k)))
        .collect();

    // Construye la consulta SQL completa.
    let sql = format!(
        "UPDATE {} SET {} WHERE {} = ?",
        quote_identifier(&table_name),
        set_clause.join(", "),
        quote_identifier(&pk_column)
    );

    // Prepara los parámetros para la consulta.
    let mut params: Vec<Value> = Vec::new();
    for key in filtered_updates.keys() {
        let value = &filtered_updates[key];
        let col_type = column_types.as_ref().and_then(|ct| ct.get(key));
        params.push(convert_json_to_sql(value, col_type)?);
    }
    params.push(convert_json_to_sql(&pk_value, None)?);



    let params_refs: Vec<&dyn ToSql> = params.iter().map(|v| v as &dyn ToSql).collect();

    // Ejecuta la consulta de actualización.
    let rows_affected = conn.execute(&sql, params_refs.as_slice())
        .map_err(|e| format!("Error al ejecutar UPDATE: {}", e))?;



    if rows_affected == 0 {
        return Err(format!("No se encontró ninguna fila con {} = {:?}", pk_column, pk_value));
    }

    Ok(true)
}

// Comando de Tauri para eliminar una fila en cualquier tabla.
#[tauri::command]
pub fn delete_table_row(
    state: State<AppState>,
    db_name: String,
    table_name: String,
    pk_column: String,
    pk_value: serde_json::Value,
) -> Result<bool, String> {
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

    // Construye la consulta SQL de eliminación.
    let sql = format!(
        "DELETE FROM {} WHERE {} = ?",
        quote_identifier(&table_name),
        quote_identifier(&pk_column)
    );

    // Convierte el valor de la clave primaria a un valor SQL.
    let pk_sql_value = convert_json_to_sql(&pk_value, None)?;

    println!("DELETE SQL: {}, PK column: {}, PK value: {} (type: {})", sql, pk_column, pk_value, pk_value);

    // Ejecuta la consulta de eliminación.
    let rows_affected = conn.execute(&sql, &[&pk_sql_value as &dyn ToSql])
        .map_err(|e| format!("Error al ejecutar DELETE: {}", e))?;

    println!("DELETE ejecutado: {} filas afectadas", rows_affected);

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

// Comando de Tauri para crear un nuevo registro con auto-incremento del campo "No."
#[tauri::command]
pub fn crear_registro_con_auto_incremento_no(
    state: State<AppState>,
    db_name: String,
    table_name: String,
    data: HashMap<String, serde_json::Value>,
    column_types: Option<HashMap<String, String>>,
) -> Result<bool, String> {
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

    // Obtener el último valor de "No." en la tabla ordenado numéricamente
    let last_no_query = format!("SELECT {} FROM {} WHERE {} IS NOT NULL AND {} != '' ORDER BY CAST({} AS INTEGER) DESC LIMIT 1", quote_identifier("No."), quote_identifier(&table_name), quote_identifier("No."), quote_identifier("No."), quote_identifier("No."));
    let mut stmt = conn.prepare(&last_no_query)
        .map_err(|e| format!("Error al preparar consulta para obtener último No.: {}", e))?;

    let last_no: Option<i64> = stmt.query_row([], |row| row.get(0))
        .ok(); // Si no hay filas, devuelve None

    let next_no = last_no.map(|n| n + 1).unwrap_or(1);

    // Verificar que el número no exista ya (por si acaso)
    let check_query = format!("SELECT COUNT(*) FROM {} WHERE {} = ?", quote_identifier(&table_name), quote_identifier("No."));
    let mut check_stmt = conn.prepare(&check_query)
        .map_err(|e| format!("Error al preparar consulta de verificación: {}", e))?;

    let count: i64 = check_stmt.query_row([next_no], |row| row.get(0))
        .unwrap_or(0);

    let final_no = if count > 0 {
        // Si ya existe, buscar el siguiente número disponible
        let find_next_query = format!("SELECT {} + 1 FROM {} WHERE {} + 1 NOT IN (SELECT {} FROM {}) AND {} IS NOT NULL ORDER BY {} LIMIT 1", quote_identifier("No."), quote_identifier(&table_name), quote_identifier("No."), quote_identifier("No."), quote_identifier(&table_name), quote_identifier("No."), quote_identifier("No."));
        let mut find_stmt = conn.prepare(&find_next_query)
            .map_err(|e| format!("Error al preparar consulta para encontrar siguiente número: {}", e))?;

        find_stmt.query_row([], |row| row.get(0))
            .unwrap_or(next_no + 1)
    } else {
        next_no
    };

    // Log detallado del proceso siguiendo el formato solicitado
    println!("Último número encontrado en no: {:?}", last_no);
    println!("Nuevo número asignado: {}", final_no);
    println!();
    println!("Nuevo registro agregado correctamente:");

    // Crear los datos con el nuevo número "No."
    let mut data_with_no = data.clone();
    data_with_no.insert("No.".to_string(), serde_json::Value::Number(serde_json::Number::from(final_no)));

    // Construir la consulta INSERT
    let columns: Vec<String> = data_with_no.keys().map(|k| quote_identifier(k)).collect();
    let placeholders: Vec<String> = (0..data_with_no.len()).map(|_| "?".to_string()).collect();

    let sql = format!(
        "INSERT INTO {} ({}) VALUES ({})",
        quote_identifier(&table_name),
        columns.join(", "),
        placeholders.join(", ")
    );

    // Preparar los parámetros
    let mut params: Vec<Value> = Vec::new();
    for key in data_with_no.keys() {
        let value = &data_with_no[key];
        let col_type = column_types.as_ref().and_then(|ct| ct.get(key));
        params.push(convert_json_to_sql(value, col_type)?);
    }

    let params_refs: Vec<&dyn ToSql> = params.iter().map(|v| v as &dyn ToSql).collect();

    // Ejecutar la inserción
    let _rows_affected = conn.execute(&sql, params_refs.as_slice())
        .map_err(|e| format!("Error al ejecutar INSERT: {}", e))?;

    // Mostrar los datos del registro creado en el formato solicitado
    for (key, value) in &data_with_no {
        if key == "No." {
            println!("no: {}", value);
        } else {
            // Convertir el nombre de columna a formato legible
            let display_name = match key.as_str() {
                "Región" => "Región",
                "Plantel" => "Plantel",
                "Responsable" => "Responsable",
                "Puesto" => "Puesto",
                "Departamento" => "Departamento",
                "Equipo" => "Equipo",
                "Marca" => "Marca",
                "Modelo" => "Modelo",
                "Serie" => "Serie",
                "Estatus" => "Estatus",
                "Ubicación" => "Ubicación",
                _ => key,
            };
            println!("{}: {}", display_name, value);
        }
    }
    println!();

    Ok(true)
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