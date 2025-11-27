use rusqlite::{Connection, ToSql};
use serde::Deserialize;
use tauri::State;
use base64::{Engine as _, engine::general_purpose};
use crate::database_manager::AppState;
use chrono::Local;

#[derive(Debug, Deserialize)]
pub struct NuevoRegistro {
    pub db_name: String,
    pub table_name: String,
    pub id_column: String,
    pub data: serde_json::Value,
}

fn quote_identifier(s: &str) -> String {
    format!("\"{}\"", s)
}

#[tauri::command]
pub fn crear_registro_con_auto_incremento(
    state: State<AppState>,
    registro: NuevoRegistro,
) -> Result<String, String> {

    // ==============================
    // 1. Abrir base de datos
    // ==============================
    let db_path = state.db_dir.join(format!("{}.db", registro.db_name));
    let sqlite_path = state.db_dir.join(format!("{}.sqlite", registro.db_name));

    let db_file = if db_path.exists() {
        db_path
    } else if sqlite_path.exists() {
        sqlite_path
    } else {
        return Err(format!("No se encontró BD: {}", registro.db_name));
    };

    let conn = Connection::open(&db_file)
        .map_err(|e| format!("Error al abrir la BD: {}", e))?;

    // ==============================
    // 2. Validar data
    // ==============================
    let obj = registro.data.as_object()
        .ok_or("data debe ser un objeto JSON")?;

    // ==============================
    // 3. Auto-incrementar ID
    // ==============================
    let last_id_query = format!("SELECT \"{}\" FROM \"{}\" WHERE \"{}\" IS NOT NULL AND \"{}\" != '' ORDER BY CAST(\"{}\" AS INTEGER) DESC LIMIT 1", registro.id_column, registro.table_name, registro.id_column, registro.id_column, registro.id_column);
    let mut stmt = conn.prepare(&last_id_query)
        .map_err(|e| format!("Error al preparar consulta para obtener último ID: {}", e))?;

    let last_id: Option<i64> = stmt.query_row([], |row| row.get(0))
        .ok(); // Si no hay filas, devuelve None

    let next_id = last_id.map(|n| n + 1).unwrap_or(1);

    // Verificar que el ID no exista ya (por si acaso)
    let check_query = format!("SELECT COUNT(*) FROM \"{}\" WHERE \"{}\" = ?", registro.table_name, registro.id_column);
    let mut check_stmt = conn.prepare(&check_query)
        .map_err(|e| format!("Error al preparar consulta de verificación: {}", e))?;

    let count: i64 = check_stmt.query_row([next_id], |row| row.get(0))
        .unwrap_or(0);

    let final_id = if count > 0 {
        // Si ya existe, buscar el siguiente ID disponible
        let find_next_query = format!("SELECT \"{}\" + 1 FROM \"{}\" WHERE \"{}\" + 1 NOT IN (SELECT \"{}\" FROM \"{}\") AND \"{}\" IS NOT NULL ORDER BY \"{}\" LIMIT 1", registro.id_column, registro.table_name, registro.id_column, registro.id_column, registro.table_name, registro.id_column, registro.id_column);
        let mut find_stmt = conn.prepare(&find_next_query)
            .map_err(|e| format!("Error al preparar consulta para encontrar siguiente ID: {}", e))?;

        find_stmt.query_row([], |row| row.get(0))
            .unwrap_or(next_id + 1)
    } else {
        next_id
    };

    // Crear los datos con el nuevo ID
    let mut data_with_id = obj.clone();
    data_with_id.insert(registro.id_column.clone(), serde_json::Value::Number(serde_json::Number::from(final_id)));

    // ==============================
    // 4. Obtener columnas reales con tipos
    // ==============================
    let mut stmt = conn.prepare(&format!("PRAGMA table_info(\"{}\")", registro.table_name))
        .map_err(|e| format!("Error PRAGMA: {}", e))?;

    let columns_info: Vec<(String, String)> = stmt.query_map([], |row| {
        let name: String = row.get(1)?;
        let type_: String = row.get(2)?;
        Ok((name, type_))
    })
    .map_err(|e| format!("Error recorriendo columnas: {}", e))?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| format!("Error columnas: {}", e))?;

    let columns: Vec<String> = columns_info.iter().map(|(name, _)| name.clone()).collect();

    // ==============================
    // 5. Crear SQL dinámico
    // ==============================
    let quoted_columns = columns.iter()
        .map(|c| quote_identifier(c))
        .collect::<Vec<_>>()
        .join(", ");

    let placeholders = columns.iter()
        .map(|_| "?")
        .collect::<Vec<_>>()
        .join(", ");

    let sql = format!(
        "INSERT INTO {} ({}) VALUES ({})",
        quote_identifier(&registro.table_name),
        quoted_columns,
        placeholders
    );

    // ==============================
    // 6. Mapear valores
    // ==============================
    let mut params: Vec<Box<dyn ToSql>> = Vec::new();

    for (i, col) in columns.iter().enumerate() {
        let col_type = &columns_info[i].1;
        if let Some(v) = data_with_id.get(col) {
            if col == &registro.id_column {
                // Always treat ID as text, as the auto-increment query uses CAST.
                match v {
                    serde_json::Value::Number(n) => params.push(Box::new(n.to_string())),
                    _ => params.push(Box::new(v.to_string())), // Fallback for safety
                }
            } else if col_type == "BLOB" {
                // Handle BLOB columns (images)
                match v {
                    serde_json::Value::String(s) => {
                        // Try to decode base64 string to bytes
                        match general_purpose::STANDARD.decode(s) {
                            Ok(bytes) => params.push(Box::new(bytes)),
                            Err(_) => params.push(Box::new(s.clone())), // Fallback to string if not valid base64
                        }
                    }
                    serde_json::Value::Null => params.push(Box::new(rusqlite::types::Null)),
                    _ => params.push(Box::new(v.to_string())), // Fallback
                }
            } else if col == "zona_campus" {
                // Keep original logic for zona_campus
                match v {
                    serde_json::Value::String(s) => params.push(Box::new(s.clone())),
                    serde_json::Value::Number(n) => {
                        if let Some(i) = n.as_i64() { params.push(Box::new(i)); }
                        else if let Some(f) = n.as_f64() { params.push(Box::new(f)); }
                        else { params.push(Box::new(rusqlite::types::Null)); }
                    }
                    serde_json::Value::Bool(b) => params.push(Box::new(*b as i32)),
                    serde_json::Value::Null => params.push(Box::new(rusqlite::types::Null)),
                    _ => params.push(Box::new(v.to_string())),
                }
            } else {
                // For all other columns, insert as text, and use empty string instead of null.
                match v {
                    serde_json::Value::Null => params.push(Box::new("".to_string())),
                    serde_json::Value::String(s) => params.push(Box::new(s.clone())),
                    serde_json::Value::Number(n) => params.push(Box::new(n.to_string())),
                    serde_json::Value::Bool(b) => params.push(Box::new(b.to_string())),
                    serde_json::Value::Array(_) | serde_json::Value::Object(_) => params.push(Box::new(v.to_string())),
                }
            }
        } else {
            // If the key is not present, decide what to insert.
            if col == &registro.id_column {
                // This shouldn't be reached due to auto-increment logic, but as a safeguard.
                params.push(Box::new(rusqlite::types::Null));
            } else if col == "zona_campus" {
                params.push(Box::new(rusqlite::types::Null));
            } else {
                // For other columns, use an empty string to satisfy NOT NULL constraints.
                if col_type == "DATETIME" {
                    params.push(Box::new(Local::now().to_rfc3339()));
                } else {
                    params.push(Box::new("".to_string()));
                }
            }
        }
    }

    let params_ref = params.iter()
        .map(|p| &**p as &dyn ToSql)
        .collect::<Vec<_>>();

    // ==============================
    // 7. Ejecutar inserción
    // ==============================
    conn.execute(&sql, params_ref.as_slice())
        .map_err(|e| format!("Error INSERT: {}", e))?;

    Ok("Registro creado exitosamente".into())
}
