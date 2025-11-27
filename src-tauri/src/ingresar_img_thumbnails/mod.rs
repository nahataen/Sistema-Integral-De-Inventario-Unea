
use rusqlite::{Connection, Result};
use serde::Deserialize;
use tauri::State;

// Importar AppState para acceder al directorio de la base de datos.
use crate::database_manager::AppState;

/// Define los tipos de columna permitidos que se pueden agregar.
/// serde(rename_all = "lowercase") permite que el frontend envíe "text" o "image".
#[derive(Deserialize, Debug)]
#[serde(rename_all = "lowercase")]
pub enum ColumnType {
    Text,
    Image,
    DateTime,
}
/// Helper function to quote identifiers containing spaces or special characters for SQLite.
/// Identifiers are quoted with double quotes if they contain spaces or non-alphanumeric characters (except underscores).
fn quote_identifier(identifier: &str) -> String {
    if identifier.chars().any(|c| c.is_whitespace() || (!c.is_alphanumeric() && c != '_')) {
        format!("\"{}\"", identifier)
    } else {
        identifier.to_string()
    }
}

/// Función expuesta a Tauri para agregar una nueva columna a una tabla específica.
///
/// # Argumentos
/// - `state`: El estado de la aplicación Tauri, que contiene la ruta al directorio de BD.
/// - `db_name`: El nombre de la base de datos a modificar.
/// - `table_name`: El nombre de la tabla a la que se agregará la columna.
/// - `column_name`: El nombre de la nueva columna.
/// - `column_type`: El tipo de la nueva columna (Text o Image).
///
#[tauri::command]
pub fn add_new_column(
    state: State<AppState>,
    db_name: String,
    table_name: String,
    column_name: String,
    column_type: ColumnType,
) -> Result<(), String> {
    // 1. Construir la ruta completa al archivo de la base de datos.
    // Se busca tanto .db como .sqlite para mayor compatibilidad.
    let db_path = state.db_dir.join(format!("{}.db", db_name));
    let sqlite_path = state.db_dir.join(format!("{}.sqlite", db_name));

    let db_file = if db_path.exists() {
        db_path
    } else if sqlite_path.exists() {
        sqlite_path
    } else {
        return Err(format!("No se encontró la base de datos: {}", db_name));
    };

    // 2. Abrir la conexión con la base de datos.
    let conn = Connection::open(&db_file)
        .map_err(|e| format!("Error al abrir la base de datos: {}", e))?;

    // Check for duplicate column
    let query = format!("PRAGMA table_info({})", quote_identifier(&table_name));
    let mut stmt = conn.prepare(&query)
        .map_err(|e| format!("Error preparing PRAGMA query: {}", e))?;

    let existing_columns = stmt.query_map([], |row| {
        row.get::<_, String>(1)
    }).map_err(|e| format!("Error querying table info: {}", e))?;

    let mut column_names: Vec<String> = Vec::new();
    for name_result in existing_columns {
        column_names.push(name_result.map_err(|e| format!("Error getting column name: {}", e))?);
    }

    let column_name_lower = column_name.to_lowercase();
    if column_names.iter().any(|name| name.to_lowercase() == column_name_lower) {
        return Err(format!("Column '{}' already exists in table '{}'", column_name, table_name));
    }

    // Handle DateTime separately
    if let ColumnType::DateTime = column_type {
        return crate::crear_columna_fecha::add_date_column(
            db_file.to_str().unwrap(),
            &table_name,
            &column_name,
        );
    }

    // 3. Determinar el tipo de dato SQL basado en la elección del usuario.
    //    - Text -> TEXT: Almacenará cadenas de texto.
    //    - Image -> BLOB: Almacenará datos binarios, como el contenido de una imagen.
    let sql_type = match column_type {
        ColumnType::Text => "TEXT",
        ColumnType::Image => "BLOB",
        ColumnType::DateTime => unreachable!(), // Already handled above
    };

    // 4. Construir la sentencia SQL para agregar la nueva columna.
    //    Se usan comillas dobles para asegurar compatibilidad con nombres de tablas/columnas
    //    que puedan contener espacios o palabras clave de SQL.
    let sql = format!(
        "ALTER TABLE \"{}\" ADD COLUMN {} {}",
        table_name, quote_identifier(&column_name), sql_type
    );

    // 5. Ejecutar la sentencia SQL.
    //    conn.execute no devuelve filas, es ideal para sentencias como ALTER, INSERT, UPDATE, etc.
    conn.execute(&sql, [])
        .map_err(|e| format!("Error al agregar la columna '{}': {}", column_name, e))?;

    // Si todo fue exitoso, devuelve Ok.
    Ok(())
}

// NOTA SOBRE LA CARGA DE IMÁGENES:
// Esta función solo modifica el esquema de la base de datos para *permitir* almacenar imágenes.
// La lógica para leer un archivo de imagen desde el disco, convertirlo a bytes (Vec<u8>),
// y luego insertarlo o actualizarlo en una fila específica usando una sentencia SQL "UPDATE" o "INSERT"
// debería implementarse en una función Tauri separada.
//
// Ejemplo de cómo se vería esa función de inserción/actualización:
//
// #[tauri::command]
// pub fn update_image_in_row(
//     ...,
//     row_id: i64,
//     column_name: String,
//     image_path: String
// ) -> Result<(), String> {
//     ...
//     let image_bytes = std::fs::read(&image_path)
//         .map_err(|e| format!("Error al leer el archivo de imagen: {}", e))?;
//
//     let sql = format!(
//         "UPDATE \"{}\" SET \"{}\" = ?1 WHERE id = ?2", // Suponiendo que hay una columna 'id'
//         table_name, column_name
//     );
//
//     conn.execute(&sql, rusqlite::params![image_bytes, row_id])
//         .map_err(|e| format!("Error al guardar la imagen en la base de datos: {}", e))?;
//
//     Ok(())
// }
