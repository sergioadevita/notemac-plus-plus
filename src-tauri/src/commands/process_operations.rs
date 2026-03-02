use std::process::Stdio;
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use std::sync::atomic::{AtomicU32, Ordering};
use std::collections::HashMap;

/// Global PID tracker for the currently running task process.
static ACTIVE_PID: AtomicU32 = AtomicU32::new(0);

#[derive(Clone, serde::Serialize)]
struct OutputLinePayload
{
    line: String,
    stream: String,
}

#[derive(Clone, serde::Serialize)]
struct ExitPayload
{
    #[serde(rename = "exitCode")]
    exit_code: i32,
    signal: Option<String>,
}

#[tauri::command]
pub async fn execute_command(
    app: AppHandle,
    command: String,
    cwd: Option<String>,
    env: Option<HashMap<String, String>>,
) -> Result<serde_json::Value, String>
{
    let shell = if cfg!(target_os = "windows") { "cmd" } else { "sh" };
    let shell_flag = if cfg!(target_os = "windows") { "/C" } else { "-c" };

    let mut cmd = Command::new(shell);
    cmd.arg(shell_flag).arg(&command);
    cmd.stdout(Stdio::piped());
    cmd.stderr(Stdio::piped());
    cmd.stdin(Stdio::null());

    if let Some(ref dir) = cwd
    {
        cmd.current_dir(dir);
    }

    if let Some(ref env_vars) = env
    {
        for (key, value) in env_vars
        {
            cmd.env(key, value);
        }
    }

    let mut child = cmd.spawn().map_err(|e| format!("Failed to spawn process: {}", e))?;

    let pid = child.id().unwrap_or(0);
    ACTIVE_PID.store(pid, Ordering::SeqCst);

    let app_stdout = app.clone();
    let app_stderr = app.clone();
    let app_exit = app.clone();

    // Stream stdout
    if let Some(stdout) = child.stdout.take()
    {
        let reader = BufReader::new(stdout);
        tokio::spawn(async move {
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await
            {
                let _ = app_stdout.emit("task-output-line", OutputLinePayload {
                    line,
                    stream: "stdout".to_string(),
                });
            }
        });
    }

    // Stream stderr
    if let Some(stderr) = child.stderr.take()
    {
        let reader = BufReader::new(stderr);
        tokio::spawn(async move {
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await
            {
                let _ = app_stderr.emit("task-output-line", OutputLinePayload {
                    line,
                    stream: "stderr".to_string(),
                });
            }
        });
    }

    // Wait for process exit in background
    tokio::spawn(async move {
        let status = child.wait().await;
        ACTIVE_PID.store(0, Ordering::SeqCst);

        let exit_code = match status
        {
            Ok(s) => s.code().unwrap_or(-1),
            Err(_) => -1,
        };

        let _ = app_exit.emit("task-exit", ExitPayload {
            exit_code,
            signal: None,
        });
    });

    Ok(serde_json::json!({ "pid": pid }))
}

#[tauri::command]
pub fn kill_process() -> Result<(), String>
{
    let pid = ACTIVE_PID.load(Ordering::SeqCst);
    if pid == 0
    {
        return Err("No active process to kill".to_string());
    }

    #[cfg(unix)]
    {
        unsafe {
            libc::kill(pid as i32, libc::SIGTERM);
        }
    }

    #[cfg(windows)]
    {
        let _ = std::process::Command::new("taskkill")
            .args(["/PID", &pid.to_string(), "/T", "/F"])
            .spawn();
    }

    ACTIVE_PID.store(0, Ordering::SeqCst);
    Ok(())
}
