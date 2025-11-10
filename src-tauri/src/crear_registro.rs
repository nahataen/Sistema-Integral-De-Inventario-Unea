use rusqlite::Connection;
use serde::Deserialize;
use tauri::State;
use crate::database_manager::AppState;

#[derive(Debug, Deserialize)]
pub struct NuevoRegistro {
    pub db_name: String,
    pub table_name: String,
    pub data: serde_json::Value, // datos como objeto JSON { columna: valor }
}

#[tauri::command]
pub fn crear_registro(state: State<AppState>, registro: NuevoRegistro) -> Result<String, String> {
    // Ruta del archivo de base de datos
    let db_path = state.db_dir.join(format!("{}.db", registro.db_name));
    let sqlite_path = state.db_dir.join(format!("{}.sqlite", registro.db_name));

    let db_file = if db_path.exists() {
        db_path
    } else if sqlite_path.exists() {
        sqlite_path
    } else {
        return Err(format!("No se encontró la base de datos: {}", registro.db_name));
    };

    // Conectar
    let conn = Connection::open(&db_file)
        .map_err(|e| format!("Error al abrir la base de datos: {}", e))?;

    // Extraer claves y valores del JSON, permitiendo campos faltantes
    let obj = registro.data.as_object()
        .ok_or("El campo 'data' debe ser un objeto JSON")?;

    // Obtener todas las columnas de la tabla para asegurar que todos los campos estén incluidos
    let mut stmt = conn.prepare(&format!("PRAGMA table_info({})", registro.table_name))
        .map_err(|e| format!("Error al preparar la consulta de columnas: {}", e))?;

    let all_columns: Vec<String> = stmt.query_map([], |row| {
        let name: String = row.get(1)?;
        Ok(name)
    }).map_err(|e| format!("Error al ejecutar la consulta de columnas: {}", e))?
      .collect::<Result<Vec<String>, _>>()
      .map_err(|e| format!("Error al obtener columnas: {}", e))?;

    // Usar todas las columnas de la tabla, no solo las proporcionadas
    let columns: Vec<String> = all_columns;

    // Construir sentencia SQL dinámica con columnas entre comillas para manejar espacios
    let placeholders = vec!["?"; columns.len()].join(", ");
    let quoted_columns = columns.iter().map(|c| format!("\"{}\"", c)).collect::<Vec<_>>();
    let sql = format!(
        "INSERT INTO \"{}\" ({}) VALUES ({})",
        registro.table_name,
        quoted_columns.join(", "),
        placeholders
    );

    // Convertir valores JSON a tipos ToSql, manejando campos faltantes como NULL
    let mut values: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
    for column in &columns {
        let value = obj.get(column);
        match value {
            Some(serde_json::Value::String(s)) => values.push(Box::new(s.clone())),
            Some(serde_json::Value::Number(n)) => {
                if let Some(i) = n.as_i64() {
                    values.push(Box::new(i));
                } else if let Some(f) = n.as_f64() {
                    values.push(Box::new(f));
                } else {
                    values.push(Box::new(rusqlite::types::Null));
                }
            }
            Some(serde_json::Value::Bool(b)) => values.push(Box::new(*b as i32)),
            Some(serde_json::Value::Null) => values.push(Box::new(rusqlite::types::Null)),
            None => values.push(Box::new(rusqlite::types::Null)), // Campo faltante = NULL
            _ => values.push(Box::new(value.unwrap().to_string())),
        }
    }

    // Ejecutar inserción
    let mut stmt = conn
        .prepare(&sql)
        .map_err(|e| format!("Error preparando sentencia: {}", e))?;

    let params: Vec<&dyn rusqlite::ToSql> = values.iter().map(|v| &**v).collect();

    stmt.execute(params.as_slice())
        .map_err(|e| format!("Error al ejecutar la inserción: {}", e))?;

    Ok("Registro creado exitosamente".to_string())
}
