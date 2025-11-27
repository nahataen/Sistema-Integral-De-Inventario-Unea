use rusqlite::{Connection};

fn quote_identifier(identifier: &str) -> String {
    if identifier.chars().any(|c| c.is_whitespace() || (!c.is_alphanumeric() && c != '_')) {
        format!("\"{}\"", identifier)
    } else {
        identifier.to_string()
    }
}

pub fn add_date_column(db_path: &str, table_name: &str, column_name: &str) -> Result<(), String> {
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    // Check for duplicate column
    let query = format!("PRAGMA table_info({})", quote_identifier(table_name));
    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
    let existing_columns = stmt.query_map([], |row| row.get::<_, String>(1)).map_err(|e| e.to_string())?;
    let mut column_names: Vec<String> = Vec::new();
    for name_result in existing_columns {
        column_names.push(name_result.map_err(|e| e.to_string())?);
    }
    let column_name_lower = column_name.to_lowercase();
    if column_names.iter().any(|name| name.to_lowercase() == column_name_lower) {
        return Err("La columna ya existe".to_string());
    }

    let sql = format!("ALTER TABLE {} ADD COLUMN {} DATETIME", quote_identifier(table_name), quote_identifier(column_name));
    match conn.execute(&sql, []) {
        Ok(_) => Ok(()),
        Err(e) => {
            let error_msg = e.to_string();
            if error_msg.contains("duplicate column name") {
                Err("La columna ya existe".to_string())
            } else {
                Err(error_msg)
            }
        }
    }
}