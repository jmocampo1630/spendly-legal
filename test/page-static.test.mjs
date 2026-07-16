import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";

const page = await readFile(new URL("../delete-account/index.html", import.meta.url), "utf8");
const styles = await readFile(new URL("../delete-account/styles.css", import.meta.url), "utf8");
const source = await readFile(new URL("../delete-account/src/main.js", import.meta.url), "utf8");
const bundle = await readFile(new URL("../delete-account/app.js", import.meta.url), "utf8");
const privacy = await readFile(new URL("../privacy.md", import.meta.url), "utf8");

test("page loads only local scripts and styles", () => {
  assert.match(page, /<script src="app\.js" defer><\/script>/);
  assert.match(page, /<link rel="stylesheet" href="styles\.css">/);
  assert.doesNotMatch(page, /https?:\/\/[^\s\"']+\.(?:js|css)/i);
});

test("CSP is restrictive and connects only to the Spendly Supabase project", () => {
  const match = page.match(/Content-Security-Policy" content="([^"]+)"/);
  assert.ok(match, "meta CSP must exist");
  const csp = match[1];
  assert.match(csp, /default-src 'none'/);
  assert.match(csp, /script-src 'self'/);
  assert.match(csp, /style-src 'self'/);
  assert.match(csp, /connect-src https:\/\/zdwsdtgixkasvkwjecte\.supabase\.co/);
  assert.match(csp, /base-uri 'none'/);
  assert.match(csp, /form-action 'none'/);
  assert.doesNotMatch(csp, /unsafe-(?:inline|eval)/);
});

test("frame guard keeps the document hidden until top-level JavaScript runs", () => {
  assert.match(page, /<html lang="en" class="frame-guard-pending">/);
  assert.match(styles, /html\.frame-guard-pending\s*{\s*visibility:\s*hidden/);
  assert.match(source, /window\.self === window\.top/);
  assert.match(source, /classList\.remove\("frame-guard-pending"\)/);
});

test("Supabase auth uses PKCE, sessionStorage, no auto-refresh, and the exact redirect", () => {
  assert.match(source, /flowType: "pkce"/);
  assert.match(source, /storage: window\.sessionStorage/);
  assert.match(source, /autoRefreshToken: false/);
  assert.match(
    source,
    /const REDIRECT_URL = "https:\/\/jmocampo1630\.github\.io\/spendly-legal\/delete-account\/"/,
  );
  assert.match(source, /queryParams: { prompt: "select_account" }/);
});

test("deletion request carries intent and never sends an entered identity", () => {
  assert.match(source, /"x-spendly-account-deletion": "delete"/);
  assert.doesNotMatch(source, /body:\s*{[^}]*\b(?:email|userId|user_id)\b/s);
  assert.doesNotMatch(page, /type="email"|name="(?:email|userId|user_id)"/i);
});

test("bundle is committed without source maps or service-role material", async () => {
  await access(new URL("../delete-account/app.js", import.meta.url));
  const files = await readdir(new URL("../delete-account/", import.meta.url));
  assert.equal(files.some((file) => file.endsWith(".map")), false);
  assert.doesNotMatch(bundle, /sourceMappingURL/);
  assert.doesNotMatch(`${page}\n${source}\n${bundle}`, /service[_-]?role/i);
});

test("local-device, backup, retention, and privacy disclosures are present", () => {
  assert.match(page, /cannot reach an old phone, tablet, or computer/i);
  assert.match(page, /Backup files you exported/i);
  assert.match(page, /up to 90 days/i);
  assert.match(page, /Supabase authentication account and profile/i);
  assert.match(page, /href="\.\.\/privacy\.md"/);
  assert.match(privacy, /web account-deletion page/);
  assert.match(privacy, /cannot remotely reach any device/);
});
