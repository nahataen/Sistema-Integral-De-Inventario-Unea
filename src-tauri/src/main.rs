// Evita que aparezca una ventana de consola extra en Windows cuando la app está en modo release.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod database_manager;
mod hub_tablas;
mod consulta_tablas;

use tauri::Builder;

use database_manager::{
    AppState,
    list_databases,
    import_database,
    export_database,
    delete_database,
    open_directory,
};

use hub_tablas::{ list_tables, delete_table, upload_table_image, delete_table_image };

use consulta_tablas::consulta_tabla;
use dirs;

fn main() {
    let db_dir = dirs::data_dir().unwrap().join("Almacén-Unea/databases");

    Builder::default()
        .manage(AppState {
            db_dir,
            active_db: None,
        })
        .invoke_handler(
            tauri::generate_handler![
                list_databases,
                import_database,
                export_database,
                delete_database,
                list_tables,
                delete_table,
                upload_table_image,
                delete_table_image,
                consulta_tabla,
                open_directory
            ]
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
