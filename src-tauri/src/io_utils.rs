use rusqlite::types::Value as RusqliteValue;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use std::collections::HashMap;

// Estructura del archivo JSON para exportar/importar. Es pública para ser usada en otros módulos.
#[derive(Serialize, Deserialize)]
pub struct TableExport {
    pub table_name: String,
    pub create_statement: String,
    pub data: Vec<HashMap<String, JsonValue>>,
}

// Convierte un valor de Rusqlite a un valor JSON. Es pública.
pub fn rusqlite_to_json(value: RusqliteValue) -> JsonValue {
    match value {
        RusqliteValue::Null => JsonValue::Null,
        RusqliteValue::Integer(i) => JsonValue::Number(i.into()),
        RusqliteValue::Real(f) => JsonValue::Number(serde_json::Number::from_f64(f).unwrap_or(serde_json::Number::from(0))),
        RusqliteValue::Text(t) => JsonValue::String(t),
        RusqliteValue::Blob(_) => JsonValue::Null, // Los blobs no se exportan.
    }
}

// Convierte un valor JSON a un valor de Rusqlite. Es pública.
pub fn json_to_rusqlite(value: &JsonValue) -> Result<RusqliteValue, String> {
    match value {
        JsonValue::Null => Ok(RusqliteValue::Null),
        JsonValue::Bool(b) => Ok(RusqliteValue::Integer(if *b { 1 } else { 0 })),
        JsonValue::Number(n) => {
            if let Some(i) = n.as_i64() {
                Ok(RusqliteValue::Integer(i))
            } else if let Some(f) = n.as_f64() {
                Ok(RusqliteValue::Real(f))
            } else {
                Err("Número no soportado".to_string())
            }
        }
        JsonValue::String(s) => Ok(RusqliteValue::Text(s.clone())),
        _ => Err("Tipo JSON no soportado para la importación".to_string()),
    }
}