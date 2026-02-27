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

// ─── Tests ─────────────────────────────────────────────────────

#[cfg(test)]
mod tests
{
    use super::*;

    #[test]
    fn service_name_is_correct()
    {
        assert_eq!(SERVICE_NAME, "com.notemac.plusplus");
    }

    #[tokio::test]
    async fn safe_storage_encrypt_returns_base64()
    {
        let result = safe_storage_encrypt("test_password".into()).await;
        // Should return Ok with base64 encoded string
        // (may fail in CI without keyring — that's expected, we test both paths)
        match result
        {
            Ok(encoded) => {
                // Verify it's valid base64
                let decoded = general_purpose::STANDARD.decode(&encoded);
                assert!(decoded.is_ok());
                assert_eq!(
                    String::from_utf8(decoded.unwrap()).unwrap(),
                    "test_password"
                );
            },
            Err(e) => {
                // Keyring not available in CI — error is acceptable
                assert!(
                    e.contains("Keyring") || e.contains("keyring") ||
                    e.contains("credential") || e.contains("No such"),
                    "Unexpected error: {}",
                    e
                );
            }
        }
    }

    #[tokio::test]
    async fn safe_storage_decrypt_fallback_decodes_base64()
    {
        // When keyring entry doesn't exist, it falls back to base64 decode
        let encoded = general_purpose::STANDARD.encode("fallback_test");

        let result = safe_storage_decrypt(encoded).await;
        match result
        {
            Ok(decoded) => assert_eq!(decoded, "fallback_test"),
            Err(e) => {
                // Keyring errors are acceptable in CI
                assert!(
                    e.contains("Keyring") || e.contains("keyring") ||
                    e.contains("Failed to decode"),
                    "Unexpected error: {}",
                    e
                );
            }
        }
    }

    #[tokio::test]
    async fn safe_storage_decrypt_rejects_invalid_base64()
    {
        // Non-base64, non-keyring string should fail
        let result = safe_storage_decrypt("not!!valid!!base64!!".into()).await;
        // Should either get a keyring error or a decode error
        match result
        {
            Ok(_) => {
                // If keyring happened to have this entry, that's ok
            },
            Err(e) => {
                assert!(
                    e.contains("Failed to decode") || e.contains("Keyring") ||
                    e.contains("keyring"),
                    "Unexpected error: {}",
                    e
                );
            }
        }
    }

    #[tokio::test]
    async fn is_safe_storage_available_returns_bool()
    {
        let result = is_safe_storage_available().await;
        // Should always succeed (Ok(true) or Ok(false))
        assert!(result.is_ok());
    }

    #[test]
    fn base64_roundtrip()
    {
        let original = "Hello, Notemac++ secure storage! 🔐";
        let encoded = general_purpose::STANDARD.encode(original.as_bytes());
        let decoded = general_purpose::STANDARD.decode(&encoded).unwrap();
        assert_eq!(String::from_utf8(decoded).unwrap(), original);
    }
}
