// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod database_manager; // Declara el módulo

use tauri::Builder;
use database_manager::{AppState, list_databases, import_database, export_database, delete_database, open_directory};
use dirs;

fn main() {
    let db_dir = dirs::data_dir().unwrap().join("Almacén-Unea/databases"); // Usamos el productName exacto
    Builder::default()
        .manage(AppState {
            db_dir,
            active_db: None,
        })
        .invoke_handler(tauri::generate_handler![
            list_databases,
            import_database,
            export_database,
            delete_database,
            open_directory,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}