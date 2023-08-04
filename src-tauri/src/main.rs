// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::{SystemTray};
use std::process::{Command, Child};
use tauri::Manager;
use tauri::{CustomMenuItem,SystemTrayMenu, SystemTrayMenuItem,SystemTrayEvent};
use lazy_static::lazy_static;

lazy_static! {
  static ref CHILD_ID: Arc<Mutex<Option<Child>>> = Arc::new(Mutex::new(None));
}

fn main() {
    let app = tauri::Builder::default();

    tauri_plugin_deep_link::prepare("com.yintao.jd");

    // 添加托盘
    let quit = CustomMenuItem::new("quit".to_string(), "exit");
    let hide = CustomMenuItem::new("about".to_string(), "about");
    let tray_menu = SystemTrayMenu::new()
      .add_item(quit)
      .add_native_item(SystemTrayMenuItem::Separator)
      .add_item(hide);
  
    let system_tray = SystemTray::new().with_menu(tray_menu);

    app
      .system_tray(system_tray)
      .setup(move |app| {
        let app_handle = app.app_handle();

        let child_process = start_yintao_server(app_handle);
        *CHILD_ID.lock().unwrap() = Some(child_process);

        tauri_plugin_deep_link::register(
          "yintao",
          move |request| {
              dbg!(&request);
              println!("收到协议调用");
            },
        )
        .unwrap(/* If listening to the scheme is optional for your app, you don't want to unwrap here. */);

        Ok(())
    })
      .on_system_tray_event(|app, event| menu_handle(app, event))
      .build(tauri::generate_context!())
      .expect("error while running tauri application")
      .run(|_app_handle, event| match event {
        tauri::RunEvent::ExitRequested { api, .. } => {
          println!("kill yintao server!");
          if let Some(mut child_id) = CHILD_ID.lock().unwrap().take() {
            let _ = child_id.kill();
          }
        api.prevent_exit();
        },
        tauri::RunEvent::Exit => {
          _app_handle.exit(0);
      },
        _ => {}
      });

}


fn start_yintao_server(app: tauri::AppHandle) -> Child {
    let resource_path: PathBuf = app.path_resolver()
    .resolve_resource("binaries/cherry-server-macos-aarch64-apple-darwin")
    .expect("failed to resolve resource");

    let child = Command::new(resource_path)
    .spawn()
    .expect("Failed to start long running service");

    child
}

fn menu_handle(_app_handle: &tauri::AppHandle, event: SystemTrayEvent) {
    match event {
      SystemTrayEvent::LeftClick {
        position: _,
        size: _,
        ..
      } => {
        println!("鼠标-左击");
      }
      SystemTrayEvent::RightClick {
        position: _,
        size: _,
        ..
      } => {
        println!("鼠标-右击");
      }
      SystemTrayEvent::DoubleClick {
        position: _,
        size: _,
        ..
      } => {
        println!("鼠标-双击");
      }
      SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
        "quit" => {
          _app_handle.exit(0)
        }
        "about" => {
            println!("显示关于信息");
        }
        _ => {}
      },
      _ => {}
    }
  }