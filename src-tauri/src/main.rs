// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::{SystemTray, WindowEvent};
use std::process::{Command, Child};
use tauri::Manager;
use tauri::{CustomMenuItem,SystemTrayMenu, SystemTrayMenuItem,SystemTrayEvent};


#[tauri::command]
async fn greet(_app_handle: tauri::AppHandle) -> String{
    return "hello".to_string();
}

fn main() {
    let app = tauri::Builder::default();

    // 注册url协议
    // if let Err(ref e) = install_schema() {
    //     println!("error: {}", e);
    // }
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
      .on_system_tray_event(|app, event| menu_handle(app, event))
      .setup(|_app: &mut tauri::App| {

        let resource_path = _app.path_resolver()
        .resolve_resource("binaries/cherry-server-macos-aarch64-apple-darwin")
        .expect("failed to resolve resource");

        let child_process = start_child_process(resource_path);
        let child_process_clone = child_process.clone();
   
        _app.manage(move |window: &mut tauri::Window| {
            let child_handle = child_process_clone.clone();
            window.on_window_event(move |event| {
                match event {
                    WindowEvent::CloseRequested { .. } => {
                        println!("Window closed!");
                        // 在主进程退出时结束子进程
                        if let Some(mut child) = child_handle.lock().expect("Failed to lock child process").take() {
                            child.kill().expect("Failed to kill child process");
                            child.wait().expect("Failed to wait for child process");
                        }
                    }
                    _ => {}  // 其他事件
                }
            });
        });

        println!("File exists!");

        // let handle: tauri::AppHandle = app.handle();
        tauri_plugin_deep_link::register(
            "yintao",
            move |request| {
                dbg!(&request);
                println!("收到协议调用");
              },
          )
          .unwrap(/* If listening to the scheme is optional for your app, you don't want to unwrap here. */);
        Ok(())

    }).run(tauri::generate_context!())
      .expect("failed to run app");
}

fn start_child_process(resource_path:PathBuf) -> Arc<Mutex<Option<Child>>> {
    let child = Command::new(resource_path).spawn().expect("Failed to start child process");
    // 使用 Arc<Mutex<Option<_>>> 确保子进程可以在线程间共享和安全地关闭
    Arc::new(Mutex::new(Some(child)))
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