// Evita que aparezca una ventana de consola extra en Windows cuando la app está en modo release.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod database_manager;
mod hub_tablas;
mod consulta_tablas;
mod editar;
mod io_utils; // NUEVO: Declara el módulo compartido.
mod exportar_tabla; // NUEVO: Declara el módulo de exportación.
mod importar_tabla; // NUEVO: Declara el módulo de importación.
mod crear_registro; // <--- NUEVO
mod ingresar_img_thumbnails;
mod eliminar_columna;
use tauri::Builder;

use database_manager::{
    AppState,
    list_databases,
    import_database,
    export_database,
    delete_database,
    open_directory,
};

use hub_tablas::{ create_table, list_tables, delete_table, upload_table_image, delete_table_image };

use consulta_tablas::consulta_tabla;
use editar::execute_sql;
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
                create_table,
                list_tables,
                delete_table,
                upload_table_image,
                delete_table_image,
                consulta_tabla,
                open_directory,
                editar::update_table_row,
                editar::delete_table_row,
                editar::crear_registro_con_auto_incremento_no,
                crear_registro::crear_registro_con_auto_incremento,
                execute_sql,
                // NUEVO: Registra los nuevos comandos.
                exportar_tabla::export_table_to_json,
                importar_tabla::import_table_from_json,
                importar_tabla::import_table_from_json_with_options,
                ingresar_img_thumbnails::add_new_column,
                eliminar_columna::delete_column,
            ]
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}