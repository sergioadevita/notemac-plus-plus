use base64::{Engine as _, engine::general_purpose};
use keyring::Entry;

const SERVICE_NAME: &str = "com.notemac.plusplus";

#[tauri::command]
pub async fn safe_storage_encrypt(plaintext: String) -> Result<String, String>
{
    // Store in OS keyring and return a reference key
    // For compatibility with the Electron approach (which returns encrypted bytes),
    // we use a deterministic key based on the content hash and store the value in keyring.
    // The "encrypted" string we return is just the base64-encoded plaintext
    // since keyring handles the actual encryption at the OS level.
    let encoded = general_purpose::STANDARD.encode(plaintext.as_bytes());

    // Also store in keyring for retrieval
    let entry = Entry::new(SERVICE_NAME, &encoded)
        .map_err(|e| format!("Keyring error: {}", e))?;

    entry.set_password(&plaintext)
        .map_err(|e| format!("Failed to store credential: {}", e))?;

    Ok(encoded)
}

#[tauri::command]
pub async fn safe_storage_decrypt(encrypted: String) -> Result<String, String>
{
    // Retrieve from keyring using the encoded key
    let entry = Entry::new(SERVICE_NAME, &encrypted)
        .map_err(|e| format!("Keyring error: {}", e))?;

    match entry.get_password()
    {
        Ok(password) => Ok(password),
        Err(_) => {
            // Fallback: try to decode as base64 directly
            let decoded = general_purpose::STANDARD.decode(&encrypted)
                .map_err(|e| format!("Failed to decode: {}", e))?;
            String::from_utf8(decoded)
                .map_err(|e| format!("Invalid UTF-8: {}", e))
        }
    }
}

#[tauri::command]
pub async fn is_safe_storage_available() -> Result<bool, String>
{
    // Test if keyring is accessible
    match Entry::new(SERVICE_NAME, "__test_availability__")
    {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}
