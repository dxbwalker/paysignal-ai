/**
 * Log Redaction Utility
 *
 * Strips API keys, tokens, and PII from all log entries before display or storage.
 * Ensures no sensitive data leaks into the activity log or browser console.
 *
 * Requirements: 12.5
 */

// --- Patterns ---

/**
 * Patterns that match common API key, token, and secret formats.
 * Each pattern has a label for the redaction replacement.
 */
const REDACTION_PATTERNS: { pattern: RegExp; label: string }[] = [
  // Apify API keys (apify_api_...)
  { pattern: /apify_api_[A-Za-z0-9_-]{10,}/g, label: "[REDACTED_APIFY_KEY]" },
  // OpenAI keys (sk-...)
  { pattern: /sk-[A-Za-z0-9]{20,}/g, label: "[REDACTED_API_KEY]" },
  // Generic Bearer tokens
  { pattern: /Bearer\s+[A-Za-z0-9._\-]{20,}/gi, label: "Bearer [REDACTED_TOKEN]" },
  // Generic API keys (long alphanumeric strings that look like keys)
  { pattern: /(?:api[_-]?key|token|secret|password|auth)[=:]\s*["']?[A-Za-z0-9._\-]{16,}["']?/gi, label: "[REDACTED_CREDENTIAL]" },
  // AWS-style keys
  { pattern: /AKIA[A-Z0-9]{16}/g, label: "[REDACTED_AWS_KEY]" },
  // Generic long hex strings (32+ chars, likely tokens)
  { pattern: /\b[0-9a-f]{32,}\b/gi, label: "[REDACTED_HEX_TOKEN]" },
  // Email addresses (PII)
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, label: "[REDACTED_EMAIL]" },
  // Phone numbers (various formats)
  { pattern: /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, label: "[REDACTED_PHONE]" },
  // International phone numbers
  { pattern: /\+\d{1,3}[-.\s]?\d{4,14}/g, label: "[REDACTED_PHONE]" },
  // Authorization headers
  { pattern: /Authorization:\s*[^\s,;]{10,}/gi, label: "Authorization: [REDACTED]" },
  // x-api-key headers
  { pattern: /x-api-key:\s*[^\s,;]{10,}/gi, label: "x-api-key: [REDACTED]" },
];

// --- Main Function ---

/**
 * Redact sensitive information from a log message.
 * Removes API keys, tokens, secrets, and PII patterns.
 *
 * @param message - The raw log message
 * @returns The redacted message safe for display/storage
 */
export function redactLog(message: string): string {
  let redacted = message;

  for (const { pattern, label } of REDACTION_PATTERNS) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
    redacted = redacted.replace(pattern, label);
  }

  return redacted;
}

/**
 * Redact sensitive information from an object (e.g., error details).
 * Recursively processes string values in the object.
 *
 * @param obj - The object to redact
 * @returns A new object with all string values redacted
 */
export function redactObject<T>(obj: T): T {
  if (typeof obj === "string") {
    return redactLog(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactObject(item)) as unknown as T;
  }

  if (obj && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Completely redact known sensitive field names
      if (/key|token|secret|password|auth|credential/i.test(key)) {
        result[key] = "[REDACTED]";
      } else {
        result[key] = redactObject(value);
      }
    }
    return result as T;
  }

  return obj;
}

/**
 * Check if a string contains potentially sensitive data.
 * Useful for pre-screening before logging.
 */
export function containsSensitiveData(message: string): boolean {
  for (const { pattern } of REDACTION_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(message)) {
      return true;
    }
  }
  return false;
}
