use std::fs;
use base64::{Engine, engine::general_purpose::STANDARD};

/// Process an image file and convert it to base64 for storage as BLOB
/// This command reads an image file from the given path and returns base64 encoded data
#[tauri::command]
pub fn upload_image_for_record(file_path: String) -> Result<String, String> {
    // Read the image file
    let image_data = fs::read(&file_path)
        .map_err(|e| format!("Error reading image file '{}': {}", file_path, e))?;

    // Validate that it's an image (basic check by file extension or magic bytes)
    // For now, just check common image extensions
    let path = std::path::Path::new(&file_path);
    if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
        match ext.to_lowercase().as_str() {
            "jpg" | "jpeg" | "png" | "gif" | "bmp" | "webp" => {
                // Valid image extension
            }
            _ => return Err(format!("Unsupported image format: {}", ext)),
        }
    } else {
        return Err("File has no extension".to_string());
    }

    // Convert to base64 for storage
    let base64_data = STANDARD.encode(&image_data);

    Ok(base64_data)
}
