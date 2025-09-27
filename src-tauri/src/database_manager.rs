use tauri::State;
use rusqlite::Result;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use chrono::{TimeDelta, Utc};

#[derive(Debug, Serialize, Deserialize)]
pub struct DatabaseInfo {
    name: String,
    status: String,
    size: String,
    last_mod: String,
}

#[derive(Debug)]
pub struct AppState {
    pub db_dir: PathBuf,
    pub active_db: Option<String>,
}

#[tauri::command]
pub fn list_databases(state: State<AppState>) -> Result<Vec<DatabaseInfo>, String> {
    let mut dbs = Vec::new();
    if !state.db_dir.exists() {
        fs::create_dir_all(&state.db_dir).map_err(|e| e.to_string())?;
    }
    for entry in fs::read_dir(&state.db_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) == Some("db") {
            let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
            let size = (metadata.len() as f64 / 1_048_576.0).round(); // MB
            let last_mod = metadata
                .modified()
                .map_err(|e| e.to_string())?
                .elapsed()
                .map_err(|e| e.to_string())?
                .as_secs();
            let status = if Some(path.file_name().unwrap().to_str().unwrap()) == state.active_db.as_deref() {
                "En uso".to_string()
            } else {
                "Inactivo".to_string()
            };
            dbs.push(DatabaseInfo {
                name: path.file_stem().unwrap().to_str().unwrap().to_string(),
                status,
                size: format!("{:.0} MB", size),
                last_mod: Utc::now()
                    .checked_sub_signed(TimeDelta::new(last_mod as i64, 0).expect("Invalid TimeDelta creation"))
                    .map_or_else(|| "N/A".to_string(), |d| d.format("%Y-%m-%d").to_string()),
            });
        }
    }
    Ok(dbs)
}

#[tauri::command]
pub fn import_database(state: State<AppState>, file_path: String) -> Result<(), String> {
    let new_path = state.db_dir.join(PathBuf::from(file_path.clone()).file_name().unwrap());
    fs::copy(file_path, new_path).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn export_database(state: State<AppState>, name: String, target_path: String) -> Result<(), String> {
    let db_path = state.db_dir.join(format!("{}.db", name));
    fs::copy(db_path, target_path).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_database(state: State<AppState>, name: String) -> Result<(), String> {
    let db_path = state.db_dir.join(format!("{}.db", name));
    fs::remove_file(db_path).map_err(|e| e.to_string())?;
    Ok(())
}