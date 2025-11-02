use rusqlite::{Connection, ToSql};
use tauri::State;

use crate::database_manager::AppState;
use crate::io_utils::{TableExport, json_to_rusqlite}; // Usa el módulo compartido

// Importa una tabla desde un string JSON.
#[tauri::command]
pub fn import_table_from_json(
    state: State<AppState>,
    db_name: String,
    json_content: String,
) -> Result<bool, String> {
    import_table_from_json_internal(state, db_name, json_content, false, None)
}

// Comando para forzar reemplazo o cambiar nombre de tabla
#[tauri::command]
pub fn import_table_from_json_with_options(
    state: State<AppState>,
    db_name: String,
    json_content: String,
    force_replace: bool,
    new_table_name: Option<String>,
) -> Result<bool, String> {
    import_table_from_json_internal(state, db_name, json_content, force_replace, new_table_name)
}

fn import_table_from_json_internal(
    state: State<AppState>,
    db_name: String,
    json_content: String,
    force_replace: bool,
    new_table_name: Option<String>,
) -> Result<bool, String> {
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

    let mut conn = Connection::open(&db_file).map_err(|e| e.to_string())?;

    // Deserializa el contenido JSON.
    let mut import_data: TableExport = serde_json::from_str(&json_content)
        .map_err(|e| format!("Error al parsear el JSON: {}", e))?;

    // Determina el nombre final de la tabla
    let final_table_name = new_table_name.unwrap_or_else(|| import_data.table_name.clone());

    // Verifica si la tabla ya existe
    let table_exists = {
        let mut stmt = conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
            .map_err(|e| e.to_string())?;
        let exists = stmt.exists([final_table_name.as_str()]).map_err(|e| e.to_string())?;
        exists
    };

    if table_exists && !force_replace {
        return Err(format!("La tabla '{}' ya existe. ¿Desea reemplazarla o cambiar el nombre?", final_table_name));
    }

    // Actualiza el nombre de la tabla en los datos de importación si se cambió
    let original_table_name = import_data.table_name.clone();
    if final_table_name != original_table_name {
        import_data.table_name = final_table_name.clone();
        // También actualizar el CREATE TABLE statement para usar el nuevo nombre
        import_data.create_statement = import_data.create_statement.replace(
            &format!("\"{}\"", original_table_name),
            &format!("\"{}\"", final_table_name)
        );
    }

    // Usa una transacción para asegurar la integridad de los datos.
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // Elimina la tabla si ya existe (solo si force_replace es true, pero ya verificamos arriba)
    if force_replace {
        tx.execute(&format!("DROP TABLE IF EXISTS \"{}\"", import_data.table_name), [])
            .map_err(|e| e.to_string())?;
    }

    // Crea la nueva tabla.
    tx.execute(&import_data.create_statement, [])
        .map_err(|e| e.to_string())?;

    if !import_data.data.is_empty() {
        let first_row = &import_data.data[0];
        let columns: Vec<String> = first_row.keys().cloned().collect();
        let column_list = columns.iter().map(|c| format!("\"{}\"", c)).collect::<Vec<_>>().join(", ");
        let value_placeholders = columns.iter().map(|_| "?").collect::<Vec<_>>().join(", ");

        let insert_sql = format!(
            "INSERT INTO \"{}\" ({}) VALUES ({})",
            import_data.table_name, column_list, value_placeholders
        );

        // Inserta cada fila de datos.
        for row_map in &import_data.data {
            let params: Result<Vec<_>, _> = columns.iter()
                .map(|col| json_to_rusqlite(row_map.get(col).unwrap()))
                .collect();
            let params = params?;
            let params_refs: Vec<&dyn ToSql> = params.iter().map(|v| v as &dyn ToSql).collect();
            tx.execute(&insert_sql, &params_refs[..]).map_err(|e| e.to_string())?;
        }
    }

    // Confirma la transacción.
    tx.commit().map_err(|e| e.to_string())?;

    Ok(true)
}