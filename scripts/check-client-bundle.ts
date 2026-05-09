/**
 * Client Bundle Security Check
 * Verifies that no secrets or sensitive environment variables
 * are exposed in the client-side JavaScript bundle.
 *
 * Checks:
 * - No APIFY_API_KEY in client chunks
 * - No LLM_API_KEY in client chunks
 * - No WEB_SEARCH_API_KEY in client chunks
 * - No NEXT_PUBLIC_ prefixed secret patterns
 * - No hardcoded API key patterns (sk-, apify_api_, etc.)
 *
 * Requirements: 13.3, 9.11
 * Run: npx tsx scripts/check-client-bundle.ts
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";

// --- Helpers ---

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

function section(title: string): void {
  console.log(`\n━━━ ${title} ━━━`);
}

// --- Patterns to check ---

const SECRET_PATTERNS = [
  { name: "APIFY_API_KEY", pattern: /APIFY_API_KEY/g },
  { name: "LLM_API_KEY", pattern: /LLM_API_KEY/g },
  { name: "WEB_SEARCH_API_KEY", pattern: /WEB_SEARCH_API_KEY/g },
  { name: "LLM_PROVIDER", pattern: /LLM_PROVIDER/g },
  { name: "OpenAI key pattern (sk-)", pattern: /sk-[a-zA-Z0-9]{20,}/g },
  { name: "Apify key pattern (apify_api_)", pattern: /apify_api_[a-zA-Z0-9]{20,}/g },
  { name: "Bearer token", pattern: /Bearer\s+[a-zA-Z0-9._-]{20,}/g },
];

// Patterns that are OK in client code (references to env var names in comments, etc.)
const ALLOWED_CONTEXTS = [
  "process.env.", // Server-side only references are fine in API routes
  "// ", // Comments
  "/* ", // Block comments
];

// --- Collect client-side JS files ---

function getClientChunks(buildDir: string): string[] {
  const chunksDir = join(buildDir, "static", "chunks");
  const files: string[] = [];

  if (!existsSync(chunksDir)) {
    console.log(`  ⚠ No chunks directory found at ${chunksDir}`);
    return files;
  }

  function walkDir(dir: string): void {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.name.endsWith(".js")) {
        files.push(fullPath);
      }
    }
  }

  walkDir(chunksDir);
  return files;
}

// --- Main ---

section("Build Output Check");

const buildDir = join(process.cwd(), ".next");
assert(existsSync(buildDir), "Build output (.next) directory exists");

if (!existsSync(buildDir)) {
  console.error("\n  ⚠️  Run 'npm run build' first to generate the build output.");
  process.exit(1);
}

// Check client-side chunks
section("Client Bundle Secrets Scan");

const clientChunks = getClientChunks(buildDir);
console.log(`  Scanning ${clientChunks.length} client-side JS files...`);

assert(clientChunks.length > 0, "Found client-side JS chunks to scan");

let totalViolations = 0;

for (const pattern of SECRET_PATTERNS) {
  let found = false;
  const violations: string[] = [];

  for (const file of clientChunks) {
    const content = readFileSync(file, "utf-8");
    const matches = content.match(pattern.pattern);
    if (matches) {
      // Check if it's in an allowed context (unlikely in minified bundles)
      found = true;
      violations.push(`${file.split(".next/")[1]}: ${matches.length} occurrence(s)`);
    }
  }

  if (found) {
    totalViolations += violations.length;
    assert(false, `No "${pattern.name}" in client bundle`);
    for (const v of violations) {
      console.error(`    → ${v}`);
    }
  } else {
    assert(true, `No "${pattern.name}" in client bundle`);
  }
}

// Check the main page HTML for leaked env vars
section("Static HTML Check");

const staticDir = join(buildDir, "server", "pages");
if (existsSync(staticDir)) {
  const htmlFiles = readdirSync(staticDir).filter((f) => f.endsWith(".html"));
  console.log(`  Scanning ${htmlFiles.length} static HTML files...`);

  for (const htmlFile of htmlFiles) {
    const content = readFileSync(join(staticDir, htmlFile), "utf-8");
    for (const pattern of SECRET_PATTERNS) {
      const matches = content.match(pattern.pattern);
      if (matches) {
        totalViolations++;
        assert(false, `No "${pattern.name}" in ${htmlFile}`);
      }
    }
  }

  if (totalViolations === 0) {
    assert(true, "No secrets found in static HTML files");
  }
}

// Check that env.ts only uses server-side access
section("Server-Side Only Env Access");

const envFile = join(process.cwd(), "src", "lib", "env.ts");
if (existsSync(envFile)) {
  const envContent = readFileSync(envFile, "utf-8");

  // Check no NEXT_PUBLIC_ prefix for secrets
  const publicSecrets = envContent.match(/NEXT_PUBLIC_(APIFY|LLM|WEB_SEARCH)/g);
  assert(
    !publicSecrets,
    "env.ts does not expose secrets via NEXT_PUBLIC_ prefix"
  );

  // Check it uses process.env (server-side)
  assert(
    envContent.includes("process.env"),
    "env.ts accesses environment via process.env (server-side)"
  );
} else {
  console.log("  ⚠ src/lib/env.ts not found");
}

// Check next.config.js doesn't expose env vars to client
section("Next.js Config Check");

const nextConfigFile = join(process.cwd(), "next.config.js");
if (existsSync(nextConfigFile)) {
  const configContent = readFileSync(nextConfigFile, "utf-8");

  // Check no env block exposing secrets to client
  const exposesEnv = configContent.match(
    /env\s*:\s*\{[^}]*(APIFY|LLM_API_KEY|WEB_SEARCH)/
  );
  assert(
    !exposesEnv,
    "next.config.js does not expose API keys via env config"
  );

  // Check no publicRuntimeConfig with secrets
  const publicRuntime = configContent.match(
    /publicRuntimeConfig[^}]*(APIFY|LLM_API_KEY|WEB_SEARCH)/
  );
  assert(
    !publicRuntime,
    "next.config.js does not expose secrets via publicRuntimeConfig"
  );
} else {
  console.log("  ⚠ next.config.js not found");
}

// ============================================================
// SUMMARY
// ============================================================

section("Summary");
console.log(`\n  Total: ${passed + failed} checks`);
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
console.log(`  Violations found: ${totalViolations}`);

if (failed > 0) {
  console.error(`\n  ⚠️  ${failed} security check(s) failed! Secrets may be exposed in client bundle.`);
  process.exit(1);
} else {
  console.log(`\n  ✅ No secrets found in client bundle. Safe to deploy.`);
  process.exit(0);
}
