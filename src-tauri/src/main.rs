// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::command;
use enigo::*;

// Command to simulate typing the text
#[command]
fn type_text(text: String) {
    // Create Enigo with default settings
    let mut enigo = Enigo::new(&Settings::default()).unwrap();
    
    // Type the text out
    enigo.text(&text).unwrap();
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![type_text])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}